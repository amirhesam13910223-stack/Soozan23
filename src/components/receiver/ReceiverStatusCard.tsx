/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Clock, ShieldAlert, KeyRound, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { toPersianDigits } from '../../services/security';

export type ReceiverStatusKind = 'burned' | 'expired' | 'quarantined' | 'invalid' | 'password_exhausted';

interface Props {
  status: ReceiverStatusKind;
  fileName?: string;
  burnReason?: string;
  burnedAt?: number;
  onReset: () => void;
}

export const ReceiverStatusCard: React.FC<Props> = ({
  status,
  fileName,
  burnReason,
  burnedAt,
  onReset,
}) => {
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${toPersianDigits(d.toLocaleDateString('fa-IR'))} ساعت ${toPersianDigits(
      d.getHours().toString().padStart(2, '0')
    )}:${toPersianDigits(d.getMinutes().toString().padStart(2, '0'))}`;
  };

  if (status === 'burned' || status === 'password_exhausted') {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border border-rose-500/30 shadow-2xl text-center space-y-6 animate-scale-up">
        {/* Ash & Fire Iconography */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-950 to-zinc-900 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl">
            <Flame className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>امحای رمزارزی قطعی (Cryptographic Shredding)</span>
          </div>
          <h2 className="text-xl font-black text-white">این محتوا اکنون سوخت</h2>
          <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
            کلید رمزنگاری این فایل از گاوصندوق محرمانگی سوزان برای همیشه پاک شده و متن رمزگذاری‌شده امحا گردید. هیچ اثری از این فایل در هیچ کجای سرور یا دستگاه باقی نمانده است.
          </p>
        </div>

        {/* Details Box */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-400 space-y-2 text-right">
          {fileName && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">عنوان فایل:</span>
              <span className="font-mono text-zinc-300" dir="ltr">{fileName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">علت نابودی:</span>
            <span className="text-rose-300 font-medium">
              {burnReason || (status === 'password_exhausted' ? 'تکمیل سقف تلاش‌های ناموفق گذرواژه' : 'تکمیل سقف بازدید / سوزاندن فوری')}
            </span>
          </div>
          {burnedAt && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">زمان امحا:</span>
              <span className="text-zinc-300">{formatTime(burnedAt)}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-100 flex items-center justify-center gap-2 transition-colors border border-zinc-700"
        >
          <RefreshCw className="w-4 h-4 text-orange-400" />
          <span>دریافت فایل یا کد دیگر</span>
        </button>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-2xl text-center space-y-6 animate-scale-up">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
          <Clock className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">مهلت زمانی محتوا به پایان رسیده است</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            فرستنده برای این فایل محدودیت زمانی تعیین کرده بود. با سپری شدن زمان مقرر، محتوا به صورت خودکار منهدم شد و دیگر در دسترس نیست.
          </p>
        </div>

        {fileName && (
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>فایل:</span>
            <span className="font-mono text-zinc-300" dir="ltr">{fileName}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-100 flex items-center justify-center gap-2 transition-colors border border-zinc-700"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>بررسی کد دیگر</span>
        </button>
      </div>
    );
  }

  if (status === 'quarantined') {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-rose-500/40 shadow-2xl text-center space-y-6 animate-scale-up">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">محتوا در قرنطینه امنیتی قرار دارد</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            این فایل به دلیل شناسایی رفتارهای مشکوک یا مخاطرات امنیتی توسط خط لوله اسکن بدافزار سوزان، قرنطینه شده و غیرقابل تحویل به گیرنده است.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-100 flex items-center justify-center gap-2 transition-colors border border-zinc-700"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>
      </div>
    );
  }

  // Invalid code
  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center space-y-6 animate-scale-up">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-400 shadow-xl">
        <KeyRound className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-white">کد اشتراک یافت نشد یا معتبر نیست</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          کد ۶۴ کاراکتری وارد شده در پایگاه امن سوزان وجود ندارد یا ممکن است هنگام کپی کردن کاراکتری از قلم افتاده باشد. لطفاً صحت کد را با فرستنده بررسی کنید.
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
      >
        <RefreshCw className="w-4 h-4" />
        <span>تلاش مجدد و ورود کد</span>
      </button>
    </div>
  );
};
