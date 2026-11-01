/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  Shield,
  Zap,
  Building2,
  Crown,
  Sparkles,
  X,
  Lock,
  Flame,
  HardDrive,
  FileCheck2,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const PricingModal: React.FC<Props> = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('free');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-5xl my-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right">
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">طرح‌ها و تعرفه‌های امنیتی سوزان</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  شفافیت کامل
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                پیک امن و خودتخریب‌گر فایل برای افراد، کسب‌وکارها و سازمان‌های نیازمند محرمانگی بالا
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PLAN 1: FREE */}
            <div
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                selectedPlan === 'free'
                  ? 'bg-zinc-950 border-orange-500/50 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500/30'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                    طرح پیش‌فرض
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">سوزان پایه (رایگان)</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    برای ارسال‌های سریع شخصی و انتقال امن مدارک
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-2xl font-black text-white">رایگان</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">همیشگی بدون نیاز به پرداخت</div>
                </div>

                <div className="h-px bg-zinc-800 my-4" />

                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>حداکثر حجم فایل: <strong>۵۰ مگابایت</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>سقف انقضا: <strong>تا ۲۴ ساعت</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>حداکثر سقف مشاهده: <strong>۳ بار</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>رمزنگاری <strong>AES-GCM-256</strong> کلاینت</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>اسکن بدافزار ۷ لایه‌ای استاندارد</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 shrink-0" />
                    <span>فاقد واترمارک اختصاصی</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan('free')}
                className="mt-6 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
              >
                طرح فعال شما
              </button>
            </div>

            {/* PLAN 2: PRO */}
            <div
              className={`rounded-3xl p-6 border relative transition-all flex flex-col justify-between ${
                selectedPlan === 'pro'
                  ? 'bg-zinc-950 border-orange-500 shadow-2xl shadow-orange-500/20 ring-2 ring-orange-500/40'
                  : 'bg-zinc-950/80 border-orange-500/30 hover:border-orange-500/60'
              }`}
            >
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black shadow-md">
                پیشنهاد ویژه
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/25">
                    امنیت بالا
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">سوزان پیشرفته (Pro)</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    برای متخصصان، وکلا، پزشکان و مدیران پروژه
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-2xl font-black text-white">۹۹,۰۰۰ <span className="text-xs font-normal text-zinc-400">تومان / ماهانه</span></div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">قابل تمدید دوره‌ای یا لغو</div>
                </div>

                <div className="h-px bg-zinc-800 my-4" />

                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>حداکثر حجم فایل: <strong>۱ گیگابایت</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>سقف انقضا: <strong>تا ۳۰ روز</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>سقف مشاهده: <strong>تا ۲۰ بار یا نامحدود</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>رمز عبور ضد بروت‌فورس سفارشی</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>واترمارک بازدارنده با متن دلخواه</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>اولویت بالا در دفاع Backpressure</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan('pro')}
                className="mt-6 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all"
              >
                ارتقا به طرح پیشرفته
              </button>
            </div>

            {/* PLAN 3: ENTERPRISE */}
            <div
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                selectedPlan === 'enterprise'
                  ? 'bg-zinc-950 border-amber-500/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    سازمانی
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">سوزان سازمانی (Enterprise)</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    برای بانک‌ها، هلدینگ‌ها و ارگان‌های حساس
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-2xl font-black text-white">تماس و قرارداد</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">SLA ۹۹.۹٪ با گواهی امحا</div>
                </div>

                <div className="h-px bg-zinc-800 my-4" />

                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>حداکثر حجم فایل: <strong>تا ۵ گیگابایت</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>گاوصندوق سخت‌افزاری انحصاری (HSM)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>صدور گواهی ممیزی امحای رمزارزی رسمی</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>اتصال به SSO و LDAP سازمان</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>نصب در سرورهای ابری یا محلی (On-Premise)</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan('enterprise')}
                className="mt-6 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
              >
                درخواست دمو و مشاوره سازمانی
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>ضمانت حفظ حریم داده: هیچ فایلی پس از انهدام قابل بازگشت نیست.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
