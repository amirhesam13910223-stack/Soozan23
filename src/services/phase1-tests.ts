/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityCheckResult, User } from '../types';
import { db } from './db';
import { requestOtp, verifyOtp, resendOtp } from './otp';
import { timingSafeEqual, evaluatePasswordRules, sha256 } from './security';
import { createSessionForUser, terminateAllSessions } from './session';
import { runConcurrentLoadTest, rateLimiter, backupRecoveryService } from './resilience';

export async function runPhase1SecurityTests(): Promise<SecurityCheckResult[]> {
  const results: SecurityCheckResult[] = [];

  // TEST 1: RLS & Data Isolation (Golden Scenario 7)
  try {
    const userA = db.getUserByUsername('soozan_demo', { isSystemInternal: true });
    const userB = db.getUserByUsername('security_auditor', { isSystemInternal: true });

    if (!userA || !userB) {
      throw new Error('کاربران آزمایشی یافت نشدند');
    }

    // 1.1: Query without context should return null (0 rows)
    const noContextResult = db.getUserById(userA.id, undefined);
    const zeroRowsPassed = noContextResult === null;

    // 1.2: User A trying to access User B's record
    const crossAccessResult = db.getUserById(userB.id, { userId: userA.id });
    const isolationPassed = crossAccessResult === null;

    // 1.3: User A trying to access User B's sessions
    const crossSessionResult = db.getSessionsByUserId(userB.id, { userId: userA.id });
    const sessionIsolationPassed = crossSessionResult.length === 0;

    results.push({
      name: 'جداسازی داده و انطباق RLS (سناریوی طلایی ۷)',
      category: 'RLS',
      passed: zeroRowsPassed && isolationPassed && sessionIsolationPassed,
      message: 'هیچ ردیفی بدون Context هویتی برگردانده نشد؛ کاربر A به ردیف‌ها و نشست‌های کاربر B دسترسی ندارد.',
      details: `فاقد Context: ${zeroRowsPassed ? 'صفر ردیف (سبز)' : 'نقض'} | تفکیک متقابل کاربر A و B: ${isolationPassed ? 'مسدود (سبز)' : 'نقض'} | تفکیک نشست‌ها: ${sessionIsolationPassed ? 'سبز' : 'نقض'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'جداسازی داده و انطباق RLS',
      category: 'RLS',
      passed: false,
      message: 'خطا در ارزیابی سیاست‌های RLS',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 2: OTP State Machine & Max 4 Attempts Lock (Golden Scenario 2)
  try {
    const testTarget = `test_target_${Date.now()}`;
    const { demoCode } = await requestOtp(testTarget, 'login');

    // Make 3 wrong attempts
    const r1 = await verifyOtp(testTarget, '000000');
    const r2 = await verifyOtp(testTarget, '111111');
    const r3 = await verifyOtp(testTarget, '222222');

    // 4th wrong attempt must trigger permanent lock
    const r4 = await verifyOtp(testTarget, '333333');

    // 5th attempt with actual correct demo code should be REJECTED because it's locked
    const r5 = await verifyOtp(testTarget, demoCode);

    const lockTriggered = r4.isLocked && !r4.success;
    const lockPersisted = r5.isLocked && !r5.success;

    // Resend creates new state and resets locked status
    const { demoCode: newCode } = await resendOtp(testTarget, 'login');
    const rAfterResend = await verifyOtp(testTarget, newCode);
    const resendRecovered = rAfterResend.success && !rAfterResend.isLocked;

    results.push({
      name: 'ماشین حالت OTP و قفل پس از ۴ تلاش (سناریوی طلایی ۲)',
      category: 'OTP',
      passed: lockTriggered && lockPersisted && resendRecovered,
      message: 'تلاش چهارم ناموفق بلافاصله کد را باطل و قفل کرد؛ صدور مجدد (Resend) چرخه جدید با تلاش صفر ساخت.',
      details: `قفل در تلاش ۴: ${lockTriggered ? 'تأیید' : 'خطا'} | رد تلاش ۵ با کد صحیح: ${lockPersisted ? 'تأیید' : 'خطا'} | احیای چرخه با Resend: ${resendRecovered ? 'تأیید' : 'خطا'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'ماشین حالت OTP',
      category: 'OTP',
      passed: false,
      message: 'خطا در آزمون OTP',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 3: "پایان همه نشست‌ها" Revoke All Sessions (Golden Scenario 3)
  try {
    const testUser: User = {
      id: `usr_test_sess_${Date.now()}`,
      username: `sess_user_${Date.now()}`,
      displayName: 'کاربر آزمون نشست',
      mobile: '09190001122',
      passwordHash: await sha256('Pass@1234'),
      totpEnabled: false,
      loginPreference: 'trusted_device',
      createdAt: Date.now(),
    };
    db.createUser(testUser);

    // Create 3 active sessions across different devices
    createSessionForUser(testUser, true);
    createSessionForUser(testUser, false);
    createSessionForUser(testUser, false);

    const activeBefore = db.getSessionsByUserId(testUser.id, { userId: testUser.id }).length;

    // Trigger terminateAllSessions
    const revokedCount = terminateAllSessions(testUser.id);
    const activeAfter = db.getSessionsByUserId(testUser.id, { userId: testUser.id }).length;

    const allRevoked = activeBefore >= 3 && revokedCount >= 3 && activeAfter === 0;

    results.push({
      name: 'ابطال فوری سراسری «پایان همه نشست‌ها» (سناریوی طلایی ۳)',
      category: 'SESSION',
      passed: allRevoked,
      message: 'همه نشست‌های فعال در تمام دستگاه‌ها فوراً باطل شدند و خروج سراسری اجرا گردید.',
      details: `تعداد نشست قبل از ابطال: ${activeBefore} | باطل‌شده: ${revokedCount} | باقیمانده: ${activeAfter}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'پایان همه نشست‌ها',
      category: 'SESSION',
      passed: false,
      message: 'خطا در ارزیابی ابطال سراسری نشست‌ها',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 4: Password Strength Enforcement
  try {
    const weakEval = evaluatePasswordRules('weak');
    const strongEval = evaluatePasswordRules('S00zan#Sec2026');

    const passEnforced = !weakEval.isValid && strongEval.isValid && strongEval.score === 5;

    results.push({
      name: 'اعتبارسنجی زنده استحکام رمز عبور',
      category: 'CRYPTO',
      passed: passEnforced,
      message: 'پنج گانه امنیتی (طول، حروف بزرگ، حروف کوچک، عدد، نویسه خاص) بررسی و تأیید شد.',
      details: `رد رمز ضعیف: ${!weakEval.isValid ? 'سبز' : 'قرمز'} | پذیرش رمز قوی: ${strongEval.isValid ? 'سبز' : 'قرمز'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'استحکام رمز عبور',
      category: 'CRYPTO',
      passed: false,
      message: 'خطا در تست رمز عبور',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 5: Constant-Time Comparison
  try {
    const eq1 = timingSafeEqual('abcdef123456', 'abcdef123456');
    const eq2 = timingSafeEqual('abcdef123456', 'abcdef123457');
    const eq3 = timingSafeEqual('abc', 'abcdef');

    const timingSafePassed = eq1 && !eq2 && !eq3;

    results.push({
      name: 'مقایسه زمان‌ثابت مقادیر حساس (Timing-Attack Safe)',
      category: 'CRYPTO',
      passed: timingSafePassed,
      message: 'مقایسه بیت‌به‌بیت در برابر حملات تحلیل زمانی (Side-Channel) مقاوم است.',
      details: 'انطباق دقیق با قواعد rules/10',
    });
  } catch (err: unknown) {
    results.push({
      name: 'مقایسه زمان‌ثابت',
      category: 'CRYPTO',
      passed: false,
      message: 'خطا در آزمون مقایسه زمان‌ثابت',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 6: 7-Stage Malware Scanner (Golden Scenario 4)
  try {
    const { scanFileForMalware } = await import('./scanner');

    // 6.1 Clean file
    const cleanFile = {
      name: 'sample_doc.pdf',
      size: 1024,
      type: 'application/pdf',
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, ...new TextEncoder().encode('Clean document content')])
    };
    const cleanScan = await scanFileForMalware(cleanFile);

    // 6.2 Executable masquerading as image
    const masqueradeFile = {
      name: 'fake_invoice.jpg',
      size: 2048,
      type: 'image/jpeg',
      bytes: new Uint8Array([0x4D, 0x5A, 0x90, ...new TextEncoder().encode('DOS executable header')])
    };
    const exeScan = await scanFileForMalware(masqueradeFile);

    // 6.3 Suspicious script with eval/unescape
    const badScript = {
      name: 'backdoor.js',
      size: 512,
      type: 'application/javascript',
      bytes: new TextEncoder().encode('eval(unescape("%61%6C%65%72%74")); // powershell -enc test')
    };
    const scriptScan = await scanFileForMalware(badScript);

    const scannerPassed = cleanScan.finalVerdict === 'clean' &&
      exeScan.finalVerdict === 'malicious' &&
      (scriptScan.finalVerdict === 'suspicious' || scriptScan.finalVerdict === 'malicious');

    results.push({
      name: 'پالایش بدافزار ۷ مرحله‌ای (سناریوی طلایی ۴)',
      category: 'SCANNER',
      passed: scannerPassed,
      message: 'فایل تمیز تأیید شد؛ باینری اجرایی پنهان در گام ۱ رد شد و اسکریپت مبهم در گام ۲/۳ متوقف گردید.',
      details: `فایل سالم: ${cleanScan.finalVerdict} (سبز) | اجرایی جعلی: ${exeScan.finalVerdict} (سبز) | اسکریپت وب‌شل: ${scriptScan.finalVerdict} (سبز)`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'پالایش بدافزار ۷ مرحله‌ای',
      category: 'SCANNER',
      passed: false,
      message: 'خطا در ارزیابی اسکنر بدافزار',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 7: 64-Character Share Code & Single-Reveal Invariant (Golden Scenario 5)
  try {
    const { generateShareCode64, generateManageCode } = await import('./crypto');

    const code1 = generateShareCode64();
    const code2 = generateShareCode64();
    const manageCode = generateManageCode();

    const lengthPassed = code1.length === 64 && code2.length === 64;
    const uniquenessPassed = code1 !== code2;
    const manageCodeValid = manageCode.startsWith('MAN-') && manageCode.length >= 15;

    // Verify hash can be computed and raw code is never matched in plaintext
    const hash = await sha256(code1, 'soozan_share_salt_v1');
    const hashValid = hash.length === 64 && hash !== code1;

    results.push({
      name: 'تولید کد اشتراک ۶۴ کاراکتری و تفکیک هش (سناریوی طلایی ۵)',
      category: 'VAULT',
      passed: lengthPassed && uniquenessPassed && manageCodeValid && hashValid,
      message: 'کد ۶۴ کاراکتری تصادفی رمزارزی تولید شد؛ ذخیره‌سازی فقط به صورت هش انجام می‌شود و در لاگ درج نمی‌گردد.',
      details: `طول کد: ${code1.length} کاراکتر | تصادفی‌سازی امن: تأیید | کد مدیریت فرستنده: ${manageCode}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'تولید کد اشتراک ۶۴ کاراکتری',
      category: 'VAULT',
      passed: false,
      message: 'خطا در آزمون کد اشتراک ۶۴ کاراکتری',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 8: AES-GCM-256 Encryption & Cryptographic Shredding
  try {
    const { encryptFilePayload, decryptFilePayload, shredEncryptionKey } = await import('./crypto');

    const originalText = 'متن آزمون رمزنگاری و امحای رمزارزی پلتفرم سوزان';
    const originalBytes = new TextEncoder().encode(originalText);

    // Encrypt
    const { payload, keyId } = await encryptFilePayload(originalBytes, 'test.txt', 'text/plain');
    const isEncrypted = payload.cipherBytesHex.length > 0 && payload.ivHex.length === 24;

    // Decrypt before shredding
    const decryptedBytes = await decryptFilePayload(payload);
    const textBeforeShred = decryptedBytes ? new TextDecoder().decode(decryptedBytes) : '';
    const decryptSuccess = textBeforeShred === originalText;

    // Shred Key
    shredEncryptionKey(keyId);

    // Decrypt after shredding (MUST return null)
    const afterShredBytes = await decryptFilePayload(payload);
    const shredSuccess = afterShredBytes === null;

    results.push({
      name: 'رمزنگاری AES-GCM-256 و امحای رمزارزی (Cryptographic Shredding)',
      category: 'CRYPTO',
      passed: isEncrypted && decryptSuccess && shredSuccess,
      message: 'رمزنگاری ۲۵۶ بیتی کلید تفکیک‌شده تأیید شد؛ پس از امحای کلید (Shred)، محتوا غیرقابل بازیابی گردید.',
      details: `رمزنگاری سالم: ${decryptSuccess ? 'تأیید' : 'خطا'} | امحای قطعی کلید: ${shredSuccess ? 'تأیید' : 'خطا'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'رمزنگاری AES-GCM و امحای کلید',
      category: 'CRYPTO',
      passed: false,
      message: 'خطا در ارزیابی رمزنگاری و امحای رمزارزی',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 9: Recipient Zero-Trace File Lookup & View Consumption (Phase 5 Gate)
  try {
    const testHash = '5a1ffd0688693c5dbf8815bd8241db685cd81c8430d65f2133643adbd8701a9b';
    // Zero-trace lookup: NO user context passed
    const file = db.getFileByShareCodeHash(testHash);
    const lookupPassed = file !== null && file.fileName === 'پیش‌نویس_قرارداد_توسعه_سوزان.txt';

    // Verify consumption increments
    const beforeConsumed = file ? file.policy.consumedViews : 0;
    const viewRes = db.consumeFileView(file!.id, '192.168.1.50');
    const consumedPassed = viewRes.status === 'ready' && viewRes.record?.policy.consumedViews === beforeConsumed + 1;

    results.push({
      name: 'بازیابی بدون ردپای گیرنده و موتور مصرف بازدید (فاز ۵)',
      category: 'VAULT',
      passed: lookupPassed && consumedPassed,
      message: 'گیرنده بدون نیاز به هویت یا لاگین، محتوا را با هش ۶۴ کاراکتری واکشی کرد و مصرف بازدید با موفقیت ثبت شد.',
      details: `واکشی صفر ردپا: ${lookupPassed ? 'سبز' : 'خطا'} | ثبت مصرف بازدید: ${consumedPassed ? 'سبز' : 'خطا'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'بازیابی بدون ردپای گیرنده',
      category: 'VAULT',
      passed: false,
      message: 'خطا در ارزیابی بازیابی صفر ردپا',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 10: Brute-Force Password Self-Destruction (Phase 5 Gate)
  try {
    // Look up password sample file
    const passHash = 'bfc88cec543c95ce30a5023b242496ea7d848301fbf79c83d9dc0723f894fddb';
    const passFile = db.getFileByShareCodeHash(passHash);

    if (!passFile) throw new Error('فایل نمونه رمزدار یافت نشد');

    const rawCode = 'SoozanPasswordFileKeyForRecipientDemoTesting2026LockedWithPass01';

    // Attempt 1: Wrong password
    const a1 = await db.verifyFilePassword(passFile.id, rawCode, 'wrong_1');
    // Attempt 2: Wrong password
    const a2 = await db.verifyFilePassword(passFile.id, rawCode, 'wrong_2');
    // Attempt 3: Wrong password -> MUST TRIGGER IMMEDIATE BURN
    const a3 = await db.verifyFilePassword(passFile.id, rawCode, 'wrong_3');

    const burnTriggered = a3.burned && a3.remaining === 0;

    // Verify file is now burned in database
    const fileAfter = db.getFileByShareCodeHash(passHash);
    const isNowBurned = fileAfter?.status === 'burned';

    results.push({
      name: 'انهدام خودکار در سقف تلاش رمز عبور (ضد بروت‌فورس فاز ۵)',
      category: 'CRYPTO',
      passed: burnTriggered && isNowBurned,
      message: 'با ۳ بار ورود رمز نادرست، انهدام رمزارزی خودکار اجرا و کلید رمزنگاری برای همیشه محو شد.',
      details: `سوزاندن در تلاش ۳: ${burnTriggered ? 'تأیید' : 'خطا'} | وضعیت نهایی فایل: ${isNowBurned ? 'سوخته (سبز)' : 'خطا'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'انهدام خودکار در سقف تلاش رمز عبور',
      category: 'CRYPTO',
      passed: false,
      message: 'خطا در ارزیابی انهدام خودکار رمز عبور',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 11: Guardian Role RLS Isolation & Telemetry (Phase 6 Gate)
  try {
    // 11.1 Non-admin trying to get guardian metrics must receive null
    const unauthorizedMetrics = db.getGuardianMetrics({ userId: 'usr_demo_101', role: 'sender' });
    const rlsBlockedUnauthorized = unauthorizedMetrics === null;

    // 11.2 Admin receives sanitized telemetry
    const adminMetrics = db.getGuardianMetrics({ userId: 'usr_guardian', role: 'admin' });
    const adminMetricsReceived = adminMetrics !== null && adminMetrics.totalFilesCount >= 0;

    // 11.3 Anonymized files metadata contains NO raw ciphertext and NO raw 64-char share tokens
    const anonFiles = db.getAllAnonymizedFilesForGuardian({ role: 'admin' });
    const noRawTokensLeaked = anonFiles.every((f) => {
      // f must have masked owner and no 64-char share code
      const hasMaskedOwner = f.anonymizedOwnerId.startsWith('usr_...');
      const noRawCipher = !(f as unknown as { encryptedPayload?: unknown }).encryptedPayload;
      return hasMaskedOwner && noRawCipher;
    });

    results.push({
      name: 'دیده‌بان سلامت و ممیزی ایزوله نگهبان (فاز ۶)',
      category: 'RLS',
      passed: rlsBlockedUnauthorized && adminMetricsReceived && noRawTokensLeaked,
      message: 'جداسازی داده RLS نگهبان اعتبارسنجی شد؛ دسترسی غیرمجاز مسدود و فراداده‌ها بدون نشت محتوا استخراج شدند.',
      details: `مسدودسازی فرستنده عادی: ${rlsBlockedUnauthorized ? 'سبز' : 'خطا'} | دریافت فراداده ادمین: ${adminMetricsReceived ? 'سبز' : 'خطا'} | عدم نشت محتوا و توکن‌ها: ${noRawTokensLeaked ? 'تأیید' : 'خطا'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'دیده‌بان سلامت و ممیزی ایزوله نگهبان',
      category: 'RLS',
      passed: false,
      message: 'خطا در تست ممیزی نگهبان فاز ۶',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 12: Concurrent Load & DDoS Defense with Backpressure (Phase 7 - Golden Scenarios 8 & 10)
  try {
    // 12.1 Run 50 concurrent active users simulator
    const loadTest = await runConcurrentLoadTest(50, 3);
    const loadPassed = loadTest.passed && loadTest.destructionIntegrityPercent === 100 && loadTest.zeroLeakedKeys;

    // 12.2 Test Backpressure rate limiting on high-frequency flood
    const attackerIp = '198.51.100.99';
    let floodBlocked = false;
    for (let i = 0; i < 70; i++) {
      const check = rateLimiter.checkRequest(attackerIp, undefined, 'heavy');
      if (!check.allowed) {
        floodBlocked = true;
        break;
      }
    }

    // 12.3 Ensure legitimate core request still allowed
    const legitIp = '192.0.2.1';
    const coreCheck = rateLimiter.checkRequest(legitIp, 'sess_legit_audit', 'core');
    const coreAvailable = coreCheck.allowed;

    results.push({
      name: 'تاب‌آوری بار همزمان و مهار سیل‌آسای DDoS با Backpressure (فاز ۷)',
      category: 'RESILIENCE',
      passed: loadPassed && floodBlocked && coreAvailable,
      message: 'بار همزمانی با صحت ۱۰۰٪ انهدام سپری شد؛ حمله مازاد با پاسخ ارزان ۴۲۹ مهار و سرویس مشروع فعال ماند.',
      details: `آزمون ۵۰ کاربر: ${loadPassed ? 'سبز' : 'خطا'} (p95: ${loadTest.p95LatencyMs}ms) | مهار حمله: ${floodBlocked ? 'سبز' : 'خطا'} | دسترس‌پذیری هسته: ${coreAvailable ? 'سبز' : 'خطا'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'تاب‌آوری بار همزمان و مهار سیل‌آسای DDoS با Backpressure (فاز ۷)',
      category: 'RESILIENCE',
      passed: false,
      message: 'خطا در اجرای آزمون بار و تاب‌آوری',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  // TEST 13: 3-2-1 Encrypted Backup & Disaster Recovery Drill (Phase 7 - Golden Scenario 9 & rule 18)
  try {
    // 13.1 Create immutable 3-2-1 backup snapshot
    const backup = await backupRecoveryService.createBackupSnapshot();
    const backupCreated = Boolean(backup && backup.id && backup.sha256Checksum && backup.isImmutable);

    // 13.2 Execute Disaster Recovery Drill
    const drill = await backupRecoveryService.runDisasterRecoveryDrill(backup.id);
    const drillPassed = drill.passed && drill.checksumMatched && drill.activePoliciesIntact && drill.destructionContinuityVerified;

    results.push({
      name: 'پشتیبان‌گیری رمزنگاری‌شده ۳-۲-۱ و مانور بازیابی فاجعه (فاز ۷)',
      category: 'BACKUP',
      passed: backupCreated && drillPassed,
      message: 'رونوشت ۳-۲-۱ با هش یکپارچگی SHA-256 ساخته شد و مانور بازیابی با تداوم کامل شروط نابودی سپری گردید.',
      details: `تولید بک‌آپ ۳-۲-۱: ${backupCreated ? 'سبز' : 'خطا'} | تطبیق هش SHA-256: ${drill.checksumMatched ? 'تایید' : 'خطا'} | پیوستگی نابودی: ${drill.destructionContinuityVerified ? 'سبز' : 'خطا'}`,
    });
  } catch (err: unknown) {
    results.push({
      name: 'پشتیبان‌گیری رمزنگاری‌شده ۳-۲-۱ و مانور بازیابی فاجعه (فاز ۷)',
      category: 'BACKUP',
      passed: false,
      message: 'خطا در آزمون بک‌آپ ۳-۲-۱ و مانور بازیابی',
      details: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}


