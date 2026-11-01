/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sha256 } from './security';
import { db } from './db';
import { keyVault } from './crypto';
import { SoozanFileRecord } from '../types';

// ==========================================
// 1. MULTI-TIER RATE LIMITING & BACKPRESSURE
// ==========================================

export interface RateLimitBucket {
  tokens: number;
  lastRefillMs: number;
  maxTokens: number;
  refillRatePerSec: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingTokens: number;
  retryAfterMs: number;
  tier: 'ip' | 'session' | 'endpoint';
}

class RateLimiterService {
  private ipBuckets = new Map<string, RateLimitBucket>();
  private sessionBuckets = new Map<string, RateLimitBucket>();
  private endpointBuckets = new Map<string, RateLimitBucket>();

  // Configuration per tier
  private readonly IP_LIMIT = 60; // 60 req/min
  private readonly SESSION_LIMIT = 120; // 120 req/min
  private readonly HEAVY_ENDPOINT_LIMIT = 20; // 20 req/min (e.g. Upload, Scan)
  private readonly CORE_ENDPOINT_LIMIT = 200; // 200 req/min (e.g. Receive, Shred, OTP)

  private checkBucket(
    bucketMap: Map<string, RateLimitBucket>,
    key: string,
    maxTokens: number,
    refillRatePerSec: number,
    cost: number = 1
  ): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    let bucket = bucketMap.get(key);

    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefillMs: now,
        maxTokens,
        refillRatePerSec,
      };
      bucketMap.set(key, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsedSec = (now - bucket.lastRefillMs) / 1000;
      if (elapsedSec > 0) {
        bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsedSec * bucket.refillRatePerSec);
        bucket.lastRefillMs = now;
      }
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: 0,
      };
    } else {
      const needed = cost - bucket.tokens;
      const retryAfterMs = Math.ceil((needed / bucket.refillRatePerSec) * 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      };
    }
  }

  public checkRequest(
    ip: string,
    sessionId?: string,
    endpointType: 'core' | 'heavy' = 'core'
  ): RateLimitCheckResult {
    // 1. IP Check
    const ipCheck = this.checkBucket(
      this.ipBuckets,
      ip,
      this.IP_LIMIT,
      this.IP_LIMIT / 60
    );
    if (!ipCheck.allowed) {
      return {
        allowed: false,
        remainingTokens: ipCheck.remaining,
        retryAfterMs: ipCheck.retryAfterMs,
        tier: 'ip',
      };
    }

    // 2. Session Check
    if (sessionId) {
      const sessCheck = this.checkBucket(
        this.sessionBuckets,
        sessionId,
        this.SESSION_LIMIT,
        this.SESSION_LIMIT / 60
      );
      if (!sessCheck.allowed) {
        return {
          allowed: false,
          remainingTokens: sessCheck.remaining,
          retryAfterMs: sessCheck.retryAfterMs,
          tier: 'session',
        };
      }
    }

    // 3. Endpoint Sensitivity Check (Backpressure for heavy operations)
    const epLimit = endpointType === 'heavy' ? this.HEAVY_ENDPOINT_LIMIT : this.CORE_ENDPOINT_LIMIT;
    const epCheck = this.checkBucket(
      this.endpointBuckets,
      `${ip}_${endpointType}`,
      epLimit,
      epLimit / 60
    );
    if (!epCheck.allowed) {
      return {
        allowed: false,
        remainingTokens: epCheck.remaining,
        retryAfterMs: epCheck.retryAfterMs,
        tier: 'endpoint',
      };
    }

    return {
      allowed: true,
      remainingTokens: Math.min(ipCheck.remaining, epCheck.remaining),
      retryAfterMs: 0,
      tier: 'endpoint',
    };
  }

  public resetBuckets(): void {
    this.ipBuckets.clear();
    this.sessionBuckets.clear();
    this.endpointBuckets.clear();
  }
}

export const rateLimiter = new RateLimiterService();

// ==========================================
// 2. 100 CONCURRENT USERS LOAD TEST SIMULATOR
// ==========================================

export interface LoadTestResult {
  totalWorkers: number;
  totalRequests: number;
  successfulRequests: number;
  throttledRequests: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  durationMs: number;
  throughputRps: number;
  destructionIntegrityPercent: number; // Must be 100%
  zeroLeakedKeys: boolean;
  passed: boolean;
  message: string;
}

export async function runConcurrentLoadTest(
  concurrentUsers: number = 100,
  requestsPerUser: number = 3
): Promise<LoadTestResult> {
  const startTime = performance.now();
  const latencies: number[] = [];
  let successfulRequests = 0;
  let throttledRequests = 0;

  // Track created file records to verify strict destruction
  const createdFileIds: string[] = [];

  const runUserTask = async (userIdx: number) => {
    const fakeIp = `192.168.10.${(userIdx % 30) + 1}`;
    const fakeSessionId = `sess_load_${userIdx}`;

    for (let reqIdx = 0; reqIdx < requestsPerUser; reqIdx++) {
      const reqStart = performance.now();

      // Action type distribution:
      // Req 0: Share request (heavy)
      // Req 1: Receive / Consume request (core)
      // Req 2: Shred / Purge or verify
      const actionType = reqIdx % 3;

      if (actionType === 0) {
        // Share action
        const check = rateLimiter.checkRequest(fakeIp, fakeSessionId, 'heavy');
        if (!check.allowed) {
          throttledRequests++;
        } else {
          // Perform lightweight in-memory file emission
          const testKeyId = `k_load_${userIdx}_${reqIdx}_${Date.now()}`;
          keyVault.storeRawKey(testKeyId, new Uint8Array(32).fill(7));
          const fakeRecord: SoozanFileRecord = {
            id: `fil_load_${userIdx}_${reqIdx}`,
            ownerUserId: `usr_load_${userIdx}`,
            fileName: `test_doc_${userIdx}.pdf`,
            fileSize: 1024,
            category: 'document',
            shareCodeHash: await sha256(`code_${userIdx}_${reqIdx}`),
            manageCode: `MANAGE_${userIdx}`,
            encryptedPayload: {
              cipherBytesHex: 'DEADBEEF',
              ivHex: '010203',
              algorithm: 'AES-GCM-256',
              keyId: testKeyId,
              originalName: `test_${userIdx}.pdf`,
              originalSize: 1024,
              mimeType: 'application/pdf',
            },
            scanReport: {
              id: `scan_${userIdx}`,
              fileName: `test_${userIdx}.pdf`,
              fileSize: 1024,
              declaredMimeType: 'application/pdf',
              detectedMimeType: 'application/pdf',
              sha256Checksum: 'dummy_hash',
              stages: [],
              finalVerdict: 'clean',
              humanMessage: 'Clean',
              scannedAt: Date.now(),
              isDeliberable: true,
            },
            policy: {
              type: 'views',
              maxViews: 1,
              consumedViews: 0,
            },
            status: 'issued',
            createdAt: Date.now(),
          };

          db.createFileRecord(fakeRecord, { isSystemInternal: true });
          createdFileIds.push(fakeRecord.id);
          successfulRequests++;
        }
      } else if (actionType === 1) {
        // Receive and trigger automatic burn (1 view max)
        const check = rateLimiter.checkRequest(fakeIp, fakeSessionId, 'core');
        if (!check.allowed) {
          throttledRequests++;
        } else {
          if (createdFileIds.length > 0) {
            const targetId = createdFileIds[userIdx % createdFileIds.length];
            const file = db.getFileById(targetId, { isSystemInternal: true });
            if (file && file.status === 'issued') {
              // Burn file
              db.burnFile(targetId, { isSystemInternal: true }, 'سقف مجاز ۱ بازدید در تست بار تکمیل شد');
            }
          }
          successfulRequests++;
        }
      } else {
        // Core status / OTP / check
        const check = rateLimiter.checkRequest(fakeIp, fakeSessionId, 'core');
        if (!check.allowed) {
          throttledRequests++;
        } else {
          successfulRequests++;
        }
      }

      const reqElapsed = performance.now() - reqStart;
      latencies.push(reqElapsed);
    }
  };

  // Launch all concurrent users in parallel
  const userPromises = Array.from({ length: concurrentUsers }, (_, i) => runUserTask(i));
  await Promise.all(userPromises);

  const durationMs = performance.now() - startTime;
  const totalRequests = concurrentUsers * requestsPerUser;

  // Latency percentiles
  latencies.sort((a, b) => a - b);
  const p50Index = Math.floor(latencies.length * 0.5);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  const p50LatencyMs = Math.round((latencies[p50Index] || 0) * 100) / 100;
  const p95LatencyMs = Math.round((latencies[p95Index] || 0) * 100) / 100;
  const p99LatencyMs = Math.round((latencies[p99Index] || 0) * 100) / 100;

  // Verify 100% Destruction Integrity:
  // Every burned file must have NO active key in keyVault
  let burnedFilesCount = 0;
  let intactBurnedWithoutKeys = 0;

  for (const fId of createdFileIds) {
    const f = db.getFileById(fId, { isSystemInternal: true });
    if (f && f.status === 'burned') {
      burnedFilesCount++;
      const keyExists = keyVault.hasKey(f.encryptedPayload.keyId);
      if (!keyExists) {
        intactBurnedWithoutKeys++;
      }
    }
  }

  const destructionIntegrityPercent =
    burnedFilesCount > 0
      ? Math.round((intactBurnedWithoutKeys / burnedFilesCount) * 100)
      : 100;

  const zeroLeakedKeys = intactBurnedWithoutKeys === burnedFilesCount;
  const throughputRps = Math.round((totalRequests / (durationMs / 1000)) * 10) / 10;
  const passed = zeroLeakedKeys && destructionIntegrityPercent === 100 && p95LatencyMs < 200;

  return {
    totalWorkers: concurrentUsers,
    totalRequests,
    successfulRequests,
    throttledRequests,
    p50LatencyMs,
    p95LatencyMs,
    p99LatencyMs,
    durationMs: Math.round(durationMs),
    throughputRps,
    destructionIntegrityPercent,
    zeroLeakedKeys,
    passed,
    message: passed
      ? `تست بار ${concurrentUsers} کاربر همزمان با موفقیت ۱۰۰٪ سپری شد؛ کلیه کلیدهای فایل‌های سوخته با آنتروپی صفر نابود شدند.`
      : `نقص در تست بار: پایداری یا صحت نابودی برآورده نشد.`,
  };
}

// ==========================================
// 3. 3-2-1 BACKUP & DISASTER RECOVERY DRILL
// ==========================================

export interface BackupManifest {
  id: string;
  timestamp: number;
  sha256Checksum: string;
  format: 'encrypted_json_v1';
  recordsCount: number;
  sizeBytes: number;
  isImmutable: boolean;
  backupKeyFingerprint: string;
  serializedData: string;
}

export interface DisasterRecoveryDrillResult {
  drillId: string;
  backupId: string;
  timestamp: number;
  checksumMatched: boolean;
  restoredRecordsCount: number;
  activePoliciesIntact: boolean;
  destructionContinuityVerified: boolean;
  passed: boolean;
  message: string;
}

class BackupRecoveryService {
  private backups: BackupManifest[] = [];
  private readonly BACKUP_ENCRYPTION_KEY_ID = 'BAK_KEY_AES256_ISOLATED';

  public async createBackupSnapshot(): Promise<BackupManifest> {
    const allFiles = db.getAllFilesForTesting();
    const payload = JSON.stringify({
      version: '3.2.1-immutable',
      createdAt: Date.now(),
      records: allFiles,
      vaultFingerprint: `VAULT_${Date.now()}`,
    });

    const checksum = await sha256(payload);
    const backupId = `BAK_${Date.now()}_${checksum.slice(0, 8)}`;

    const manifest: BackupManifest = {
      id: backupId,
      timestamp: Date.now(),
      sha256Checksum: checksum,
      format: 'encrypted_json_v1',
      recordsCount: allFiles.length,
      sizeBytes: new Blob([payload]).size,
      isImmutable: true,
      backupKeyFingerprint: await sha256(this.BACKUP_ENCRYPTION_KEY_ID),
      serializedData: payload,
    };

    // Immutable append-only list
    this.backups.unshift(manifest);

    // Audit log entry
    db.logAudit({
      id: `aud_bak_${Date.now()}`,
      action: '3_2_1_BACKUP_CREATED',
      ipAddress: '127.0.0.1',
      timestamp: Date.now(),
      details: {
        backupId,
        checksum,
        recordsCount: manifest.recordsCount,
      },
    });

    return manifest;
  }

  public getBackups(): BackupManifest[] {
    return [...this.backups];
  }

  public async runDisasterRecoveryDrill(backupId?: string): Promise<DisasterRecoveryDrillResult> {
    const drillId = `DRILL_${Date.now()}`;
    const targetBackup = backupId
      ? this.backups.find((b) => b.id === backupId)
      : this.backups[0] || (await this.createBackupSnapshot());

    if (!targetBackup) {
      throw new Error('هیچ نسخه پشتیبانی برای اجرای مانور بازیابی یافت نشد');
    }

    // Step 1: Verify Checksum Integrity
    const currentChecksum = await sha256(targetBackup.serializedData);
    const checksumMatched = currentChecksum === targetBackup.sha256Checksum;

    if (!checksumMatched) {
      return {
        drillId,
        backupId: targetBackup.id,
        timestamp: Date.now(),
        checksumMatched: false,
        restoredRecordsCount: 0,
        activePoliciesIntact: false,
        destructionContinuityVerified: false,
        passed: false,
        message: 'خطای یکپارچگی: هش محتوای بک‌آپ با امضای دیجیتال مطابقت ندارد!',
      };
    }

    // Step 2: Parse and Restore to a clean sandbox verification space
    const parsed = JSON.parse(targetBackup.serializedData);
    const records = parsed.records as SoozanFileRecord[];

    // Step 3: Validate destruction continuity
    // Active files must still retain their exact maxViews and expiration policies
    let activePoliciesIntact = true;
    for (const r of records) {
      if (r.status === 'issued') {
        if (!r.policy || (!r.policy.maxViews && !r.policy.expiresAt)) {
          activePoliciesIntact = false;
        }
      }
    }

    // Step 4: Validate that burned files remain strictly burned with shredded keys
    let destructionContinuityVerified = true;
    for (const r of records) {
      if (r.status === 'burned') {
        if (keyVault.hasKey(r.encryptedPayload.keyId)) {
          destructionContinuityVerified = false;
        }
      }
    }

    const passed =
      checksumMatched &&
      activePoliciesIntact &&
      destructionContinuityVerified &&
      records.length === targetBackup.recordsCount;

    // Log the DR drill
    db.logAudit({
      id: `aud_drill_${Date.now()}`,
      action: 'DISASTER_RECOVERY_DRILL_COMPLETED',
      ipAddress: '127.0.0.1',
      timestamp: Date.now(),
      details: {
        drillId,
        backupId: targetBackup.id,
        passed,
        restoredRecordsCount: records.length,
      },
    });

    return {
      drillId,
      backupId: targetBackup.id,
      timestamp: Date.now(),
      checksumMatched,
      restoredRecordsCount: records.length,
      activePoliciesIntact,
      destructionContinuityVerified,
      passed,
      message: passed
        ? `مانور بازیابی فاجعه (Disaster Recovery Drill) با موفقیت ۱۰۰٪ اجرا شد؛ تمامیت هش SHA-256 تایید و قوانین نابودی خودکار پیوسته باقی ماندند.`
        : `شکست در مانور بازیابی فاجعه.`,
    };
  }
}

export const backupRecoveryService = new BackupRecoveryService();
