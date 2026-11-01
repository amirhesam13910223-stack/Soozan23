/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  X,
  MessageCircle,
  ShieldAlert,
  Flame,
  Send,
  Sparkles,
} from 'lucide-react';

interface Props {
  rawShareCode64: string;
  fileName: string;
  destructionSummary: string;
  hasPassword?: boolean;
  onClose: () => void;
}

export const MessengerShareModal: React.FC<Props> = ({
  rawShareCode64,
  fileName,
  destructionSummary,
  hasPassword = false,
  onClose,
}) => {
  const [activePlatform, setActivePlatform] = useState<'eitaa' | 'bale' | 'telegram'>('eitaa');
  const [copied, setCopied] = useState<boolean>(false);

  const getTemplateText = (platform: 'eitaa' | 'bale' | 'telegram'): string => {
    if (platform === 'eitaa') {
      return `🔒 محتوای امن و خودنابودشونده در سامانه «سوزان»

فایل: ${fileName}
قانون نابودی: ${destructionSummary}
${hasPassword ? '⚠️ توجه: این محتوا دارای رمز عبور محافظتی با سقف تلاش محدود است.\n' : ''}
🔑 کد دریافت محتوا در اپلیکیشن سوزان (۶۴ کاراکتر):
${rawShareCode64}

📌 نحوه دریافت:
اپلیکیشن سوزان را باز کرده و کد بالا را در تب «دریافت فایل» وارد کنید.
(لطفاً این کد را در گروه‌ها یا کانال‌های عمومی ارسال نکنید؛ با رسیدن به سقف بازدید، محتوا برای همیشه می‌سوزد).

سوزان • بفرست، بدون اینکه جا بماند.`;
    }

    if (platform === 'bale') {
      return `📦 بسته محرمانه ارسالی با «سوزان»

نام فایل: ${fileName}
شرایط امحا: ${destructionSummary}
${hasPassword ? '🔐 این بسته نیاز به رمز عبور فرستنده دارد.\n' : ''}
کد ۶۴ رقمی دریافت:
${rawShareCode64}

📱 برای مشاهده، کد را در بخش «دریافت فایل» اپلیکیشن سوزان وارد نمایید.`;
    }

    // Telegram
    return `🔐 محتوای خودتخریب‌گر سوزان (Soozan Secure Drop)

📄 فایل: ${fileName}
⏳ شرایط نابودی: ${destructionSummary}
${hasPassword ? '🛡️ دارای رمز عبور ضد بروت‌فورس\n' : ''}
کد اشتراک اختصاصی:
\`${rawShareCode64}\`

جهت مشاهده و دریافت، کد فوق را در اپلیکیشن رسمی سوزان کپی نمایید. پس از مشاهده طبق شروط بالا، فایل به‌صورت رمزارزی امحا خواهد شد.`;
  };

  const currentTemplate = getTemplateText(activePlatform);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl my-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right">
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">قالب آماده پیام‌رسان‌ها</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/25">
                  ارسال امن
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                قالب‌های از پیش تنظیم‌شده فارسی برای اشتراک امن کد ۶۴ کاراکتری
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

        {/* Platform Selector */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/30 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActivePlatform('eitaa')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activePlatform === 'eitaa'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-orange-400" />
            <span>پیام‌رسان ایتا (Eitaa)</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePlatform('bale')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activePlatform === 'bale'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>پیام‌رسان بله (Bale)</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePlatform('telegram')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activePlatform === 'telegram'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>تلگرام (Telegram)</span>
          </button>
        </div>

        {/* Template Preview Area */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">پیش‌نمایش متن پیام:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'متن کپی شد!' : 'کپی کل پیام برای ارسال'}</span>
            </button>
          </div>

          <div
            className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans select-all max-h-72 overflow-y-auto"
            dir="rtl"
          >
            {currentTemplate}
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>یادآوری امنیتی:</strong> این متن را مستقیماً در گفت‌وگوی دونفره با گیرنده ارسال کنید. برای جلوگیری از مصرف ناخواسته سقف مشاهده، از قرار دادن متن در گروه‌ها خودداری فرمایید.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>سوزان • بفرست، بدون اینکه جا بماند.</span>
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
