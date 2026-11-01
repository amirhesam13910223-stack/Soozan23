/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  ArrowLeft,
  ClipboardPaste,
  Sparkles,
  Flame,
  Clock,
  Lock,
  FileCheck,
} from 'lucide-react';
import { db } from '../../services/db';
import { sha256, toPersianDigits } from '../../services/security';
import { SoozanFileRecord } from '../../types';
import { ReceiverStatusCard, ReceiverStatusKind } from './ReceiverStatusCard';
import { ReceiverPasswordModal } from './ReceiverPasswordModal';
import { ReceiverNotesModal } from './ReceiverNotesModal';
import { SecureFileViewer } from './SecureFileViewer';

// Pre-defined sample 64-character codes for instant evaluation
const SAMPLE_CODES = [
  {
    id: 'active',
    title: 'فایل فعال با پیام فرستنده',
    desc: 'سند فعال همراه با پیام‌های متوالی و واترمارک',
    code: 'SoozanActiveFileKeyForRecipientDemoTesting2026ConfidentialToken01',
    badge: 'فعال',
    color: 'emerald',
    icon: FileCheck,
  },
  {
    id: 'password',
    title: 'فایل رمزدار با سقف ۳ تلاش',
    desc: 'نیازمند گذرواژه (رمز نمونه: soozan1403)',
    code: 'SoozanPasswordFileKeyForRecipientDemoTesting2026LockedWithPass01',
    badge: 'دارای رمز',
    color: 'amber',
    icon: Lock,
  },
  {
    id: 'burned',
    title: 'محتوای سوخته‌شده',
    desc: 'امحای رمزارزی به دلیل تکمیل سقف ۱ بازدید',
    code: 'SoozanBurnedFileKeyForRecipientDemoTesting2026AlreadyDestroyed01',
    badge: 'سوخته',
    color: 'rose',
    icon: Flame,
  },
  {
    id: 'expired',
    title: 'فایل منقضی‌شده زمانی',
    desc: 'نابودی خودکار پس از پایان مهلت مقرر فرستنده',
    code: 'SoozanExpiredFileKeyForRecipientDemoTesting2026LifetimeExceeded01',
    badge: 'منقضی',
    color: 'zinc',
    icon: Clock,
  },
];

type ReceiverScreen = 'input' | 'password_gate' | 'notes_sequence' | 'file_viewer' | 'status_result';

export const ReceiveFileView: React.FC = () => {
  const [shareCode, setShareCode] = useState<string>('');
  const [currentScreen, setCurrentScreen] = useState<ReceiverScreen>('input');
  const [currentFile, setCurrentFile] = useState<SoozanFileRecord | null>(null);
  const [activeShareCode64, setActiveShareCode64] = useState<string>('');
  const [isLastView, setIsLastView] = useState<boolean>(false);
  const [statusKind, setStatusKind] = useState<ReceiverStatusKind>('invalid');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const cleanCode = shareCode.replace(/\s+/g, '');

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/\s+/g, '');
      setShareCode(cleaned);
      setErrorMessage(null);
    } catch {
      setErrorMessage('امکان خواندن مستقیم از کلیپ‌بورد فراهم نشد. لطفاً به صورت دستی کد را بچسبانید.');
    }
  };

  const handleSelectSample = (sampleCode: string) => {
    setShareCode(sampleCode);
    setErrorMessage(null);
    processCodeLookup(sampleCode);
  };

  const processCodeLookup = async (rawInputCode: string) => {
    const raw = rawInputCode.replace(/\s+/g, '');
    if (raw.length !== 64) {
      setErrorMessage(
        `طول کد اشتراک باید دقیقاً ۶۴ کاراکتر باشد. (تعداد کاراکترهای فعلی: ${toPersianDigits(raw.length)})`
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Calculate SHA-256 hash using salt
      const hash = await sha256(raw, 'soozan_share_salt_v1');

      // 2. Query file by hash (Redline rule: recipient gets NO user identity records)
      const record = db.getFileByShareCodeHash(hash);

      if (!record) {
        setStatusKind('invalid');
        setCurrentScreen('status_result');
        return;
      }

      setCurrentFile(record);
      setActiveShareCode64(raw);

      // Check terminal states
      if (record.status === 'burned') {
        setStatusKind('burned');
        setCurrentScreen('status_result');
        return;
      }

      if (record.status === 'expired') {
        setStatusKind('expired');
        setCurrentScreen('status_result');
        return;
      }

      if (record.status === 'quarantined') {
        setStatusKind('quarantined');
        setCurrentScreen('status_result');
        return;
      }

      // Check Password Protection Gate
      if (record.filePasswordHash) {
        setCurrentScreen('password_gate');
        return;
      }

      // Check Sequential Messages Gate
      if (record.recipientMessages && record.recipientMessages.length > 0) {
        setCurrentScreen('notes_sequence');
        return;
      }

      // Proceed directly to File Viewer
      openViewerWithConsumption(record, raw);
    } catch {
      setErrorMessage('خطایی در پردازش امنیتی کد رخ داد. لطفاً مجدداً امتحان کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const openViewerWithConsumption = (record: SoozanFileRecord, rawCode: string) => {
    // Consume view in database
    const consumeRes = db.consumeFileView(record.id);
    setIsLastView(consumeRes.isLastView);
    setCurrentFile(consumeRes.record || record);
    setActiveShareCode64(rawCode);
    setCurrentScreen('file_viewer');
  };

  const handlePasswordSubmit = async (candidatePassword: string) => {
    if (!currentFile || !activeShareCode64) {
      return { success: false, burned: false, remaining: 0, message: 'خطای نامشخص' };
    }

    const result = await db.verifyFilePassword(currentFile.id, activeShareCode64, candidatePassword);

    if (result.burned) {
      setStatusKind('password_exhausted');
      setCurrentScreen('status_result');
      return result;
    }

    if (result.success) {
      // Password correct! If messages exist, show them next, else open viewer
      if (currentFile.recipientMessages && currentFile.recipientMessages.length > 0) {
        setCurrentScreen('notes_sequence');
      } else {
        openViewerWithConsumption(currentFile, activeShareCode64);
      }
    }

    return result;
  };

  const handleNotesComplete = () => {
    if (currentFile && activeShareCode64) {
      openViewerWithConsumption(currentFile, activeShareCode64);
    }
  };

  const handleBurnNow = () => {
    if (currentFile) {
      db.recipientBurnSelf(currentFile.id);
      setStatusKind('burned');
      setCurrentScreen('status_result');
    }
  };

  const handleReset = () => {
    setShareCode('');
    setCurrentFile(null);
    setActiveShareCode64('');
    setErrorMessage(null);
    setCurrentScreen('input');
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center py-6">
      {/* 1. STATUS RESULT SCREEN (Burned / Expired / Quarantined / Invalid) */}
      {currentScreen === 'status_result' && (
        <ReceiverStatusCard
          status={statusKind}
          fileName={currentFile?.fileName}
          burnReason={currentFile?.burnReason}
          burnedAt={currentFile?.burnedAt}
          onReset={handleReset}
        />
      )}

      {/* 2. PASSWORD GATE MODAL */}
      {currentScreen === 'password_gate' && currentFile && (
        <ReceiverPasswordModal
          fileName={currentFile.fileName}
          maxAttempts={currentFile.passwordMaxAttempts || 3}
          remainingAttempts={
            (currentFile.passwordMaxAttempts || 3) - (currentFile.failedPasswordAttempts || 0)
          }
          onSubmit={handlePasswordSubmit}
          onCancel={handleReset}
        />
      )}

      {/* 3. SEQUENTIAL NOTES MODAL */}
      {currentScreen === 'notes_sequence' && currentFile && currentFile.recipientMessages && (
        <ReceiverNotesModal
          messages={currentFile.recipientMessages}
          senderNote={currentFile.senderNote}
          onComplete={handleNotesComplete}
        />
      )}

      {/* 4. SECURE FILE VIEWER */}
      {currentScreen === 'file_viewer' && currentFile && (
        <SecureFileViewer
          file={currentFile}
          rawShareCode64={activeShareCode64}
          isLastView={isLastView}
          onBurnNow={handleBurnNow}
          onClose={handleReset}
        />
      )}

      {/* 5. CODE INPUT FORM (Matching Screenshot 3) */}
      {currentScreen === 'input' && (
        <div className="max-w-md mx-auto px-4 w-full py-6 space-y-6 text-center animate-fade-in overflow-x-hidden">
          {/* Top Brand & Subtitle (Screenshot 3) */}
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="flex items-center justify-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">سوزان</h1>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-xl shadow-orange-500/25">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-400 fill-orange-400/20" />
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-400 font-medium">نمایشگر محتوای خودتخریب‌شونده</p>
          </div>

          {/* Central Card (Screenshot 3) */}
          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-6 sm:p-7 shadow-2xl space-y-4 backdrop-blur-xl text-right">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                processCodeLookup(shareCode);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block text-right">
                  آیدی محتوا
                </label>
                <input
                  type="text"
                  placeholder="آیدی را وارد یا پیست کن"
                  value={shareCode}
                  onChange={(e) => {
                    setShareCode(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs text-center font-mono focus:border-orange-500 focus:outline-none transition-all shadow-inner tracking-wider"
                  dir="ltr"
                  autoFocus
                />
              </div>

              {/* Paste Button (Screenshot 3) */}
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-800 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
              >
                <span>📋</span>
                <span>پیست</span>
              </button>

              {/* Enter / Submit Button (Screenshot 3) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-orange-500 via-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
              >
                <span>{isLoading ? 'در حال بررسی امنیتی...' : 'ورود ←'}</span>
              </button>

              {/* Error message if any */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 text-right">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}
            </form>

            {/* Flame Notice (Screenshot 3) */}
            <div className="text-center pt-2 text-xs text-zinc-400 flex items-center justify-center gap-1.5">
              <span>🔥</span>
              <span>محتوا پس از نمایش، برای همیشه می‌سوزد</span>
            </div>
          </div>

          {/* QUICK TESTING SCENARIO CARDS (FOR FAST EVALUATION) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 px-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>کدهای نمونه جهت آزمون فوری سناریوهای فاز ۵:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SAMPLE_CODES.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSample(item.code)}
                    className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-right transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                            item.color === 'emerald'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.color === 'amber'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : item.color === 'rose'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-orange-400 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          item.color === 'emerald'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.color === 'amber'
                            ? 'bg-amber-500/10 text-amber-400'
                            : item.color === 'rose'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer links (Matching all screenshots) */}
          <footer className="text-center text-[11px] text-zinc-500 space-x-3 space-x-reverse pt-4">
            <span className="hover:text-zinc-300 cursor-pointer">سیاست حریم خصوصی</span>
            <span>•</span>
            <span className="hover:text-zinc-300 cursor-pointer">شرایط استفاده</span>
            <span>•</span>
            <span className="hover:text-zinc-300 cursor-pointer">گزارش محتوا</span>
          </footer>

          {/* Bottom buffer matching the floating nav bar height */}
          <div className="h-16 sm:h-20 w-full pointer-events-none" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
