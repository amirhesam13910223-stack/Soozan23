/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User as UserIcon,
  Phone,
  KeyRound,
  AlertTriangle,
  Check,
  CheckCircle2,
  Lock,
  Calendar,
  LogOut,
  Flame,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';
import { toPersianDigits, sha256 } from '../../services/security';
import { requestOtp, verifyOtp } from '../../services/otp';

interface Props {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
  onAccountDeleted: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<Props> = ({
  user,
  onUserUpdated,
  onAccountDeleted,
  onLogout,
}) => {
  // Section 1: Account Info State
  const [displayName, setDisplayName] = useState<string>(user.displayName);
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [saveNameSuccess, setSaveNameSuccess] = useState<boolean>(false);

  // Section 2: Mobile Change State
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);
  const [newMobileInput, setNewMobileInput] = useState<string>('');
  const [mobileOtpStep, setMobileOtpStep] = useState<1 | 2>(1); // 1: OTP on old, 2: OTP on new
  const [mobileOtpCode, setMobileOtpCode] = useState<string>('');
  const [mobileOtpDemo, setMobileOtpDemo] = useState<string>('');
  const [mobileError, setMobileError] = useState<string>('');
  const [isProcessingMobile, setIsProcessingMobile] = useState<boolean>(false);

  // Section 3: Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [passwordOtpCode, setPasswordOtpCode] = useState<string>('');
  const [passwordOtpDemo, setPasswordOtpDemo] = useState<string>('');
  const [passwordStep, setPasswordStep] = useState<'verify_current' | 'otp' | 'new_password'>('verify_current');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // Section 4: Danger Zone State
  const [dangerPassword, setDangerPassword] = useState<string>('');
  const [dangerAccepted, setDangerAccepted] = useState<boolean>(false);
  const [dangerError, setDangerError] = useState<string>('');
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // Files count for badge
  const userFiles = db.getFilesByOwner(user.id, { userId: user.id });
  const activeCount = userFiles.filter((f) => f.status === 'issued' || f.status === 'consuming').length;

  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Handle Save Display Name
  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setIsSavingName(true);
    try {
      const updatedUser: User = {
        ...user,
        displayName: displayName.trim(),
      };
      const ok = db.updateUser(updatedUser, { userId: user.id });
      if (ok) {
        onUserUpdated(updatedUser);
        setSaveNameSuccess(true);
        setTimeout(() => setSaveNameSuccess(false), 3000);
      }
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Start Mobile Change
  const handleStartMobileChange = async () => {
    setMobileError('');
    setIsProcessingMobile(true);
    try {
      const { demoCode } = await requestOtp(user.mobile, 'change_mobile');
      setMobileOtpDemo(demoCode || '');
      setMobileOtpStep(1);
      setShowMobileModal(true);
    } catch (err: unknown) {
      setMobileError(err instanceof Error ? err.message : 'خطا در ارسال کد تأیید');
    } finally {
      setIsProcessingMobile(false);
    }
  };

  // Verify old mobile OTP and request new mobile OTP
  const handleVerifyOldMobileOtp = async () => {
    setMobileError('');
    if (!newMobileInput.trim() || !/^09\d{9}$/.test(newMobileInput.trim())) {
      setMobileError('لطفاً شماره جدید معتبر با فرمت ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.');
      return;
    }
    setIsProcessingMobile(true);
    try {
      const verifyRes = await verifyOtp(user.mobile, mobileOtpCode);
      if (!verifyRes.success) {
        setMobileError(verifyRes.message);
        return;
      }

      // Send OTP to new mobile
      const { demoCode } = await requestOtp(newMobileInput.trim(), 'change_mobile');
      setMobileOtpDemo(demoCode || '');
      setMobileOtpCode('');
      setMobileOtpStep(2);
    } catch (err: unknown) {
      setMobileError(err instanceof Error ? err.message : 'خطا در پردازش');
    } finally {
      setIsProcessingMobile(false);
    }
  };

  // Confirm new mobile OTP and finalize
  const handleFinalizeMobileChange = async () => {
    setMobileError('');
    setIsProcessingMobile(true);
    try {
      const verifyRes = await verifyOtp(newMobileInput.trim(), mobileOtpCode);
      if (!verifyRes.success) {
        setMobileError(verifyRes.message);
        return;
      }

      const updatedUser: User = {
        ...user,
        mobile: newMobileInput.trim(),
      };
      db.updateUser(updatedUser, { userId: user.id });
      onUserUpdated(updatedUser);
      setShowMobileModal(false);
      setNewMobileInput('');
      setMobileOtpCode('');
    } catch (err: unknown) {
      setMobileError(err instanceof Error ? err.message : 'خطا در ثبت شماره جدید');
    } finally {
      setIsProcessingMobile(false);
    }
  };

  // Handle Start Password Change
  const handleStartPasswordChange = async () => {
    setPasswordError('');
    if (!currentPasswordInput) {
      setPasswordError('لطفاً رمز عبور فعلی خود را وارد کنید.');
      return;
    }

    const currentHash = await sha256(currentPasswordInput);
    if (currentHash !== user.passwordHash) {
      setPasswordError('رمز عبور فعلی نادرست است.');
      return;
    }

    // Request OTP to user's registered mobile
    try {
      const { demoCode } = await requestOtp(user.mobile, 'change_password');
      setPasswordOtpDemo(demoCode || '');
      setPasswordStep('otp');
      setShowPasswordModal(true);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'خطا در ارسال کد تأیید');
    }
  };

  // Verify OTP for Password Change
  const handleVerifyPasswordOtp = async () => {
    setPasswordError('');
    try {
      const verifyRes = await verifyOtp(user.mobile, passwordOtpCode);
      if (!verifyRes.success) {
        setPasswordError(verifyRes.message);
        return;
      }
      setPasswordStep('new_password');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'خطا در بررسی کد');
    }
  };

  // Finalize Password Change
  const handleFinalizePassword = async () => {
    setPasswordError('');
    if (!newPasswordInput || newPasswordInput.length < 8) {
      setPasswordError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('تکرار رمز عبور جدید مطابقت ندارد.');
      return;
    }

    const newHash = await sha256(newPasswordInput);
    const updatedUser: User = {
      ...user,
      passwordHash: newHash,
    };
    db.updateUser(updatedUser, { userId: user.id });
    onUserUpdated(updatedUser);
    setPasswordSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setPasswordStep('verify_current');
    }, 2000);
  };

  // Handle Danger Zone Account Deletion
  const handleDeleteAccount = async () => {
    setDangerError('');
    if (!dangerAccepted) {
      setDangerError('برای حذف حساب، باید تیک پذیرش حذف کامل را بزنید.');
      return;
    }
    if (!dangerPassword) {
      setDangerError('لطفاً رمز عبور حساب خود را برای تایید نهایی وارد کنید.');
      return;
    }

    const enteredHash = await sha256(dangerPassword);
    if (enteredHash !== user.passwordHash) {
      setDangerError('رمز عبور حساب نادرست است.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      db.deleteUserAndBurnAllFiles(user.id, { userId: user.id });
      onAccountDeleted();
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 sm:py-8 pb-4 space-y-6 text-right overflow-x-hidden">
      {/* Page Title & Subtitle (Matching Screenshot 5) */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
          <span>تنظیمات</span>
          <span className="text-lg">⚙️</span>
        </h1>
        <p className="text-xs text-zinc-400">مدیریت و کنترل کامل حساب</p>
      </div>

      {/* SECTION 1: ACCOUNT INFO (Matching Screenshot 5) */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
          <UserIcon className="w-4 h-4 text-orange-400" />
          <span>اطلاعات حساب</span>
        </div>

        <div className="space-y-3">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">نام کاربری</label>
            <input
              type="text"
              readOnly
              value={user.username}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400 font-mono focus:outline-none cursor-not-allowed"
              dir="ltr"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">نام و نام خانوادگی</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Save Name Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleSaveName}
              disabled={isSavingName || !displayName.trim()}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
            >
              {isSavingName ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : saveNameSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-200" />
              ) : null}
              <span>{saveNameSuccess ? 'ذخیره شد' : 'ذخیره نام'}</span>
            </button>

            <span className="text-[11px] text-zinc-500">
              عضو از {toPersianDigits(formattedJoinDate)} • {toPersianDigits(activeCount)} فایل فعال
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: MOBILE NUMBER (Matching Screenshot 5) */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <Phone className="w-4 h-4 text-blue-400" />
            <span>شماره موبایل</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400">شماره فعلی:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-mono font-bold" dir="ltr">
              {toPersianDigits(user.mobile)}
            </span>
          </div>
        </div>

        {/* 3-Step Instruction Box */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
          مراحل تغییر: ۱) کد تأیید به شماره فعلی ۲) وارد کردن شماره جدید ۳) کد تأیید به شماره جدید. پیامک هشدار تغییر، به شماره قدیمی هم ارسال می‌شود.
        </div>

        <button
          type="button"
          onClick={handleStartMobileChange}
          disabled={isProcessingMobile}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
        >
          <span>📱</span>
          <span>تغییر شماره موبایل</span>
        </button>
      </div>

      {/* SECTION 3: CHANGE PASSWORD (Matching Screenshot 5) */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>تغییر رمز عبور</span>
        </div>

        {/* Instruction Box */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
          مراحل: ۱) رمز فعلی ۲) کد تأیید پیامکی ۳) رمز جدید + تکرار. پیامک هشدار تغییر رمز با ساعت دقیق، به شماره حساب می‌رود.
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">رمز عبور فعلی</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPasswordInput}
              onChange={(e) => setCurrentPasswordInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {passwordError && (
            <div className="text-[11px] text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartPasswordChange}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-zinc-700/60"
          >
            <span>شروع تغییر رمز</span>
            <span>←</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: DANGER ZONE (Matching Screenshot 5) */}
      <div className="rounded-3xl bg-zinc-900/90 border border-rose-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
          <span>🚨</span>
          <span>منطقه خطر</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">رمز حساب (برای تأیید حذف)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={dangerPassword}
              onChange={(e) => setDangerPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-rose-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={dangerAccepted}
              onChange={(e) => setDangerAccepted(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-zinc-950 border-zinc-700"
            />
            <span className="text-xs text-zinc-300">
              حذف کامل حساب و همه فایل‌ها را می‌پذیرم
            </span>
          </label>

          {dangerError && (
            <div className="text-[11px] text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{dangerError}</span>
            </div>
          )}

          {/* Delete Account Button */}
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount || !dangerAccepted || !dangerPassword}
            className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 disabled:opacity-40 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {isDeletingAccount ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Flame className="w-3.5 h-3.5" />
            )}
            <span>حذف کامل حساب</span>
          </button>

          {/* Logout with Confirmation Button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
          >
            <span>🚪</span>
            <span>خروج از حساب (با تأیید)</span>
          </button>
        </div>
      </div>

      {/* Footer links (Matching Screenshot 5) */}
      <footer className="text-center text-[11px] text-zinc-500 space-x-3 space-x-reverse pt-2">
        <span className="hover:text-zinc-300 cursor-pointer">سیاست حریم خصوصی</span>
        <span>•</span>
        <span className="hover:text-zinc-300 cursor-pointer">شرایط استفاده</span>
        <span>•</span>
        <span className="hover:text-zinc-300 cursor-pointer">گزارش محتوا</span>
      </footer>

      {/* Bottom buffer matching the floating nav bar height */}
      <div className="h-16 sm:h-20 w-full pointer-events-none" aria-hidden="true" />

      {/* MOBILE CHANGE MODAL */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-right space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-400" />
              <span>{mobileOtpStep === 1 ? 'گام اول: تأیید شماره فعلی' : 'گام دوم: تأیید شماره جدید'}</span>
            </h3>

            {mobileOtpStep === 1 ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  کد تأیید ۶ رقمی به شماره فعلی شما ({toPersianDigits(user.mobile)}) پیامک شد.
                </p>

                {mobileOtpDemo && (
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-300 font-mono text-center">
                    کد شبیه‌ساز آزمایشی: {mobileOtpDemo}
                  </div>
                )}

                <input
                  type="text"
                  maxLength={6}
                  placeholder="کد ۶ رقمی"
                  value={mobileOtpCode}
                  onChange={(e) => setMobileOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono text-base tracking-widest text-orange-400 focus:outline-none"
                  dir="ltr"
                />

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium">شماره موبایل جدید</label>
                  <input
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={newMobileInput}
                    onChange={(e) => setNewMobileInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                {mobileError && <div className="text-[11px] text-rose-400">{mobileError}</div>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleVerifyOldMobileOtp}
                    disabled={isProcessingMobile || mobileOtpCode.length !== 6 || !newMobileInput}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                  >
                    ارسال کد به شماره جدید
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  کد تأیید به شماره جدید ({toPersianDigits(newMobileInput)}) ارسال گردید.
                </p>

                {mobileOtpDemo && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono text-center">
                    کد شبیه‌ساز شماره جدید: {mobileOtpDemo}
                  </div>
                )}

                <input
                  type="text"
                  maxLength={6}
                  placeholder="کد ۶ رقمی جدید"
                  value={mobileOtpCode}
                  onChange={(e) => setMobileOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono text-base tracking-widest text-emerald-400 focus:outline-none"
                  dir="ltr"
                />

                {mobileError && <div className="text-[11px] text-rose-400">{mobileError}</div>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleFinalizeMobileChange}
                    disabled={isProcessingMobile || mobileOtpCode.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                  >
                    تأیید نهایی شماره جدید
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-right space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>
                {passwordStep === 'otp'
                  ? 'گام دوم: تأیید پیامکی هویت'
                  : 'گام سوم: تعریف رمز جدید'}
              </span>
            </h3>

            {passwordStep === 'otp' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  کد تأیید ۶ رقمی به شماره ثبت‌شده حساب شما ارسال شد.
                </p>

                {passwordOtpDemo && (
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-300 font-mono text-center">
                    کد شبیه‌ساز تغییر رمز: {passwordOtpDemo}
                  </div>
                )}

                <input
                  type="text"
                  maxLength={6}
                  placeholder="کد ۶ رقمی"
                  value={passwordOtpCode}
                  onChange={(e) => setPasswordOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono text-base tracking-widest text-orange-400 focus:outline-none"
                  dir="ltr"
                />

                {passwordError && <div className="text-[11px] text-rose-400">{passwordError}</div>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleVerifyPasswordOtp}
                    disabled={passwordOtpCode.length !== 6}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                  >
                    تأیید و رفتن به تعریف رمز
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}

            {passwordStep === 'new_password' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium">رمز عبور جدید (حداقل ۸ کاراکتر)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium">تکرار رمز عبور جدید</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                  />
                </div>

                {passwordError && <div className="text-[11px] text-rose-400">{passwordError}</div>}
                {passwordSuccess && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>رمز عبور با موفقیت به‌روزرسانی شد.</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleFinalizePassword}
                    disabled={!newPasswordInput || !confirmPasswordInput}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                  >
                    ذخیره رمز عبور جدید
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
