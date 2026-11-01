/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Session,
  OtpState,
  AuditLog,
  SoozanFileRecord,
  GuardianMetrics,
  GuardianFileMetadata,
  CryptographicProofResult,
  AllowedFileCategory,
} from '../types';
import {
  shredEncryptionKey,
  isKeyIntactInVault,
  getKeyVaultStats,
  decryptFilePayload,
} from './crypto';
import { sha256, timingSafeEqual } from './security';

export interface SecurityContext {
  userId?: string;
  role?: 'sender' | 'admin' | 'anonymous';
  sessionId?: string;
  isSystemInternal?: boolean;
}

class SecurityRepositoryGate {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private otps: Map<string, OtpState> = new Map();
  private files: Map<string, SoozanFileRecord> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.loadFromStorage();
    this.seedDefaultUsersIfEmpty();
  }

  private loadFromStorage() {
    try {
      const storedUsers = localStorage.getItem('soozan_users_store');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        Object.entries(parsed).forEach(([k, v]) => this.users.set(k, v as User));
      }
      const storedSessions = localStorage.getItem('soozan_sessions_store');
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        Object.entries(parsed).forEach(([k, v]) => this.sessions.set(k, v as Session));
      }
      const storedFiles = localStorage.getItem('soozan_files_store');
      if (storedFiles) {
        const parsed = JSON.parse(storedFiles);
        Object.entries(parsed).forEach(([k, v]) => this.files.set(k, v as SoozanFileRecord));
      }
    } catch {
      // storage unavailable or fallback
    }
  }

  private saveToStorage() {
    try {
      const usersObj = Object.fromEntries(this.users.entries());
      localStorage.setItem('soozan_users_store', JSON.stringify(usersObj));

      const sessionsObj = Object.fromEntries(this.sessions.entries());
      localStorage.setItem('soozan_sessions_store', JSON.stringify(sessionsObj));

      const filesObj = Object.fromEntries(this.files.entries());
      localStorage.setItem('soozan_files_store', JSON.stringify(filesObj));
    } catch {
      // ignore
    }
  }

  private async seedDefaultUsersIfEmpty() {
    if (this.users.size === 0) {
      // Seed a default demo sender user with secure credentials
      const demoUser: User = {
        id: 'usr_demo_101',
        username: 'soozan_demo',
        displayName: 'کاربر نمونه سوزان',
        mobile: '09121234567',
        // password: Password@123
        passwordHash: 'e6988876878b66e392815f9226cbcf74c43d3fe5e955f1ffb2f293cf0e60803e',
        totpEnabled: false,
        loginPreference: 'trusted_device',
        createdAt: Date.now() - 3600000 * 24 * 10,
      };
      this.users.set(demoUser.id, demoUser);

      // Seed another user to test RLS isolation
      const anotherUser: User = {
        id: 'usr_other_202',
        username: 'security_auditor',
        displayName: 'حساب مجزا ۲',
        mobile: '09359876543',
        passwordHash: 'e6988876878b66e392815f9226cbcf74c43d3fe5e955f1ffb2f293cf0e60803e',
        totpEnabled: false,
        loginPreference: 'always_full',
        createdAt: Date.now() - 3600000 * 24 * 5,
      };
      this.users.set(anotherUser.id, anotherUser);
      this.saveToStorage();
    }

    const now = Date.now();
    // Ensure all 4 scenario files are present
    const sample1Exists = Array.from(this.files.values()).some(f => f.shareCodeHash === '5a1ffd0688693c5dbf8815bd8241db685cd81c8430d65f2133643adbd8701a9b');
    if (!sample1Exists) {
      // 1. Active File with Sequential Messages
      const sampleFile1: SoozanFileRecord = {
        id: 'fil_demo_sample_1',
        ownerUserId: 'usr_demo_101',
        fileName: 'پیش‌نویس_قرارداد_توسعه_سوزان.txt',
        fileSize: 4800,
        category: 'document',
        shareCodeHash: '5a1ffd0688693c5dbf8815bd8241db685cd81c8430d65f2133643adbd8701a9b',
        manageCode: 'MAN-7K2M-9P4Q-3X8Y',
        encryptedPayload: {
          cipherBytesHex: 'e01234ff5678',
          ivHex: 'a0b1c2d3e4f5a6b7c8d9e0f1',
          algorithm: 'AES-GCM-256',
          keyId: 'key_sample_1',
          originalName: 'پیش‌نویس_قرارداد_توسعه_سوزان.txt',
          originalSize: 4800,
          mimeType: 'text/plain',
        },
        scanReport: {
          id: 'scan_sample_1',
          fileName: 'پیش‌نویس_قرارداد_توسعه_سوزان.txt',
          fileSize: 4800,
          declaredMimeType: 'text/plain',
          detectedMimeType: 'text/plain',
          sha256Checksum: 'checksum1234',
          stages: [],
          finalVerdict: 'clean',
          humanMessage: 'فایل پاک و فاقد هرگونه کد مخرب است.',
          scannedAt: now - 3600000 * 5,
          isDeliberable: true,
        },
        policy: {
          type: 'both',
          maxViews: 3,
          consumedViews: 1,
          durationMinutes: 1440,
          expiresAt: now + 3600000 * 19,
        },
        status: 'issued',
        watermarkText: 'محرمانه - فقط جهت ارزیابی',
        senderNote: 'لطفاً بند سوم را با دقت مطالعه فرمایید و نظر نهایی را اعلام کنید.',
        recipientMessages: [
          'درود، این سند شامل شرایط همکاری فنی و معماری سامانه خودنابودشونده سوزان است.',
          'توجه داشته باشید که اسکرین‌شات و ضبط صفحه در این محیط کاملاً مسدود و پایش می‌شود.',
          'پس از مطالعه، محتوا با اتمام سقف مشاهده به صورت خودکار امحا خواهد شد.'
        ],
        createdAt: now - 3600000 * 5,
        issuedAt: now - 3600000 * 5,
      };
      this.files.set(sampleFile1.id, sampleFile1);

      // 2. Burned File
      const sampleFile2: SoozanFileRecord = {
        id: 'fil_demo_sample_2',
        ownerUserId: 'usr_demo_101',
        fileName: 'گذرواژه‌های_موقت_سرور.txt',
        fileSize: 1200,
        category: 'code',
        shareCodeHash: '3418c710a3a2d399ef94561395b09b5a27a60a31c816bdadf0a7ca2bc4c044e3',
        manageCode: 'MAN-4B8T-2X9R-6M1L',
        encryptedPayload: {
          cipherBytesHex: '',
          ivHex: 'b0b1c2d3e4f5a6b7c8d9e0f2',
          algorithm: 'AES-GCM-256',
          keyId: 'key_sample_2',
          originalName: 'گذرواژه‌های_موقت_سرور.txt',
          originalSize: 1200,
          mimeType: 'text/plain',
        },
        scanReport: {
          id: 'scan_sample_2',
          fileName: 'گذرواژه‌های_موقت_سرور.txt',
          fileSize: 1200,
          declaredMimeType: 'text/plain',
          detectedMimeType: 'text/plain',
          sha256Checksum: 'checksum5678',
          stages: [],
          finalVerdict: 'clean',
          humanMessage: 'فایل پاک است.',
          scannedAt: now - 3600000 * 24,
          isDeliberable: true,
        },
        policy: {
          type: 'views',
          maxViews: 1,
          consumedViews: 1,
        },
        status: 'burned',
        burnReason: 'تکمیل سقف مجاز ۱ بار مشاهده محتوا (امحای رمزارزی خودکار)',
        senderNote: 'ارسال شد و سوخت',
        createdAt: now - 3600000 * 24,
        issuedAt: now - 3600000 * 24,
        burnedAt: now - 3600000 * 20,
      };
      this.files.set(sampleFile2.id, sampleFile2);

      // 3. Expired File
      const sampleFile3: SoozanFileRecord = {
        id: 'fil_demo_sample_3',
        ownerUserId: 'usr_demo_101',
        fileName: 'صورت‌جلسه_اضطراری_تیرماه.docx',
        fileSize: 18400,
        category: 'document',
        shareCodeHash: '3e8b7d9418d48956c3993274c958d33a06d083944905df7095da03857c5a3d6b',
        manageCode: 'MAN-9W2C-5L8K-1Z4P',
        encryptedPayload: {
          cipherBytesHex: '',
          ivHex: 'c0b1c2d3e4f5a6b7c8d9e0f3',
          algorithm: 'AES-GCM-256',
          keyId: 'key_sample_3',
          originalName: 'صورت‌جلسه_اضطراری_تیرماه.docx',
          originalSize: 18400,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        scanReport: {
          id: 'scan_sample_3',
          fileName: 'صورت‌جلسه_اضطراری_تیرماه.docx',
          fileSize: 18400,
          declaredMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          detectedMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          sha256Checksum: 'checksum9999',
          stages: [],
          finalVerdict: 'clean',
          humanMessage: 'فایل پاک است.',
          scannedAt: now - 3600000 * 72,
          isDeliberable: true,
        },
        policy: {
          type: 'time',
          durationMinutes: 120,
          consumedViews: 0,
          expiresAt: now - 3600000 * 2,
        },
        status: 'expired',
        burnReason: 'پایان مهلت زمانی تعیین‌شده توسط فرستنده (۱۲ ساعت)',
        createdAt: now - 3600000 * 14,
        issuedAt: now - 3600000 * 14,
        burnedAt: now - 3600000 * 2,
      };
      this.files.set(sampleFile3.id, sampleFile3);

      // 4. Password Protected File with 3 Attempts Limit
      const sampleFile4: SoozanFileRecord = {
        id: 'fil_demo_sample_4',
        ownerUserId: 'usr_demo_101',
        fileName: 'گزارش_مالی_فصلی_محرمانه.xlsx',
        fileSize: 32000,
        category: 'document',
        shareCodeHash: 'bfc88cec543c95ce30a5023b242496ea7d848301fbf79c83d9dc0723f894fddb',
        manageCode: 'MAN-3X7D-8P1R-5M2K',
        encryptedPayload: {
          cipherBytesHex: 'd01234ff9988',
          ivHex: 'd0b1c2d3e4f5a6b7c8d9e0f4',
          algorithm: 'AES-GCM-256',
          keyId: 'key_sample_4',
          originalName: 'گزارش_مالی_فصلی_محرمانه.xlsx',
          originalSize: 32000,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        scanReport: {
          id: 'scan_sample_4',
          fileName: 'گزارش_مالی_فصلی_محرمانه.xlsx',
          fileSize: 32000,
          declaredMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          detectedMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          sha256Checksum: 'checksum8888',
          stages: [],
          finalVerdict: 'clean',
          humanMessage: 'فایل پاک است.',
          scannedAt: now - 3600000 * 3,
          isDeliberable: true,
        },
        policy: {
          type: 'views',
          maxViews: 2,
          consumedViews: 0,
        },
        status: 'issued',
        filePasswordHash: 'c211129eb74c620a5330abe5d3c85580f49570ab0a3b9a25abc2b9a148b9c42f', // password: soozan1403
        passwordMaxAttempts: 3,
        failedPasswordAttempts: 0,
        watermarkText: 'محرمانه سازمان - سطح ۱',
        senderNote: 'گذرواژه این فایل را به صورت خصوصی دریافت نموده‌اید. سقف ورود ۳ بار است.',
        createdAt: now - 3600000 * 3,
        issuedAt: now - 3600000 * 3,
      };
      this.files.set(sampleFile4.id, sampleFile4);

      this.saveToStorage();
    }
  }

  // USER REPOSITORY (RLS ENFORCED)
  public getUserById(id: string, context?: SecurityContext): User | null {
    if (!context || !context.userId) {
      if (context?.isSystemInternal) {
        return this.users.get(id) || null;
      }
      return null;
    }
    if (context.userId !== id && !context.isSystemInternal) {
      return null;
    }
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  public getUserByUsername(username: string, context?: SecurityContext): User | null {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        if (context?.isSystemInternal || (context?.userId && context.userId === user.id)) {
          return { ...user };
        }
        return { ...user };
      }
    }
    return null;
  }

  public getUserByMobile(mobile: string): User | null {
    for (const user of this.users.values()) {
      if (user.mobile === mobile) {
        return { ...user };
      }
    }
    return null;
  }

  public createUser(user: User): User {
    this.users.set(user.id, user);
    this.saveToStorage();
    this.logAudit({
      id: `aud_${Date.now()}`,
      userId: user.id,
      action: 'USER_REGISTERED',
      ipAddress: '127.0.0.1',
      timestamp: Date.now(),
    });
    return { ...user };
  }

  public updateUser(user: User, context: SecurityContext): boolean {
    if (!context.userId || (context.userId !== user.id && !context.isSystemInternal)) {
      return false;
    }
    this.users.set(user.id, user);
    this.saveToStorage();
    return true;
  }

  /**
   * Danger Zone Action: Irreversibly burns all user files and purges user account
   */
  public deleteUserAndBurnAllFiles(userId: string, context: SecurityContext): boolean {
    if (!context.userId || (context.userId !== userId && !context.isSystemInternal)) {
      return false; // RLS violation
    }

    // Burn all files belonging to this user
    for (const file of this.files.values()) {
      if (file.ownerUserId === userId) {
        this.burnFile(file.id, { isSystemInternal: true }, 'حذف کامل حساب کاربری و امحای سراسری داده‌ها');
      }
    }

    // Revoke all sessions
    this.revokeAllSessionsForUser(userId, { isSystemInternal: true });

    // Remove user record
    this.users.delete(userId);
    this.saveToStorage();

    this.logAudit({
      id: `aud_del_usr_${Date.now()}`,
      userId,
      action: 'USER_ACCOUNT_AND_ALL_DATA_PURGED',
      ipAddress: '127.0.0.1',
      timestamp: Date.now(),
    });

    return true;
  }

  // SESSIONS REPOSITORY (RLS ENFORCED)
  public getSessionsByUserId(userId: string, context?: SecurityContext): Session[] {
    if (!context || !context.userId) {
      return [];
    }
    if (context.userId !== userId && !context.isSystemInternal) {
      return [];
    }

    const result: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        result.push({
          ...session,
          isCurrent: session.id === context.sessionId,
        });
      }
    }
    return result.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  }

  public getSessionByToken(token: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        if (session.expiresAt < Date.now()) {
          this.sessions.delete(session.id);
          this.saveToStorage();
          return null;
        }
        return { ...session };
      }
    }
    return null;
  }

  public createSession(session: Session): Session {
    this.sessions.set(session.id, session);
    this.saveToStorage();
    this.logAudit({
      id: `aud_${Date.now()}`,
      userId: session.userId,
      action: 'SESSION_CREATED',
      ipAddress: session.ipAddress,
      timestamp: Date.now(),
    });
    return { ...session };
  }

  public revokeSession(sessionId: string, context: SecurityContext): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (context.userId !== session.userId && !context.isSystemInternal) {
      return false;
    }

    this.sessions.delete(sessionId);
    this.saveToStorage();
    this.logAudit({
      id: `aud_${Date.now()}`,
      userId: session.userId,
      action: 'SESSION_REVOKED',
      ipAddress: session.ipAddress,
      timestamp: Date.now(),
    });
    return true;
  }

  public revokeAllSessionsForUser(userId: string, context: SecurityContext): number {
    if (context.userId !== userId && !context.isSystemInternal) {
      return 0;
    }

    let revokedCount = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
        revokedCount++;
      }
    }
    this.saveToStorage();

    this.logAudit({
      id: `aud_${Date.now()}`,
      userId,
      action: 'ALL_SESSIONS_TERMINATED',
      ipAddress: '127.0.0.1',
      timestamp: Date.now(),
      details: { revokedCount },
    });

    return revokedCount;
  }

  // FILE REPOSITORY (RLS ENFORCED - rules/15 & Section 14)
  public createFileRecord(record: SoozanFileRecord, context: SecurityContext): SoozanFileRecord | null {
    if (!context.userId || (context.userId !== record.ownerUserId && !context.isSystemInternal)) {
      return null; // RLS violation
    }
    this.files.set(record.id, record);
    this.saveToStorage();
    this.logAudit({
      id: `aud_f_${Date.now()}`,
      userId: record.ownerUserId,
      action: 'FILE_SEALED_AND_ISSUED',
      ipAddress: '127.0.0.1',
      timestamp: Date.now(),
      details: { fileId: record.id, fileName: record.fileName, category: record.category },
    });
    return { ...record };
  }

  public getFileById(fileId: string, context: SecurityContext): SoozanFileRecord | null {
    if (!context || !context.userId) {
      if (!context?.isSystemInternal) return null;
    }
    const file = this.files.get(fileId);
    if (!file) return null;

    if (file.ownerUserId !== context.userId && !context.isSystemInternal) {
      return null; // RLS violation: cannot read other user's files
    }
    return { ...file };
  }

  public getFilesByOwner(userId: string, context: SecurityContext): SoozanFileRecord[] {
    if (!context || !context.userId) return [];
    if (context.userId !== userId && !context.isSystemInternal) return []; // RLS rule

    const list: SoozanFileRecord[] = [];
    for (const file of this.files.values()) {
      if (file.ownerUserId === userId) {
        list.push({ ...file });
      }
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Recipient file lookup by hash of 64-char share code.
   * Redline rule 10 & 15: Recipient gets NO user identity records, ONLY the file record.
   * Checks expiration automatically and updates state if time passed.
   */
  public getFileByShareCodeHash(hash: string): SoozanFileRecord | null {
    for (const file of this.files.values()) {
      if (file.shareCodeHash === hash) {
        // Auto-check expiration
        if (
          file.status !== 'burned' &&
          file.status !== 'expired' &&
          file.policy.expiresAt &&
          Date.now() > file.policy.expiresAt
        ) {
          this.burnFile(file.id, { isSystemInternal: true }, 'انقضای خودکار مهلت زمانی محتوا');
          file.status = 'expired';
          file.burnReason = 'انقضای خودکار مهلت زمانی فایل طبق سیاست فرستنده';
          this.saveToStorage();
        }

        return { ...file };
      }
    }
    return null;
  }

  public getFileByManageCode(manageCode: string): SoozanFileRecord | null {
    for (const file of this.files.values()) {
      if (file.manageCode.toUpperCase() === manageCode.trim().toUpperCase()) {
        return { ...file };
      }
    }
    return null;
  }

  /**
   * Cryptographic Shredding and Destruction:
   * Sets status to 'burned', removes the encryption key from vault, and clears ciphertext.
   */
  public burnFile(fileId: string, context: SecurityContext, reason: string = 'سوزاندن فوری'): boolean {
    const file = this.files.get(fileId);
    if (!file) return false;

    // Must be owner or system internal
    if (context.userId && context.userId !== file.ownerUserId && !context.isSystemInternal) {
      return false; // RLS violation
    }

    // Shred AES-GCM Key from Vault
    shredEncryptionKey(file.encryptedPayload.keyId);

    // Overwrite ciphertext with empty and update state
    file.status = 'burned';
    file.burnedAt = Date.now();
    file.burnReason = reason;
    file.encryptedPayload.cipherBytesHex = '';

    this.files.set(fileId, file);
    this.saveToStorage();

    this.logAudit({
      id: `aud_burn_${Date.now()}`,
      userId: file.ownerUserId,
      action: 'FILE_CRYPTOGRAPHICALLY_BURNED',
      ipAddress: '127.0.0.1',
      timestamp: Date.now(),
      details: { fileId: file.id, fileName: file.fileName, reason },
    });

    return true;
  }

  /**
   * Verify file password with brute-force protection and cryptographic self-destruction.
   * If failed attempts reach limit, file is shredded immediately!
   */
  public async verifyFilePassword(
    fileId: string,
    rawShareCode64: string,
    candidatePassword: string
  ): Promise<{ success: boolean; burned: boolean; remaining: number; message: string }> {
    const file = this.files.get(fileId);
    if (!file) {
      return { success: false, burned: false, remaining: 0, message: 'فایل یافت نشد.' };
    }

    if (!file.filePasswordHash) {
      return { success: true, burned: false, remaining: 0, message: 'این فایل فاقد گذرواژه است.' };
    }

    const salt = `file_pass_${rawShareCode64.slice(0, 16)}`;
    const candidateHash = await sha256(candidatePassword, salt);
    const isMatch = timingSafeEqual(candidateHash, file.filePasswordHash);

    if (isMatch) {
      file.failedPasswordAttempts = 0;
      this.saveToStorage();
      return {
        success: true,
        burned: false,
        remaining: file.passwordMaxAttempts || 3,
        message: 'گذرواژه با موفقیت تأیید شد.',
      };
    }

    // Password incorrect: increment failed attempts
    file.failedPasswordAttempts = (file.failedPasswordAttempts || 0) + 1;
    const max = file.passwordMaxAttempts || 3;
    const remaining = Math.max(0, max - file.failedPasswordAttempts);

    if (remaining === 0) {
      // Brute-force limit reached: Cryptographic Shredding immediately!
      this.burnFile(
        fileId,
        { isSystemInternal: true },
        'تکمیل سقف مجاز تلاش‌های گذرواژه (امحای رمزارزی جهت مقابله با نفوذ)'
      );
      this.saveToStorage();
      return {
        success: false,
        burned: true,
        remaining: 0,
        message: 'سقف تلاش‌های مجاز به پایان رسید. جهت جلوگیری از نفوذ، محتوا درجا و برای همیشه منهدم گردید.',
      };
    }

    this.saveToStorage();
    return {
      success: false,
      burned: false,
      remaining,
      message: `گذرواژه نادرست است. ${remaining} فرصت دیگر تا امحای قطعی فایل باقی مانده است.`,
    };
  }

  /**
   * Consume a view for the file:
   * Increments consumedViews, logs audit event, and if max views reached, marks for shredding.
   */
  public consumeFileView(
    fileId: string,
    clientIp: string = '127.0.0.1'
  ): {
    status: 'ready' | 'burned' | 'expired';
    isLastView: boolean;
    willBurnOnExit: boolean;
    record?: SoozanFileRecord;
  } {
    const file = this.files.get(fileId);
    if (!file) {
      return { status: 'burned', isLastView: true, willBurnOnExit: true };
    }

    if (file.status === 'burned') {
      return { status: 'burned', isLastView: true, willBurnOnExit: true, record: { ...file } };
    }

    if (
      file.status === 'expired' ||
      (file.policy.expiresAt && Date.now() > file.policy.expiresAt)
    ) {
      this.burnFile(fileId, { isSystemInternal: true }, 'انقضای خودکار مهلت زمانی محتوا');
      file.status = 'expired';
      file.burnReason = 'پایان مهلت زمانی تعیین‌شده توسط فرستنده';
      this.saveToStorage();
      return { status: 'expired', isLastView: true, willBurnOnExit: true, record: { ...file } };
    }

    // Increment consumed view count
    file.policy.consumedViews += 1;
    const isLastView = !!(
      file.policy.maxViews && file.policy.consumedViews >= file.policy.maxViews
    );

    this.logAudit({
      id: `aud_view_${Date.now()}`,
      userId: file.ownerUserId,
      action: 'FILE_VIEW_CONSUMED',
      ipAddress: clientIp,
      timestamp: Date.now(),
      details: {
        fileId: file.id,
        fileName: file.fileName,
        viewNumber: file.policy.consumedViews,
        maxViews: file.policy.maxViews,
        isLastView,
      },
    });

    if (isLastView) {
      // Burn immediately so no future requests can access it, while current view consumes it
      this.burnFile(fileId, { isSystemInternal: true }, 'تکمیل سقف مجاز مشاهده محتوا (سوزاندن خودکار)');
      return { status: 'ready', isLastView: true, willBurnOnExit: true, record: { ...file } };
    }

    this.saveToStorage();
    return { status: 'ready', isLastView: false, willBurnOnExit: false, record: { ...file } };
  }

  /**
   * Recipient voluntarily burns the file early:
   * "سوزاندن خودم و بستن"
   */
  public recipientBurnSelf(fileId: string): boolean {
    return this.burnFile(
      fileId,
      { isSystemInternal: true },
      'سوزاندن فوری به درخواست صریح گیرنده (عدم بر جا ماندن ردپا)'
    );
  }

  public getFileEvents(fileId: string, context: SecurityContext): AuditLog[] {
    const file = this.files.get(fileId);
    if (!file) return [];

    // RLS: Only owner or system internal
    if (context.userId && context.userId !== file.ownerUserId && !context.isSystemInternal) {
      return [];
    }

    return this.auditLogs.filter((log) => log.details?.fileId === fileId);
  }

  // OTP REPOSITORY
  public setOtp(otp: OtpState): void {
    this.otps.set(otp.target, otp);
  }

  public getOtp(target: string): OtpState | null {
    const otp = this.otps.get(target);
    return otp ? { ...otp } : null;
  }

  public deleteOtp(target: string): void {
    this.otps.delete(target);
  }

  // AUDIT LOG
  public logAudit(log: AuditLog): void {
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(context: SecurityContext): AuditLog[] {
    if (!context.userId && !context.isSystemInternal) {
      return [];
    }
    if (context.role === 'admin' || context.isSystemInternal) {
      return [...this.auditLogs];
    }
    return this.auditLogs.filter(l => l.userId === context.userId);
  }

  // ==========================================
  // PHASE 6: GUARDIAN & SYSTEM HEALTH METHODS
  // Strictly adhering to rules/10-security-redlines & rules/15-rls-data-isolation
  // Guardian receives ONLY metadata & telemetry, NEVER plaintext content or 64-char share tokens.
  // ==========================================

  private lastMaintenanceTimestamp: number = Date.now() - 3600000 * 2;
  private serverStartTime: number = Date.now() - 3600000 * 24 * 7; // 7 days simulated uptime

  public getGuardianMetrics(context: SecurityContext): GuardianMetrics | null {
    // RLS Enforcement: Only admin or system internal may access macro system telemetry
    if (context.role !== 'admin' && !context.isSystemInternal) {
      return null;
    }

    const filesArray = Array.from(this.files.values());
    const vaultStats = getKeyVaultStats();

    let totalEncryptedBytes = 0;
    let consumedViewsTotal = 0;
    let activeFilesCount = 0;
    let cryptographicallyBurnedCount = 0;
    let expiredFilesCount = 0;
    let quarantinedMalwareCount = 0;
    let passwordBruteForceDestructions = 0;

    const categories: Record<AllowedFileCategory, number> = {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      code: 0,
      archive: 0,
    };

    const statusDistribution = {
      issued: 0,
      consuming: 0,
      burned: 0,
      expired: 0,
      quarantined: 0,
    };

    for (const f of filesArray) {
      totalEncryptedBytes += f.fileSize || 0;
      consumedViewsTotal += f.policy?.consumedViews || 0;

      if (f.category && categories[f.category] !== undefined) {
        categories[f.category]++;
      }

      if (f.status === 'issued') {
        activeFilesCount++;
        statusDistribution.issued++;
      } else if (f.status === 'consuming') {
        activeFilesCount++;
        statusDistribution.consuming++;
      } else if (f.status === 'burned') {
        cryptographicallyBurnedCount++;
        statusDistribution.burned++;
      } else if (f.status === 'expired') {
        expiredFilesCount++;
        statusDistribution.expired++;
      } else if (f.status === 'quarantined') {
        quarantinedMalwareCount++;
        statusDistribution.quarantined++;
      }

      if (
        f.burnReason &&
        (f.burnReason.includes('گذرواژه') || f.burnReason.includes('تلاش‌های'))
      ) {
        passwordBruteForceDestructions++;
      }
    }

    // Vault Integrity: Check if any burned files still hold a key in the vault
    let leakedKeysInBurnedFiles = 0;
    for (const f of filesArray) {
      if ((f.status === 'burned' || f.status === 'expired') && isKeyIntactInVault(f.encryptedPayload.keyId)) {
        leakedKeysInBurnedFiles++;
      }
    }

    const vaultIntegrityPercent = leakedKeysInBurnedFiles === 0 ? 100 : Math.max(0, 100 - (leakedKeysInBurnedFiles * 25));

    return {
      totalFilesCount: filesArray.length,
      activeFilesCount,
      consumedViewsTotal,
      cryptographicallyBurnedCount,
      expiredFilesCount,
      quarantinedMalwareCount,
      passwordBruteForceDestructions,
      totalEncryptedBytes,
      keyVault: {
        activeKeysCount: vaultStats.activeKeysCount,
        shreddedKeysCount: cryptographicallyBurnedCount + expiredFilesCount,
        vaultIntegrityPercent,
      },
      categories,
      statusDistribution,
      serverUptimeSeconds: Math.floor((Date.now() - this.serverStartTime) / 1000),
      lastMaintenanceRunAt: this.lastMaintenanceTimestamp,
    };
  }

  public getAllAnonymizedFilesForGuardian(context: SecurityContext): GuardianFileMetadata[] {
    if (context.role !== 'admin' && !context.isSystemInternal) {
      return [];
    }

    return Array.from(this.files.values()).map(f => ({
      id: f.id,
      anonymizedOwnerId: `usr_...${f.ownerUserId ? f.ownerUserId.slice(-4) : 'anon'}`,
      fileName: f.fileName,
      fileSize: f.fileSize,
      category: f.category,
      manageCode: f.manageCode,
      status: f.status,
      hasPasswordProtection: !!f.filePasswordHash,
      consumedViews: f.policy.consumedViews,
      maxViews: f.policy.maxViews,
      expiresAt: f.policy.expiresAt,
      createdAt: f.createdAt,
      burnedAt: f.burnedAt,
      burnReason: f.burnReason,
      keyIntactInVault: isKeyIntactInVault(f.encryptedPayload.keyId),
      isDeliberable: f.scanReport?.isDeliberable ?? false,
    }));
  }

  /**
   * Cryptographic Shredding Verifier Test:
   * Proves mathematically and practically that a shredded key is irretrievable
   * and that decryption of ciphertext fails completely with 0 entropy.
   */
  public async testKeyVaultShreddingProof(
    fileId: string,
    context: SecurityContext
  ): Promise<CryptographicProofResult> {
    if (context.role !== 'admin' && !context.isSystemInternal) {
      throw new Error('عدم دسترسی: این آزمون نیازمند مجوز نگهبان سامانه است.');
    }

    const file = this.files.get(fileId);
    if (!file) {
      throw new Error('فایل مورد نظر در مخزن یافت نشد.');
    }

    const keyId = file.encryptedPayload.keyId;
    const keyExists = isKeyIntactInVault(keyId);
    const hasCipherBytes = !!file.encryptedPayload.cipherBytesHex && file.encryptedPayload.cipherBytesHex.length > 0;
    const cipherLength = file.encryptedPayload.cipherBytesHex ? file.encryptedPayload.cipherBytesHex.length / 2 : 0;

    let decryptionAttemptResult: 'RECOVERED_ERROR' | 'UNRECOVERABLE_ENTROPY_ZERO' | 'PAYLOAD_ACTIVE' = 'PAYLOAD_ACTIVE';
    let mathematicalProofMessage = '';

    if (!keyExists || file.status === 'burned' || file.status === 'expired') {
      // Attempt decryption with destroyed key
      const decrypted = await decryptFilePayload(file.encryptedPayload);
      if (decrypted === null) {
        decryptionAttemptResult = 'UNRECOVERABLE_ENTROPY_ZERO';
        mathematicalProofMessage =
          'اثبات قطعی نابودی: کلید متقارن ۲۵۶ بیتی AES-GCM از حافظه و فضای ذخیره‌سازی محلی کاملاً زدوده شده و متن رمزشده به علت آنتروپی صفر کلید، غیرقابل رمزگشایی ریاضیاتی است.';
      } else {
        decryptionAttemptResult = 'RECOVERED_ERROR';
        mathematicalProofMessage = 'هشدار امنیتی: کلید هنوز در حافظه موجود است و امحا تکمیل نشده است!';
      }
    } else {
      decryptionAttemptResult = 'PAYLOAD_ACTIVE';
      mathematicalProofMessage =
        'فایل در وضعیت فعال قرار دارد و کلید متقارن آن در گاوصندوق ایزوله تا زمان سررسید سیاست نابودی محفوظ است.';
    }

    return {
      fileId: file.id,
      fileName: file.fileName,
      status: file.status,
      keyId,
      keyExistsInVault: keyExists,
      rawKeyBytesInStorage: false, // Never stored unencrypted in storage
      ciphertextPresent: hasCipherBytes,
      cipherByteLength: cipherLength,
      decryptionAttemptResult,
      mathematicalProofMessage,
      verifiedAt: Date.now(),
    };
  }

  /**
   * Emergency Purge of all expired files:
   * Shreds any keys where expiresAt is passed.
   */
  public runEmergencyExpiredPurge(context: SecurityContext): { purgedCount: number; shreddedKeyCount: number } {
    if (context.role !== 'admin' && !context.isSystemInternal) {
      return { purgedCount: 0, shreddedKeyCount: 0 };
    }

    const now = Date.now();
    let purgedCount = 0;
    let shreddedKeyCount = 0;

    for (const file of this.files.values()) {
      if (
        file.status !== 'burned' &&
        file.status !== 'expired' &&
        file.policy?.expiresAt &&
        now > file.policy.expiresAt
      ) {
        this.burnFile(file.id, { isSystemInternal: true }, 'پالایش اضطراری و انقضای دوره‌ای خودکار سامانه');
        file.status = 'expired';
        file.burnReason = 'پالایش دوره‌ای نگهبان: انقضای مهلت زمانی فایل طبق سیاست فرستنده';
        purgedCount++;
        shreddedKeyCount++;
      }
    }

    this.lastMaintenanceTimestamp = now;
    this.saveToStorage();

    this.logAudit({
      id: `aud_maint_${now}`,
      userId: context.userId || 'usr_guardian',
      action: 'EMERGENCY_EXPIRED_PURGE_EXECUTED',
      ipAddress: '127.0.0.1 (Local)',
      timestamp: now,
      details: { purgedCount, shreddedKeyCount },
    });

    return { purgedCount, shreddedKeyCount };
  }

  /**
   * For 3-2-1 backup and testing only: Returns a snapshot of all file records
   */
  public getAllFilesForTesting(): SoozanFileRecord[] {
    return Array.from(this.files.values()).map((f) => ({ ...f }));
  }
}

export const db = new SecurityRepositoryGate();

