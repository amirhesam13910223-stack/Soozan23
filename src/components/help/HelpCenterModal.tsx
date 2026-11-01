/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Flame,
  KeyRound,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
  ArrowLeft,
  ArrowRight,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onStartWizard?: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'security' | 'recipient' | 'destruction';
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'security',
    question: 'چرا «سوزان» با پیام‌رسان‌ها یا درایوهای ابری معمولی متفاوت است؟',
    answer:
      'پیام‌رسان‌ها و فضاهای ابری برای ماندگاری و آرشیو طراحی شده‌اند؛ اما سوزان یک پیک امن یک‌بارمصرف است. در سوزان هیچ فایلی ماندگار نیست؛ داده‌ها سمت کلاینت با استاندارد AES-256-GCM رمزگذاری می‌شوند و کلید با رسیدن به شروط نابودی، به‌صورت برگشت‌ناپذیر محو می‌شود. وعده ما صریح است: بفرست، بدون اینکه جا بماند.',
  },
  {
    id: 'faq_2',
    category: 'destruction',
    question: 'اثبات ریاضیاتی امحای رمزارزی (Cryptographic Shredding) چیست؟',
    answer:
      'در ذخیره‌سازی ابری عادی، حذف فایل صرفاً برداشتن اشاره‌گر است. در سوزان، کلید ۲۵۶ بیتی منحصربه‌فرد هر فایل در گاوصندوق ایزوله نگه داشته شده و با تحقق اولین شرط نابودی (سقف بازدید یا انقضا)، کلید فیزیکاً بازنویسی و محو می‌شود. پس از حذف کلید، از نظر ریاضیاتی شکستن رمزنگاری نیازمند میلیاردها سال محاسبات ابررایانه‌ای است؛ یعنی محتوا برای همیشه خاکستر شده است.',
  },
  {
    id: 'faq_3',
    category: 'recipient',
    question: 'آیا گیرنده فایل نیاز به ثبت‌نام یا ثبت شماره موبایل دارد؟',
    answer:
      'خیر، مطلقاً. گیرنده هیچ حسابی نمی‌سازد، وارد هیچ فرمی نمی‌شود، و هیچ شماره تماس، کوکی دائمی یا ردپایی بر جا نمی‌گذارد. گیرنده تنها کد ۶۴ کاراکتری را در اپلیکیشن وارد کرده، پیام‌ها را مرور می‌کند و فایل را می‌بیند.',
  },
  {
    id: 'faq_4',
    category: 'security',
    question: 'چرا دریافت فایل منحصراً در اپلیکیشن موبایل امکان‌پذیر است؟',
    answer:
      'مرورگرهای وب امکان جلوگیری قطعی از اسکرین‌شات و ضبط صفحه را ندارند. برای حفظ حرمت و امنیت فایل‌های محرمانه فرستنده، گیرنده باید از اپلیکیشن موبایل استفاده کند که دارای لایه‌های محافظت سخت‌افزاری ضد ضبط صفحه، واترمارک بازدارنده و ماسک پس‌زمینه است.',
  },
  {
    id: 'faq_5',
    category: 'security',
    question: 'چرا کد ۶۴ کاراکتری اشتراک پس از اتمام ویزارد دیگر نشان داده نمی‌شود؟',
    answer:
      'طبق خط قرمز امنیتی شماره ۳، متن خام کد ۶۴ کاراکتری هرگز در دیتابیس یا سرور ذخیره نمی‌شود و فقط هش SHA-256 آن نگهداری می‌گردد. حتی مدیران و نگهبانان سامانه نیز به متن این کد دسترسی ندارند؛ بنابراین فرستنده باید هنگام صدور کد، آن را کپی و ذخیره کند.',
  },
  {
    id: 'faq_6',
    category: 'destruction',
    question: 'سیستم ضد نفوذ (بروت‌فورس) رمز عبور چگونه کار می‌کند؟',
    answer:
      'اگر برای فایل رمز تعیین کرده باشید، گیرنده فقط تعداد محدودی فرصت ورود (مثلاً ۳ یا ۵ بار) خواهد داشت. در صورتی که حمله‌کننده تلاش‌های نادرست متوالی انجام دهد، سامانه منتظر رسیدن به پایان زمان نمی‌ماند و فوراً با سوزاندن کلید، فایل را منهدم می‌کند.',
  },
  {
    id: 'faq_7',
    category: 'security',
    question: 'آیا مدیران سرور یا نگهبان سامانه می‌توانند محتوای فایل را بخوانند؟',
    answer:
      'به هیچ عنوان. طبق سیاست تفکیک داده RLS و خطوط قرمز امنیتی، نگهبان فقط آمار کلان سلامت، تعداد فایل‌ها و حجم رمزنگاری را می‌بیند و دسترسی خوانا به محتوای فایل‌ها و کدهای ۶۴ کاراکتری صفر مطلق است.',
  },
];

export const HelpCenterModal: React.FC<Props> = ({ onClose, onStartWizard }) => {
  const [activeTab, setActiveTab] = useState<'tour' | 'faq'>('tour');
  const [tourStep, setTourStep] = useState<number>(1);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq_1');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('all');

  const filteredFaqs =
    faqCategoryFilter === 'all'
      ? FAQ_LIST
      : FAQ_LIST.filter((f) => f.category === faqCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl my-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right">
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">مرکز راهنما و سوالات متداول</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/25">
                  راهنمای شفاف
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                پاسخ به دغدغه‌های امنیتی، نحوه کارکرد سوزان و راهنمای گام‌به‌گام
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

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/30 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tour')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'tour'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>تور تعاملی ۳ گام ارسال</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'faq'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>سوالات پرتکرار امنیتی (FAQ)</span>
          </button>
        </div>

        {/* TAB 1: ONBOARDING TOUR */}
        {activeTab === 'tour' && (
          <div className="p-6 space-y-6">
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between max-w-md mx-auto mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      tourStep === step
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 ring-4 ring-orange-500/20'
                        : tourStep > step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {step}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      tourStep === step ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    {step === 1 ? 'رمزنگاری و اسکن' : step === 2 ? 'شروط نابودی' : 'صدور کد اشتراک'}
                  </span>
                  {step < 3 && <div className="w-8 sm:w-16 h-0.5 bg-zinc-800 mx-1" />}
                </div>
              ))}
            </div>

            {/* Tour Cards */}
            {tourStep === 1 && (
              <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">
                  گام اول: بارگذاری فایل، اسکن ۷ لایه‌ای و رمزنگاری مرورگر
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  فایل انتخابی شما پیش از خروج از دستگاه، با استاندارد صنعتی{' '}
                  <strong className="text-orange-400">AES-256-GCM</strong> رمزگذاری می‌شود. همزمان خط لوله امنیتی، بایت‌های جادویی، فایل‌های اجرایی خطرناک و ماکروهای مخرب را مهار می‌کند تا سلامت دو طرف تضمین شود.
                </p>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                  💡 فایل‌های مخرب یا بدافزارها بدون استهلاک رم و بلافاصله مسدود می‌شوند.
                </div>
              </div>
            )}

            {tourStep === 2 && (
              <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">
                  گام دوم: تنظیم قوانین نابودی قطعی، رمز و واترمارک
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  شما مشخص می‌کنید فایل پس از چند بار دیده شدن (مثلاً ۱ یا ۳ بار) یا پس از چه مدت زمانی (مثلاً ۲ ساعت یا ۲۴ ساعت) برای همیشه بسوزد. می‌توانید رمز عبور محافظتی یا واترمارک بازدارنده نیز تعریف کنید.
                </p>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                  💡 شروط به زبان فارسی روان ترجمه شده و در بازبینی نهایی به تایید شما می‌رسند.
                </div>
              </div>
            )}

            {tourStep === 3 && (
              <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">
                  گام سوم: دریافت کد ۶۴ کاراکتری اشتراک (فقط یک‌بار)
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  در پایان، یک کد ۶۴ کاراکتری تصادفی و یک کد مدیریت ۱۶ کاراکتری به شما تحویل داده می‌شود. این کد تنها کلید دسترسی گیرنده است و هیچ لینکی وجود ندارد. کد را برای گیرنده بفرستید تا در اپلیکیشن موبایل فایل را ببیند.
                </p>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                  💡 پس از بستن ویزارد، کد ۶۴ کاراکتری در هیچ کجای سیستم قابل بازخوانی نخواهد بود.
                </div>
              </div>
            )}

            {/* Tour Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setTourStep((s) => Math.max(1, s - 1))}
                disabled={tourStep === 1}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs text-zinc-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>گام قبلی</span>
              </button>

              {tourStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setTourStep((s) => Math.min(3, s + 1))}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs text-white font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                >
                  <span>گام بعدی</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartWizard) onStartWizard();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>آغاز اشتراک‌گذاری یک فایل</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FAQ */}
        {activeTab === 'faq' && (
          <div className="p-6 space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setFaqCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  faqCategoryFilter === 'all'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                همه سوالات
              </button>
              <button
                type="button"
                onClick={() => setFaqCategoryFilter('security')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  faqCategoryFilter === 'security'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                امنیت و محرمانگی
              </button>
              <button
                type="button"
                onClick={() => setFaqCategoryFilter('destruction')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  faqCategoryFilter === 'destruction'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                قوانین امحا و نابودی
              </button>
              <button
                type="button"
                onClick={() => setFaqCategoryFilter('recipient')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  faqCategoryFilter === 'recipient'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                تجربه گیرنده
              </button>
            </div>

            {/* Accordion */}
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full p-4 flex items-center justify-between text-right text-xs font-bold text-zinc-200 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 bg-zinc-950/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>«بفرست، بدون اینکه جا بماند»</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            بستن مرکز راهنما
          </button>
        </div>
      </div>
    </div>
  );
};
