/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, ArrowLeft } from 'lucide-react';

const WEB_NOTICE_DISMISSED_KEY = 'soozan_web_notice_dismissed';

export const WebNoticeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(WEB_NOTICE_DISMISSED_KEY) === 'true';
    if (!isDismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(WEB_NOTICE_DISMISSED_KEY, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-zinc-100 mb-2">توجه: الزام اپلیکیشن برای دریافت فایل</h3>
        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
          در نسخه وب سوزان فقط امکان <strong className="text-orange-400">اشتراک‌گذاری فایل</strong> و <strong className="text-orange-400">مدیریت حساب</strong> فرستنده فراهم است.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
          برای حفظ امنیت مطلق و جلوگیری از افشای فایل، <strong>دریافت و نمایش محتوا منحصراً در اپلیکیشن موبایل سوزان</strong> انجام می‌پذیرد. لطفاً کد ۶۴ کاراکتری اشتراک را به گیرنده‌ای بدهید که اپلیکیشن را نصب دارد.
        </p>

        {/* Persistent "Do not show again" Checkbox */}
        <label className="flex items-center gap-2.5 mb-6 cursor-pointer text-xs text-zinc-300 select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0 w-4 h-4"
          />
          <span>این پیام دیگر در این مرورگر نمایش داده نشود</span>
        </label>

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center gap-2"
          >
            <span>متوجه شدم و قبول دارم</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
