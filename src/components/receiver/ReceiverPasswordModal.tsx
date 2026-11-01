/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, KeyRound, AlertTriangle, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';
import { toPersianDigits } from '../../services/security';

interface Props {
  fileName: string;
  maxAttempts: number;
  remainingAttempts: number;
  onSubmit: (password: string) => Promise<{ success: boolean; burned: boolean; remaining: number; message: string }>;
  onCancel: () => void;
}

export const ReceiverPasswordModal: React.FC<Props> = ({
  fileName,
  maxAttempts,
  remainingAttempts: initialRemaining,
  onSubmit,
  onCancel,
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(initialRemaining);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('لطفاً گذرواژه فایل را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await onSubmit(password);
      if (!res.success) {
        setRemainingAttempts(res.remaining);
        setErrorMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-5 animate-scale-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">فایل نیازمند گذرواژه است</h3>
            <p className="text-xs text-zinc-400 font-mono truncate max-w-[240px] mt-0.5" dir="ltr">
              {fileName}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs text-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">سقف مجاز تلاش:</span>
            <span className="font-semibold text-zinc-200">{toPersianDigits(maxAttempts)} بار</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">فرصت‌های باقی‌مانده:</span>
            <span className={`font-bold ${remainingAttempts <= 1 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
              {toPersianDigits(remainingAttempts)} فرصت
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong>خط قرمز امنیتی:</strong> در صورت وارد کردن رمز نادرست در آخرین فرصت، فایل بلافاصله و برای همیشه با انهدام رمزارزی خواهد سوخت و دسترسی قطع خواهد شد.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              گذرواژه تعیین‌شده توسط فرستنده:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="گذرواژه را وارد کنید..."
                className="w-full px-4 py-3 pl-11 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:border-amber-500 focus:outline-none transition-all dir-ltr"
                dir="ltr"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'در حال بررسی...' : 'تأیید و بازگشایی'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
