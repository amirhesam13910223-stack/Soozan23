/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Share2, Smartphone, KeyRound, ShieldAlert, Flame, Home, Info, MessageSquare } from 'lucide-react';
import { WizardState } from '../../types/wizard';
import { MessengerShareModal } from '../share/MessengerShareModal';

interface Props {
  state: WizardState;
  onGoToDashboard: () => void;
}

export const Step6IssueResult: React.FC<Props> = ({ state, onGoToDashboard }) => {
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [copiedManage, setCopiedManage] = useState<boolean>(false);
  const [showMessengerModal, setShowMessengerModal] = useState<boolean>(false);

  const handleCopyShare = () => {
    if (!state.rawShareCode64) return;
    navigator.clipboard.writeText(state.rawShareCode64);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  const handleCopyManage = () => {
    if (!state.manageCode) return;
    navigator.clipboard.writeText(state.manageCode);
    setCopiedManage(true);
    setTimeout(() => setCopiedManage(false), 3000);
  };

  const handleNativeShare = () => {
    if (navigator.share && state.rawShareCode64) {
      navigator.share({
        title: 'کد اشتراک فایل خودنابودشونده سوزان',
        text: `کد دریافت فایل امن در اپلیکیشن سوزان:\n${state.rawShareCode64}`,
      }).catch(() => {});
    } else {
      handleCopyShare();
    }
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS TOP BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-tr from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-white">فایل با موفقیت مهر شد و کد اشتراک صادر گردید</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          فایل شما با الگوریتم AES-GCM-256 رمزنگاری شد و کلید آن در گاوصندوق تفکیک‌شده قرار گرفت.
        </p>
      </div>

      {/* 64-CHAR RECIPIENT SHARE CODE (Section 3: ONLY ONCE DISPLAYED, IRRECOVERABLE) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-orange-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-xs font-bold text-zinc-100">
              کد اشتراک گیرنده (۶۴ کاراکتر تصادفی یکتا)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMessengerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>قالب پیام‌رسان‌ها (ایتا، بله، تلگرام)</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>اشتراک‌گذاری</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShare}
              className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedShare ? 'کپی شد' : 'کپی کد ۶۴ کاراکتری'}</span>
            </button>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-orange-400 tracking-wider break-all text-center select-all dir-ltr leading-relaxed font-bold shadow-inner"
          dir="ltr"
        >
          {state.rawShareCode64}
        </div>

        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            <strong>خط قرمز محرمانگی:</strong> این کد ۶۴ کاراکتری کلید انحصاری گیرنده است و <strong>تنها یک‌بار</strong> در همین صفحه نمایش داده می‌شود. پس از بستن این پنجره، متن خام کد در هیچ کجای سرور یا دیتابیس قابل بازیابی نخواهد بود. لطفاً همین حالا آن را کپی کرده و برای گیرنده بفرستید.
          </span>
        </div>
      </div>

      {/* SENDER'S MANAGEMENT CODE */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-200">کد مدیریت فرستنده</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            برای حذف فوری، مدیریت و مشاهده رویدادهای فایل در داشبورد
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-500/30 dir-ltr" dir="ltr">
            {state.manageCode}
          </span>
          <button
            type="button"
            onClick={handleCopyManage}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
            title="کپی کد مدیریت"
          >
            {copiedManage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PERMANENT TEXTUAL APP REQUIREMENT REMINDER (Section 5.3 of product brief) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-300">
            یادآور ضروری: الزام نصب اپلیکیشن سوزان برای گیرنده
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            برای دریافت و بازگشایی فایل، گیرنده حتماً باید <strong>اپلیکیشن سوزان</strong> را بر روی گوشی خود داشته باشد. به دلیل فعال بودن پروتکل‌های ضد اسکرین‌شات و ضبط صفحه، دریافت محتوا روی مرورگر وب انجام نمی‌شود.
          </p>
        </div>
      </div>

      {/* WHAT HAPPENS NEXT EXPLANATION */}
      <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-orange-400" />
          <span>بعد از این چه اتفاقی می‌افتد؟</span>
        </div>
        <ol className="space-y-2 text-xs text-zinc-400 pr-2 list-decimal list-inside leading-relaxed">
          <li>کد ۶۴ کاراکتری اشتراک را برای گیرنده مورد نظر ارسال می‌کنید.</li>
          <li>گیرنده کد را در بخش «دریافت فایل» اپلیکیشن سوزان بدون نیاز به ثبت‌نام وارد می‌کند.</li>
          <li>به محض رسیدن به سقف بازدید یا سررسید زمان انقضا، فایل و کلید رمزنگاری آن برای همیشه نابود و خاکستر می‌شود.</li>
          <li>شما می‌توانید وضعیت سوختن یا تعداد بازدیدهای مصرف‌شده را در داشبورد خود رصد کنید.</li>
        </ol>
      </div>

      {/* GO TO DASHBOARD BUTTON */}
      <div className="flex justify-end pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onGoToDashboard}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/30 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>رفتن به داشبورد و مشاهده فایل‌ها</span>
        </button>
      </div>

      {/* Messenger Share Templates Modal */}
      {showMessengerModal && state.rawShareCode64 && (
        <MessengerShareModal
          rawShareCode64={state.rawShareCode64}
          fileName={state.fileName}
          destructionSummary={state.humanSummary}
          hasPassword={state.hasPassword}
          onClose={() => setShowMessengerModal(false)}
        />
      )}
    </div>
  );
};
