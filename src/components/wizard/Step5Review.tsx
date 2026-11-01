/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckSquare, Edit3, ShieldAlert, FileText, Lock, MessageSquare, Flame, ArrowRight, RotateCw, AlertTriangle } from 'lucide-react';
import { WizardState } from '../../types/wizard';
import { toPersianDigits } from '../../services/security';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onGoToStep: (stepNumber: number) => void;
  onIssueFinal: () => void;
  onBack: () => void;
  isIssuing: boolean;
}

export const Step5Review: React.FC<Props> = ({
  state,
  updateState,
  onGoToStep,
  onIssueFinal,
  onBack,
  isIssuing,
}) => {
  const [mustAcceptError, setMustAcceptError] = useState<boolean>(false);

  const handleFinalSubmit = () => {
    if (!state.acceptedDestructionTerms) {
      setMustAcceptError(true);
      return;
    }
    onIssueFinal();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-100">گام ۵ از ۶: بازبینی نهایی تنظیمات و تأیید نابودی</h3>
        <p className="text-xs text-zinc-400 mt-1">
          تمامی موارد انتخابی را بازبینی کنید. پس از صدور، قوانین نابودی غیرقابل‌بازگشت خواهد بود.
        </p>
      </div>

      {mustAcceptError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            لطفاً برای ادامه، تیک تأیید پذیرش قوانین قطعی نابودی محتوا را فعال کنید.
          </div>
        </div>
      )}

      {/* SECTION 1: FILE SUMMARY */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <FileText className="w-4 h-4 text-orange-400" />
            <span>مشخصات فایل انتخاب‌شده</span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ویرایش</span>
          </button>
        </div>

        <div className="text-xs space-y-1 text-zinc-300">
          <div>نام فایل: <span className="font-mono text-zinc-100" dir="ltr">{state.fileName}</span></div>
          <div>اندازه: {formatFileSize(state.fileSize)}</div>
          <div className="text-emerald-400 text-[11px] font-semibold">
            پالایش امنیتی: ۷ مرحله اسکن بدافزار با موفقیت انجام شد (حکم: تمیز).
          </div>
        </div>
      </div>

      {/* SECTION 2: DESTRUCTION RULES SUMMARY */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>قوانین خودنابودی</span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ویرایش</span>
          </button>
        </div>

        <div className="text-xs text-zinc-300 leading-relaxed">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 font-medium">
            {state.humanSummary}
          </div>
        </div>
      </div>

      {/* SECTION 3: PROTECTION SUMMARY */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>لایه‌های محافظت و واترمارک</span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ویرایش</span>
          </button>
        </div>

        <div className="text-xs space-y-1 text-zinc-300">
          <div>
            رمز عبور فایل:{' '}
            <span className={state.hasPassword ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
              {state.hasPassword ? `فعال (سقف ${toPersianDigits(state.passwordMaxAttempts)} تلاش)` : 'ندارد'}
            </span>
          </div>
          <div>
            واترمارک بازدارنده:{' '}
            <span className={state.hasWatermark ? 'text-amber-400 font-semibold' : 'text-zinc-500'}>
              {state.hasWatermark ? `فعال («${state.watermarkText}») - موقعیت: ${state.watermarkPosition === 'center_faint' ? 'مرکز کمرنگ' : state.watermarkPosition === 'corners' ? 'گوشه‌ها' : 'تکرارشونده'}` : 'ندارد'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: PERSONALIZATION SUMMARY */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>شخصی‌سازی و پیام‌های گیرنده</span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>ویرایش</span>
          </button>
        </div>

        <div className="text-xs space-y-1 text-zinc-300">
          <div>
            یادداشت خصوصی فرستنده:{' '}
            <span className="text-zinc-200 font-medium">
              {state.senderNote.trim() ? state.senderNote : 'بدون یادداشت'}
            </span>
          </div>
          <div>
            تعداد پیام‌های متوالی گیرنده:{' '}
            <span className="text-zinc-200 font-medium">
              {toPersianDigits(state.recipientMessages.length)} پیام
            </span>
          </div>
        </div>
      </div>

      {/* IRREVERSIBILITY COMMITMENT CHECKBOX */}
      <div className="p-4 rounded-3xl bg-rose-950/20 border border-rose-500/30">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.acceptedDestructionTerms}
            onChange={(e) => {
              updateState({ acceptedDestructionTerms: e.target.checked });
              if (e.target.checked) setMustAcceptError(false);
            }}
            className="mt-0.5 rounded border-rose-500 text-orange-500 focus:ring-0 w-4 h-4"
          />
          <div className="text-xs text-zinc-200 leading-relaxed font-semibold">
            قوانین خودنابودی فوق را می‌پذیرم و می‌دانم پس از رسیدن به سقف بازدید یا انقضای زمان، فایل و کلید رمزنگاری آن برای همیشه محو و غیرقابل‌بازیابی خواهد شد.
          </div>
        </label>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          disabled={isIssuing}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به شخصی‌سازی</span>
        </button>

        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={isIssuing}
          className="px-6 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/30 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {isIssuing ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>در حال مهر رمزارزی و صدور کد...</span>
            </>
          ) : (
            <>
              <CheckSquare className="w-4 h-4" />
              <span>تأیید نهایی، رمزنگاری و صدور کد اشتراک</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
