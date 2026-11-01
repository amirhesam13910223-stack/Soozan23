/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Stamp, ShieldCheck, AlertCircle, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { WatermarkPosition, WizardState } from '../../types/wizard';
import { PasswordStrengthIndicator } from '../auth/PasswordStrengthIndicator';
import { evaluatePasswordRules, toPersianDigits } from '../../services/security';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3Protection: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (state.hasPassword) {
      if (!state.password) {
        setError('لطفاً رمز عبور فایل را وارد کنید یا گزینه رمز عبور را غیرفعال نمایید.');
        return;
      }
      const { isValid } = evaluatePasswordRules(state.password);
      if (!isValid) {
        setError('رمز عبور فایل باید معیارهای امنیتی پنج‌گانه را برآورده سازد.');
        return;
      }
      if (state.password !== state.confirmPassword) {
        setError('تکرار رمز عبور با رمز اصلی مطابقت ندارد.');
        return;
      }
    }

    if (state.hasWatermark && !state.watermarkText.trim()) {
      setError('لطفاً متن واترمارک را وارد کنید یا گزینه واترمارک را خاموش کنید.');
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-100">گام ۳ از ۶: لایه‌های محافظت و محرمانگی</h3>
        <p className="text-xs text-zinc-400 mt-1">
          تعیین رمز عبور فایل با سقف تلاش و درج واترمارک بازدارنده روی محتوا
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* OPTIONAL PASSWORD PROTECTION */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">رمز عبور اختصاصی فایل</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">گیرنده برای باز کردن محتوا باید این رمز را بداند</div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={state.hasPassword}
              onChange={(e) => updateState({ hasPassword: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {state.hasPassword && (
          <div className="pt-4 border-t border-zinc-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  رمز عبور قوی فایل:
                </label>
                <input
                  type="password"
                  placeholder="رمز عبور"
                  value={state.password}
                  onChange={(e) => updateState({ password: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  تکرار رمز عبور:
                </label>
                <input
                  type="password"
                  placeholder="تکرار رمز عبور"
                  value={state.confirmPassword}
                  onChange={(e) => updateState({ confirmPassword: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Live Password Strength rules */}
            <PasswordStrengthIndicator password={state.password} />

            {/* Password Max Attempts */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                سقف تلاش گیرنده برای ورود رمز (پس از آن فایل برای همیشه مسدود می‌شود):
              </label>
              <div className="flex gap-2">
                {([3, 5, 10] as const).map((att) => (
                  <button
                    key={att}
                    type="button"
                    onClick={() => updateState({ passwordMaxAttempts: att })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      state.passwordMaxAttempts === att
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {toPersianDigits(att)} تلاش
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OPTIONAL WATERMARK */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">واترمارک بازدارنده روی محتوا</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">درج متن یا شناسه فرستنده روی پیش‌نمایش محتوا</div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={state.hasWatermark}
              onChange={(e) => updateState({ hasWatermark: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {state.hasWatermark && (
          <div className="pt-4 border-t border-zinc-800/80 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                متن واترمارک:
              </label>
              <input
                type="text"
                placeholder="مثلاً: محرمانه - فقط جهت مشاهده توسط مخاطب"
                value={state.watermarkText}
                onChange={(e) => updateState({ watermarkText: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                موقعیت قرارگیری واترمارک:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'center_faint' as WatermarkPosition, label: 'مرکز کمرنگ' },
                  { id: 'corners' as WatermarkPosition, label: 'گوشه‌ها' },
                  { id: 'tiled' as WatermarkPosition, label: 'تکرارشونده در صفحه' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => updateState({ watermarkPosition: pos.id })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      state.watermarkPosition === pos.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deterrent Notice (Section 9 & 4.7) */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>توضیح شفاف امنیتی:</strong> واترمارک لایه‌ای بازدارنده است و انگیزه عکس‌برداری فیزیکی را کاهش می‌دهد. لایه ضد اسکرین‌شات و ضبط صفحه در داخل اپلیکیشن سوزان به صورت سیستمی فعال است.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به قوانین نابودی</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center gap-2"
        >
          <span>ادامه به شخصی‌سازی پیام‌ها</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
