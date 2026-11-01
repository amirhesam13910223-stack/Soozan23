/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, XCircle, RotateCw, X, ShieldAlert } from 'lucide-react';
import { SecurityCheckResult } from '../../types';
import { runPhase1SecurityTests } from '../../services/phase1-tests';

interface Props {
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<Props> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<SecurityCheckResult[] | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await runPhase1SecurityTests();
      setResults(res);
    } finally {
      setIsRunning(false);
    }
  };

  const allPassed = results && results.length > 0 && results.every((r) => r.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">سنجش زنده خطوط قرمز امنیتی سوزان (فاز ۱ تا ۷)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                تست خودکار سناریوهای طلایی RLS، نشست‌ها، قفل OTP، بدافزار، کد ۶۴ کاراکتری، امحای رمزارزی، ممیزی، تاب‌آوری ۱۰۰ کاربر و بک‌آپ ۳-۲-۱
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <div className="my-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="text-xs text-zinc-300">
            برای اعتبارسنجی مستقل دروازه امنیتی فاز ۱، تست‌های خودکار را اجرا کنید.
          </div>
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>در حال اجرای آزمون‌ها...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>اجرای کلیه آزمون‌های امنیتی فاز ۱</span>
              </>
            )}
          </button>
        </div>

        {/* Overall Verdict Banner */}
        {results && (
          <div
            className={`mb-5 p-4 rounded-2xl border flex items-center gap-3 text-xs font-medium ${
              allPassed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm mb-0.5">
                {allPassed
                  ? 'همه آزمون‌های امنیتی فاز ۱ با موفقیت پاس شدند (دروازه سبز)'
                  : 'برخی سناریوها نیاز به بازبینی دارند'}
              </div>
              <div className="text-[11px] opacity-80">
                انطباق کامل با rules/10-security-redlines و rules/15-rls-data-isolation.
              </div>
            </div>
          </div>
        )}

        {/* Results List */}
        {results && (
          <div className="space-y-3">
            {results.map((res, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-zinc-200">
                    {res.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{res.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      res.passed
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {res.passed ? 'تأیید شده' : 'شکست'}
                  </span>
                </div>

                <p className="text-zinc-300 leading-relaxed pr-6">{res.message}</p>

                {res.details && (
                  <div className="pr-6 pt-1 font-mono text-[11px] text-zinc-500">
                    جزئیات: {res.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
