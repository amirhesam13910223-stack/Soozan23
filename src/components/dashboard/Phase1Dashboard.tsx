/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, UserCheck, Smartphone, Lock, Fingerprint, Layers, CheckCircle2, ChevronLeft, Laptop, KeyRound, Flame } from 'lucide-react';
import { User, Session } from '../../types';
import { maskMobile, toPersianDigits, formatPersianRelativeTime } from '../../services/security';
import { SessionsManager } from '../auth/SessionsManager';
import { hasLocalBiometricLock, setLocalBiometricLock, removeLocalBiometricLock } from '../../services/session';

interface Props {
  user: User;
  currentSession: Session;
  onOpenAudit: () => void;
  onSessionRevoked: () => void;
  onAllTerminated: () => void;
  onOpenWizard: () => void;
  onOpenScanner?: () => void;
}

export const Phase1Dashboard: React.FC<Props> = ({
  user,
  currentSession,
  onOpenAudit,
  onSessionRevoked,
  onAllTerminated,
  onOpenWizard,
  onOpenScanner,
}) => {
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(hasLocalBiometricLock());
  const [showPinSetup, setShowPinSetup] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');

  const toggleBiometric = () => {
    if (biometricEnabled) {
      removeLocalBiometricLock();
      setBiometricEnabled(false);
    } else {
      setShowPinSetup(true);
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length >= 4) {
      setLocalBiometricLock(newPin);
      setBiometricEnabled(true);
      setShowPinSetup(false);
      setNewPin('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32 space-y-6">
      {/* Welcome & Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-xl shadow-orange-500/20">
              <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center text-orange-400">
                <UserCheck className="w-8 h-8" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{user.displayName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>نشست احرازشده و فعال</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
                <span>نام کاربری: <span className="font-mono text-zinc-300" dir="ltr">@{user.username}</span> (ثابت)</span>
                <span>•</span>
                <span>شماره همراه: <span className="font-mono text-zinc-300" dir="ltr">{maskMobile(user.mobile)}</span></span>
                <span>•</span>
                <span>عضویت: {formatPersianRelativeTime(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAudit}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>آزمون زنده گیت‌های امنیتی</span>
          </button>
        </div>
      </div>

      {/* Security Architecture Highlights Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RLS Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100">جداسازی داده (RLS Gate)</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            هیچ کوئری بدون Context هویتی اجرا نمی‌شود. تفکیک سطری کامل بین فرستندگان تضمین شده است.
          </p>
          <div className="pt-1 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>سیاست RLS فعال و آزموده</span>
          </div>
        </div>

        {/* OTP Engine Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100">ماشین حالت OTP</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            اعتبار ۱۲۰ ثانیه، سقف ۴ تلاش ناموفق، انقضای ساعت سرور، قفل خودکار و صدور مجدد ایمن.
          </p>
          <div className="pt-1 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>محرمانگی تلاش‌های باقیمانده</span>
          </div>
        </div>

        {/* Local Biometric Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-100">قفل محلی بیومتریک / پین</h4>
            <button
              type="button"
              onClick={toggleBiometric}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                biometricEnabled
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {biometricEnabled ? 'فعال است' : 'غیرفعال (کلیک برای فعال‌سازی)'}
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            صرفاً بازکننده قفل صفحه در همین دستگاه کلاینت؛ هرگز هویت سرور تلقی نمی‌شود.
          </p>
        </div>
      </div>

      {/* PIN Setup Modal if clicked */}
      {showPinSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
            <h3 className="text-sm font-bold mb-2">تعیین پین قفل محلی دستگاه</h3>
            <p className="text-xs text-zinc-400 mb-4">
              پین ۴ تا ۶ رقمی برای قفل محلی وارد کنید:
            </p>
            <form onSubmit={handleSavePin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="****"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono text-base tracking-widest text-zinc-100 focus:border-orange-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinSetup(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={newPin.length < 4}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 text-white disabled:opacity-40"
                >
                  ذخیره پین
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions Manager */}
      <SessionsManager
        user={user}
        currentSessionId={currentSession.id}
        onSessionRevoked={onSessionRevoked}
        onAllTerminated={onAllTerminated}
      />

      {/* Phase 3 Wizard Feature Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-orange-950/30 border border-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
              فاز ۳ فعال است
            </span>
            <span className="text-xs font-semibold text-zinc-300">ویزارد اشتراک‌گذاری فایل</span>
          </div>
          <h4 className="text-sm font-bold text-white">
            ویزارد ۶ مرحله‌ای اشتراک محتوای خودنابودشونده
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
            انتخاب فایل، قوانین نابودی بازدید/زمان به زبان ساده انسانی، رمز اختصاصی، واترمارک، پیام‌های شخصی و صدور کد ۶۴ کاراکتری.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenWizard}
          className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/30 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Flame className="w-4 h-4 fill-white/20" />
          <span>شروع اشتراک‌گذاری فایل (ویزارد)</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Phase 2 Feature Card */}
      <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              فاز ۲ پیاده‌سازی شده
            </span>
            <span className="text-xs font-semibold text-zinc-300">میز کار تخصصی اسکنر و رمزنگاری</span>
          </div>
          <p className="text-xs text-zinc-400">
            تست زنده هفت مرحله بدافزار (EXE پنهان، وب‌شل، بمب فشرده‌سازی، ماکروها و Polyglot) و امحای رمزارزی
          </p>
        </div>
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            <span>میز کار اسکنر ۷ مرحله‌ای</span>
          </button>
        )}
      </div>
    </div>
  );
};
