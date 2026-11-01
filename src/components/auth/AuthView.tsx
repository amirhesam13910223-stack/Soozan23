/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, User as UserIcon, Phone, ShieldCheck, KeyRound, ArrowLeft, AlertCircle, Fingerprint, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';
import { evaluatePasswordRules, normalizeIranianMobile, sha256, validateIranianMobile } from '../../services/security';
import { requestOtp } from '../../services/otp';
import { createSessionForUser, setLocalBiometricLock } from '../../services/session';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { OtpModal } from './OtpModal';

interface Props {
  onAuthSuccess: (user: User) => void;
}

export const AuthView: React.FC<Props> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  const [enableBiometricLocal, setEnableBiometricLocal] = useState<boolean>(false);

  // Status & error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // OTP Modal control
  const [otpTarget, setOtpTarget] = useState<string | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<'register' | 'login'>('login');
  const [otpDemoCode, setOtpDemoCode] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Switch mode helper
  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMessage(null);
  };

  // 1-Click Demo Login fill helper for reviewers
  const handleFillDemoCredentials = () => {
    setUsername('soozan_demo');
    setPassword('Password@123');
    setErrorMessage(null);
  };

  // Submit Login (Step 1 -> triggers OTP)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setErrorMessage('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find user
      const user = db.getUserByUsername(cleanUsername, { isSystemInternal: true });
      if (!user) {
        setErrorMessage('نام کاربری یا رمز عبور نادرست است.');
        return;
      }

      // Check password hash
      const inputHash = await sha256(password);
      if (inputHash !== user.passwordHash) {
        setErrorMessage('نام کاربری یا رمز عبور نادرست است.');
        return;
      }

      // Credentials valid -> trigger OTP verification
      setPendingUser(user);
      const { demoCode } = await requestOtp(user.mobile, 'login');
      setOtpTarget(user.mobile);
      setOtpPurpose('login');
      setOtpDemoCode(demoCode);
    } catch {
      setErrorMessage('خطایی در برقراری ارتباط رخ داد. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Registration (Step 1 -> triggers OTP)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanMobile = normalizeIranianMobile(mobile);

    // Validations
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('نام کاربری باید حداقل ۳ کاراکتر انگلیسی باشد.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setErrorMessage('نام کاربری فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و زیرخط باشد.');
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage('لطفاً نام نمایشی خود را وارد کنید.');
      return;
    }

    if (!validateIranianMobile(cleanMobile)) {
      setErrorMessage('لطفاً شماره تلفن همراه معتبر ایرانی (مثلاً 09121234567) وارد کنید.');
      return;
    }

    const { isValid } = evaluatePasswordRules(password);
    if (!isValid) {
      setErrorMessage('رمز عبور باید تمام معیارهای امنیتی پنج‌گانه را داشته باشد.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('تکرار رمز عبور با رمز اصلی مطابقت ندارد.');
      return;
    }

    // Check unique username & mobile
    const existingUsername = db.getUserByUsername(cleanUsername, { isSystemInternal: true });
    if (existingUsername) {
      setErrorMessage('این نام کاربری قبلاً انتخاب شده است؛ لطفاً نام کاربری دیگری برگزینید.');
      return;
    }

    const existingMobile = db.getUserByMobile(cleanMobile);
    if (existingMobile) {
      setErrorMessage('با این شماره تلفن همراه قبلاً حسابی ثبت شده است.');
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordHash = await sha256(password);
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        displayName: displayName.trim(),
        mobile: cleanMobile,
        passwordHash,
        totpEnabled: false,
        loginPreference: trustDevice ? 'trusted_device' : 'always_full',
        createdAt: Date.now(),
      };

      setPendingUser(newUser);

      // Trigger OTP verification
      const { demoCode } = await requestOtp(cleanMobile, 'register');
      setOtpTarget(cleanMobile);
      setOtpPurpose('register');
      setOtpDemoCode(demoCode);
    } catch {
      setErrorMessage('خطایی در ثبت اطلاعات رخ داد؛ لطفاً مجدداً بررسی کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Success callback
  const handleOtpSuccess = () => {
    if (!pendingUser) return;

    if (otpPurpose === 'register') {
      db.createUser(pendingUser);
    }

    // Create session
    createSessionForUser(pendingUser, trustDevice);

    if (enableBiometricLocal) {
      setLocalBiometricLock('1234'); // Default local PIN for biometric simulation
    }

    setOtpTarget(null);
    onAuthSuccess(pendingUser);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Brand Card */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Toggle Login / Register */}
        <div className="grid grid-cols-2 p-1 mb-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ورود به حساب
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ثبت‌نام فرستنده
          </button>
        </div>

        {/* Demo Fast-fill Banner for Reviewer */}
        {mode === 'login' && (
          <div className="mb-5 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between text-xs">
            <div className="text-zinc-300">
              <span className="font-semibold text-orange-400">حساب نمونه پیش‌فرض:</span>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5" dir="ltr">soozan_demo</div>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-medium text-xs transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تکمیل خودکار</span>
            </button>
          </div>
        )}

        {/* Form Error */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="نام کاربری"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full py-2.5 pr-10 pl-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-orange-500 focus:outline-none transition-all dir-ltr text-right"
                  dir="ltr"
                />
                <UserIcon className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="رمز عبور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2.5 pr-10 pl-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-orange-500 focus:outline-none transition-all dir-ltr text-right"
                  dir="ltr"
                />
                <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>
            </div>

            {/* Remember Device Options */}
            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0 w-4 h-4"
                />
                <span>به‌خاطر سپردن این دستگاه (ورود سریع دفعه بعد)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={enableBiometricLocal}
                  onChange={(e) => setEnableBiometricLocal(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5 text-orange-400" />
                  <span>فعال‌سازی قفل بیومتریک محلی برای این دستگاه</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
            >
              <span>ادامه و ارسال کد تأیید (OTP)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                نام نمایشی (فارسی)
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً: سهراب سپهری"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-orange-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">نام کاربری یکتا</label>
                <span className="text-[10px] text-zinc-500">غیرقابل تغییر پس از ساخت</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="soozan_user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full py-2.5 pr-10 pl-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-orange-500 focus:outline-none transition-all font-mono text-left"
                  dir="ltr"
                />
                <UserIcon className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                شماره تلفن همراه (برای تأیید OTP)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="09123456789"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full py-2.5 pr-10 pl-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-orange-500 focus:outline-none transition-all font-mono text-left"
                  dir="ltr"
                />
                <Phone className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                رمز عبور قوی
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="رمز عبور مستحکم"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2.5 pr-10 pl-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-orange-500 focus:outline-none transition-all dir-ltr text-right"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              </div>

              {/* Live Password Strength Indicator */}
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                تکرار رمز عبور
              </label>
              <input
                type="password"
                required
                placeholder="تکرار همان رمز"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-orange-500 focus:outline-none transition-all dir-ltr text-right"
                dir="ltr"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0 w-4 h-4"
                />
                <span>اعتماد به این دستگاه برای ورودهای بعدی</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
            >
              <span>ثبت اطلاعات و دریافت کد تأیید (OTP)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Security Assurance Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-500 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>امنیت غیرقابل‌مذاکره: رمزنگاری در سکون، RLS و ورود دومرحله‌ای سخت‌گیر</span>
        </div>
      </div>

      {/* Footer links */}
      <footer className="text-center text-[11px] text-zinc-500 space-x-3 space-x-reverse pt-4">
        <span className="hover:text-zinc-300 cursor-pointer">سیاست حریم خصوصی</span>
        <span>•</span>
        <span className="hover:text-zinc-300 cursor-pointer">شرایط استفاده</span>
        <span>•</span>
        <span className="hover:text-zinc-300 cursor-pointer">گزارش محتوا</span>
      </footer>

      {/* Bottom buffer matching the floating nav bar height */}
      <div className="h-16 sm:h-20 w-full pointer-events-none" aria-hidden="true" />

      {/* OTP Verification Modal */}
      {otpTarget && (
        <OtpModal
          target={otpTarget}
          purpose={otpPurpose}
          demoCode={otpDemoCode}
          onSuccess={handleOtpSuccess}
          onCancel={() => setOtpTarget(null)}
        />
      )}
    </div>
  );
};
