/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  Trash2,
  History,
  AlertCircle,
  CheckCircle2,
  Flame,
  Eye,
  Clock,
  Search,
  Lock,
  ArrowLeft,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { db } from '../../services/db';
import { SoozanFileRecord } from '../../types';
import { toPersianDigits, formatPersianRelativeTime } from '../../services/security';
import { FileEventsModal } from '../dashboard/FileEventsModal';

export const ManageCodeView: React.FC = () => {
  const [inputCode, setInputCode] = useState<string>('');
  const [searchedFile, setSearchedFile] = useState<SoozanFileRecord | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [burnNotice, setBurnNotice] = useState<string | null>(null);
  const [showEventsModal, setShowEventsModal] = useState<boolean>(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setBurnNotice(null);
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;

    setHasSearched(true);
    const file = db.getFileByManageCode(clean);
    setSearchedFile(file);
  };

  const handleImmediateBurn = () => {
    if (!searchedFile) return;
    const startTime = performance.now();
    const success = db.burnFile(searchedFile.id, { isSystemInternal: true });
    const elapsed = Math.round(performance.now() - startTime);

    if (success) {
      setBurnNotice(`فایل در مدت ${toPersianDigits(elapsed)} میلی‌ثانیه برای همیشه سوزانده و کلید رمزنگاری آن امحا گردید.`);
      const updated = db.getFileByManageCode(searchedFile.manageCode);
      setSearchedFile(updated);
    }
  };

  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-6 sm:py-8 pb-4 space-y-6 text-right overflow-x-hidden">
      {!searchedFile ? (
        /* Matching Screenshot 3: ورود پنل مدیریت */
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Glowing Lock Icon in Circle (Screenshot 3) */}
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-xl shadow-blue-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">ورود پنل مدیریت</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              کد مدیریت اختصاصی فایل خود را وارد کنید
              <br />
              <span className="text-[11px] text-zinc-500">
                در مرحله بعد، یک کد تأیید به شماره مالک ارسال می‌شود
              </span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLookup} className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-300 font-bold block text-center">
                کد مدیریت
              </label>
              <input
                type="text"
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setHasSearched(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs font-mono font-bold tracking-widest text-center focus:border-blue-500 focus:outline-none transition-all dir-ltr"
                dir="ltr"
              />
            </div>

            {hasSearched && !searchedFile && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>کد واردشده در سامانه یافت نشد یا سوزانده شده است.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>ادامه</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>ارتباط امن • تأیید دومرحله‌ای اجباری</span>
          </div>
        </div>
      ) : (
        /* File Management Control View */
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">مدیریت فایل</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchedFile(null);
                setInputCode('');
                setHasSearched(false);
              }}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <span>جستجوی کد دیگر</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {burnNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{burnNotice}</span>
            </div>
          )}

          {/* Details */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate font-mono" dir="ltr">
                  {searchedFile.fileName}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  اندازه: {formatStorage(searchedFile.fileSize)} • ثبت: {formatPersianRelativeTime(searchedFile.createdAt)}
                </div>
              </div>

              <div>
                {searchedFile.status === 'issued' ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    فعال
                  </span>
                ) : searchedFile.status === 'burned' ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    سوخته
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {searchedFile.status}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-400">بازدیدها:</div>
                <div className="font-bold text-zinc-200 mt-0.5">
                  {toPersianDigits(searchedFile.policy.consumedViews || 0)} از {toPersianDigits(searchedFile.policy.maxViews || 1)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-400">مهلت انقضا:</div>
                <div className="font-bold text-zinc-200 mt-0.5">
                  {searchedFile.policy.expiresAt
                    ? new Date(searchedFile.policy.expiresAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
                    : 'بدون سقف'}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowEventsModal(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-orange-400" />
              <span>مشاهده تاریخچه رویدادها</span>
            </button>

            {searchedFile.status !== 'burned' && (
              <button
                type="button"
                onClick={handleImmediateBurn}
                className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>سوزاندن فوری محتوا</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Events Modal */}
      {showEventsModal && searchedFile && (
        <FileEventsModal
          file={searchedFile}
          currentUserId={searchedFile.ownerUserId}
          onClose={() => setShowEventsModal(false)}
          onFileBurned={() => {
            const updated = db.getFileByManageCode(searchedFile.manageCode);
            setSearchedFile(updated);
          }}
        />
      )}

      {/* Footer links */}
      <footer className="text-center text-[11px] text-zinc-500 space-x-3 space-x-reverse pt-2">
        <span className="hover:text-zinc-300 cursor-pointer">سیاست حریم خصوصی</span>
        <span>•</span>
        <span className="hover:text-zinc-300 cursor-pointer">شرایط استفاده</span>
        <span>•</span>
        <span className="hover:text-zinc-300 cursor-pointer">گزارش محتوا</span>
      </footer>

      {/* Bottom buffer matching the floating nav bar height */}
      <div className="h-16 sm:h-20 w-full pointer-events-none" aria-hidden="true" />
    </div>
  );
};
