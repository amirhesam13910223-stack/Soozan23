/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, ArrowRight, ArrowLeft, Lock, Info, Bell } from 'lucide-react';
import { WizardState } from '../../types/wizard';
import { toPersianDigits } from '../../services/security';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Personalization: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {
  const [newMessage, setNewMessage] = useState<string>('');

  const handleAddRecipientMessage = () => {
    if (!newMessage.trim()) return;
    updateState({
      recipientMessages: [...state.recipientMessages, newMessage.trim()],
    });
    setNewMessage('');
  };

  const handleRemoveRecipientMessage = (index: number) => {
    const filtered = state.recipientMessages.filter((_, i) => i !== index);
    updateState({ recipientMessages: filtered });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-100">گام ۴ از ۶: شخصی‌سازی و پیام‌های گیرنده</h3>
        <p className="text-xs text-zinc-400 mt-1">
          تنظیم یادداشت محرمانه فرستنده و پیام‌های متوالی که گیرنده پیش از مشاهده محتوا می‌بیند
        </p>
      </div>

      {/* SENDER'S PRIVATE NOTE (Only visible to sender in dashboard) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-200">
              یادداشت خصوصی فرستنده (کاملاً محرمانه)
            </label>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              این یادداشت فقط در داشبورد خودتان نمایش داده می‌شود و گیرنده هرگز آن را نمی‌بیند.
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="مثلاً: قرارداد پروژه X - تحویل به آقای کمالی"
          value={state.senderNote}
          onChange={(e) => updateState({ senderNote: e.target.value })}
          className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* OPTIONAL WELCOME / WARNING MESSAGE */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-200">
              پیام خوش‌آمد / هشدار به گیرنده (اختیاری)
            </label>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              پیامی که در صفحه اول دریافت به صورت برجسته به گیرنده نمایش داده می‌شود.
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="مثلاً: توجه: این فایل حاوی اطلاعات محرمانه است و تنها یک‌بار فرصت مشاهده دارید."
          value={state.welcomeMessage}
          onChange={(e) => updateState({ welcomeMessage: e.target.value })}
          className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* RECIPIENT ORDERED MESSAGES */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-200">
              زنجیره پیام‌های شخصی گیرنده (به ترتیب نمایش)
            </label>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              گیرنده پیش از دسترسی به فایل اصلی، این پیام‌ها را به صورت اسلاید مرحله‌ای مشاهده خواهد کرد.
            </div>
          </div>
        </div>

        {/* Existing Messages List */}
        <div className="space-y-2">
          {state.recipientMessages.map((msg, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-mono font-bold text-zinc-400">
                  {toPersianDigits(idx + 1)}
                </span>
                <span className="text-zinc-200 leading-relaxed">{msg}</span>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveRecipientMessage(idx)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="حذف پیام"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {state.recipientMessages.length === 0 && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-center text-xs text-zinc-500">
              هنوز پیامی برای گیرنده ثبت نشده است (اختیاری).
            </div>
          )}
        </div>

        {/* Add Message Input */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="متن پیام جدید برای گیرنده..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRecipientMessage();
              }
            }}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-orange-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddRecipientMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن</span>
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به محافظت</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center gap-2"
        >
          <span>ادامه به بازبینی نهایی</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
