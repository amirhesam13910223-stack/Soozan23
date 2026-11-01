/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'sender' | 'admin';

export interface User {
  id: string;
  username: string; // Unique, immutable once created
  displayName: string;
  mobile: string; // Iranian mobile, e.g. 09123456789
  passwordHash: string;
  totpEnabled: boolean;
  totpSecret?: string;
  loginPreference: 'always_full' | 'trusted_device' | 'biometric';
  createdAt: number;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  ipAddress: string;
  isTrusted: boolean;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  isCurrent?: boolean;
}

export interface OtpState {
  id: string;
  target: string;
  purpose: 'register' | 'login' | 'change_password' | 'change_mobile' | 'revoke_all';
  codeHash: string;
  demoCode?: string;
  attempts: number;
  maxAttempts: number; // 4
  createdAt: number;
  expiresAt: number; // 120s TTL
  isLocked: boolean;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  ipAddress: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface SecurityCheckResult {
  name: string;
  category: 'RLS' | 'OTP' | 'SESSION' | 'CRYPTO' | 'SCANNER' | 'VAULT' | 'RESILIENCE' | 'BACKUP';
  passed: boolean;
  message: string;
  details?: string;
}

// PHASE 6 TYPES: GUARDIAN & AUDIT TELEMETRY
export interface GuardianMetrics {
  totalFilesCount: number;
  activeFilesCount: number;
  consumedViewsTotal: number;
  cryptographicallyBurnedCount: number;
  expiredFilesCount: number;
  quarantinedMalwareCount: number;
  passwordBruteForceDestructions: number;
  totalEncryptedBytes: number;
  keyVault: {
    activeKeysCount: number;
    shreddedKeysCount: number;
    vaultIntegrityPercent: number; // 100% when all burned files have zero keys
  };
  categories: Record<AllowedFileCategory, number>;
  statusDistribution: {
    issued: number;
    consuming: number;
    burned: number;
    expired: number;
    quarantined: number;
  };
  serverUptimeSeconds: number;
  lastMaintenanceRunAt: number;
}

export interface GuardianFileMetadata {
  id: string;
  anonymizedOwnerId: string;
  fileName: string;
  fileSize: number;
  category: AllowedFileCategory;
  manageCode: string; // Only management code, NEVER 64-char share code
  status: 'draft' | 'scanned' | 'sealed' | 'issued' | 'consuming' | 'burned' | 'expired' | 'quarantined';
  hasPasswordProtection: boolean;
  consumedViews: number;
  maxViews?: number;
  expiresAt?: number;
  createdAt: number;
  burnedAt?: number;
  burnReason?: string;
  keyIntactInVault: boolean;
  isDeliberable: boolean;
}

export interface CryptographicProofResult {
  fileId: string;
  fileName: string;
  status: string;
  keyId: string;
  keyExistsInVault: boolean;
  rawKeyBytesInStorage: boolean;
  ciphertextPresent: boolean;
  cipherByteLength: number;
  decryptionAttemptResult: 'RECOVERED_ERROR' | 'UNRECOVERABLE_ENTROPY_ZERO' | 'PAYLOAD_ACTIVE';
  mathematicalProofMessage: string;
  verifiedAt: number;
}

// PHASE 2 TYPES: SCANNER & ENCRYPTION PIPELINE

export type AllowedFileCategory = 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive';

export type ScanVerdict = 'clean' | 'suspicious' | 'malicious';

export interface ScanStageDetail {
  stageNumber: number;
  stageName: string;
  passed: boolean;
  verdict: 'clean' | 'flagged' | 'skipped';
  description: string;
  technicalDetails?: string;
}

export interface MalwareScanReport {
  id: string;
  fileName: string;
  fileSize: number;
  declaredMimeType: string;
  detectedMimeType: string;
  sha256Checksum: string;
  stages: ScanStageDetail[];
  finalVerdict: ScanVerdict;
  humanMessage: string;
  scannedAt: number;
  isDeliberable: boolean; // True ONLY if finalVerdict === 'clean'
}

export interface EncryptedPayload {
  cipherBytesHex: string;
  ivHex: string;
  algorithm: 'AES-GCM-256';
  keyId: string;
  originalName: string;
  originalSize: number;
  mimeType: string;
}

export interface DestructionPolicy {
  type: 'views' | 'time' | 'both';
  maxViews?: number;
  consumedViews: number;
  durationMinutes?: number;
  expiresAt?: number;
}

export interface SoozanFileRecord {
  id: string;
  ownerUserId: string;
  fileName: string;
  fileSize: number;
  category: AllowedFileCategory;
  shareCodeHash: string; // ONLY SHA-256 hash stored. Raw 64-char code NEVER stored!
  manageCode: string; // 16-character management code for sender
  encryptedPayload: EncryptedPayload;
  scanReport: MalwareScanReport;
  policy: DestructionPolicy;
  status: 'draft' | 'scanned' | 'sealed' | 'issued' | 'consuming' | 'burned' | 'expired' | 'quarantined';
  filePasswordHash?: string;
  passwordMaxAttempts?: number;
  failedPasswordAttempts?: number;
  burnReason?: string;
  watermarkText?: string;
  senderNote?: string;
  recipientMessages?: string[];
  createdAt: number;
  issuedAt?: number;
  burnedAt?: number;
}
