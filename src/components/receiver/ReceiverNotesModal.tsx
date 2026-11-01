/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, ArrowLeft, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { toPersianDigits } from '../../services/security';

interface Props {
  messages: string[];
  senderNote?: string;
  onComplete: () => void;
}

export const ReceiverNotesModal: React.FC<Props> = ({ messages, senderNote, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const total = messages.length;

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-6 animate-scale-up">
        {/* Header with step indicator */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">پیام‌های فرستنده محتوا</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                مطالعه پیام {toPersianDigits(currentIndex + 1)} از {toPersianDigits(total)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-orange-500'
                    : i < currentIndex
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Note Content Box */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 min-h-[140px] flex flex-col justify-center text-center space-y-3">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
            پیام شماره {toPersianDigits(currentIndex + 1)}
          </span>
          <p className="text-sm text-zinc-200 leading-relaxed font-medium">
            «{messages[currentIndex]}»
          </p>
        </div>

        {/* Sender Note Extra (if on last slide) */}
        {currentIndex === total - 1 && senderNote && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">یادداشت فرستنده: </span>
              <span>{senderNote}</span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {currentIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>پیام قبلی</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 mr-auto"
          >
            <span>{currentIndex === total - 1 ? 'مشاهده محتوای فایل' : 'پیام بعدی'}</span>
            {currentIndex === total - 1 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
