/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OtpState } from '../types';
import { db } from './db';
import { sha256, timingSafeEqual } from './security';

const OTP_TTL_SECONDS = 120;
const MAX_ATTEMPTS = 4;

export interface OtpVerificationResult {
  success: boolean;
  isExpired: boolean;
  isLocked: boolean;
  message: string;
}

/**
 * Single, unified OTP Engine according to Section 8 & rules/10.
 * Server timestamp is the sole source of truth.
 * Remaining attempts are NEVER leaked.
 */
export async function requestOtp(
  target: string,
  purpose: OtpState['purpose']
): Promise<{ otpState: OtpState; demoCode: string }> {
  // Generate cryptographically random 6-digit code
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const codeNum = (randomBuffer[0] % 900000) + 100000;
  const rawCode = codeNum.toString();

  const codeHash = await sha256(rawCode, `otp_salt_${target}`);
  const now = Date.now();
  const expiresAt = now + OTP_TTL_SECONDS * 1000;

  const otpState: OtpState = {
    id: `otp_${now}_${Math.random().toString(36).substring(2, 7)}`,
    target,
    purpose,
    codeHash,
    demoCode: rawCode, // dev demo presentation
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    createdAt: now,
    expiresAt,
    isLocked: false,
  };

  db.setOtp(otpState);

  db.logAudit({
    id: `aud_otp_${now}`,
    action: 'OTP_REQUESTED',
    ipAddress: '127.0.0.1',
    timestamp: now,
    details: { target, purpose, expiresAt },
  });

  return { otpState, demoCode: rawCode };
}

/**
 * Verify submitted OTP against state.
 */
export async function verifyOtp(
  target: string,
  inputCode: string
): Promise<OtpVerificationResult> {
  const cleanCode = inputCode.trim();
  const currentOtp = db.getOtp(target);

  if (!currentOtp) {
    return {
      success: false,
      isExpired: true,
      isLocked: false,
      message: 'کد تأیید یافت نشد یا منقضی شده است؛ لطفاً درخواست کد جدید دهید.',
    };
  }

  const now = Date.now();

  // 1. Check if locked due to >= 4 failed attempts
  if (currentOtp.isLocked || currentOtp.attempts >= MAX_ATTEMPTS) {
    currentOtp.isLocked = true;
    db.setOtp(currentOtp);
    return {
      success: false,
      isExpired: false,
      isLocked: true,
      message: 'تعداد دفعات ورود اشتباه بیش از حد مجاز بود. این کد باطل شده است؛ لطفاً درخواست کد جدید دهید.',
    };
  }

  // 2. Check if expired based on server clock
  if (now > currentOtp.expiresAt) {
    db.deleteOtp(target);
    return {
      success: false,
      isExpired: true,
      isLocked: false,
      message: 'زمان اعتبار ۱۲۰ ثانیه‌ای کد به پایان رسید. لطفاً کد جدید دریافت کنید.',
    };
  }

  // 3. Increment attempts counter
  currentOtp.attempts += 1;

  // 4. Constant-time hash comparison
  const inputHash = await sha256(cleanCode, `otp_salt_${target}`);
  const isMatch = timingSafeEqual(inputHash, currentOtp.codeHash);

  if (isMatch) {
    // SUCCESS: delete OTP slot immediately
    db.deleteOtp(target);
    db.logAudit({
      id: `aud_otp_suc_${now}`,
      action: 'OTP_VERIFIED_SUCCESS',
      ipAddress: '127.0.0.1',
      timestamp: now,
      details: { target, purpose: currentOtp.purpose },
    });
    return {
      success: true,
      isExpired: false,
      isLocked: false,
      message: 'کد تأیید با موفقیت تأیید شد.',
    };
  }

  // Failed attempt:
  if (currentOtp.attempts >= MAX_ATTEMPTS) {
    currentOtp.isLocked = true;
    db.setOtp(currentOtp);
    db.logAudit({
      id: `aud_otp_lock_${now}`,
      action: 'OTP_LOCKED_MAX_ATTEMPTS',
      ipAddress: '127.0.0.1',
      timestamp: now,
      details: { target, attempts: currentOtp.attempts },
    });
    return {
      success: false,
      isExpired: false,
      isLocked: true,
      message: 'تعداد دفعات ورود اشتباه بیش از حد مجاز بود. این کد باطل شد و تنها با ارسال مجدد قابل ادامه است.',
    };
  }

  db.setOtp(currentOtp);
  // Human non-technical message without revealing remaining attempts (Redline rule 10 & 8)
  return {
    success: false,
    isExpired: false,
    isLocked: false,
    message: 'کد واردشده نادرست است. لطفاً ارقام را بررسی و دوباره وارد کنید.',
  };
}

/**
 * Resend OTP: generates a completely new code, resets attempts to 0 and timer to fresh 120s.
 */
export async function resendOtp(
  target: string,
  purpose: OtpState['purpose']
): Promise<{ otpState: OtpState; demoCode: string }> {
  db.deleteOtp(target);
  return requestOtp(target, purpose);
}
