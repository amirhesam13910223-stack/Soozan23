/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  User as UserIcon,
  Phone,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Eye,
  LayoutDashboard,
  KeyRound,
  Settings,
  LogOut,
  ChevronLeft,
  Flame,
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';
import { toPersianDigits } from '../../services/security';
import { NavTab } from '../navigation/FloatingNavBar';

interface Props {
  user: User;
  onNavigate: (tab: NavTab | 'profile' | 'settings') => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<Props> = ({ user, onNavigate, onLogout }) => {
  const userInitial = user.displayName ? user.displayName.trim().charAt(0).toUpperCase() : 'س';

  // Load user files statistics
  const userFiles = db.getFilesByOwner(user.id, { userId: user.id });
  const activeFilesCount = userFiles.filter((f) => f.status === 'issued' || f.status === 'consuming').length;
  const totalViewsCount = userFiles.reduce((acc, f) => acc + (f.policy.consumedViews || 0), 0);

  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-8 pb-32 space-y-6 text-right">
      {/* Profile Card (Matching Screenshot 1) */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl text-center space-y-4 relative overflow-hidden backdrop-blur-xl">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 p-1 shadow-xl shadow-orange-500/25">
          <div className="w-full h-full bg-zinc-950 rounded-[20px] flex items-center justify-center font-black text-2xl text-white">
            {userInitial}
          </div>
        </div>

        {/* Name & Username */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white tracking-tight">{user.displayName}</h2>
          <div className="text-xs text-zinc-400 font-mono" dir="ltr">
            @{user.username}
          </div>
        </div>

        {/* Member Details */}
        <div className="text-xs text-zinc-400 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>عضو از {toPersianDigits(formattedJoinDate)}</span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <span className="font-mono text-zinc-300" dir="ltr">
              {toPersianDigits(user.mobile)}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300 font-medium">{user.displayName}</span>
          </div>
        </div>

        {/* Badges Row */}
        <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
          {/* Active Files Badge */}
          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>{toPersianDigits(activeFilesCount)} فایل فعال</span>
          </span>

          {/* Views Badge */}
          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/80 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>{toPersianDigits(totalViewsCount)} مشاهده کل</span>
          </span>

          {/* 2FA Badge */}
          <span
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
              user.totpEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
            }`}
          >
            {user.totpEnabled ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>دومرحله‌ای فعال</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>دومرحله‌ای غیرفعال</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* "My Account" Actions Box (Matching Screenshot 1) */}
      <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-3">
        <div className="text-xs font-bold text-zinc-400 pb-2 border-b border-zinc-800/80 flex items-center gap-2">
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>حساب من</span>
        </div>

        <div className="space-y-2">
          {/* Dashboard Link */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-full p-3.5 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">📊</span>
              <span>داشبورد محتوا</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Management Code Link */}
          <button
            type="button"
            onClick={() => onNavigate('manage_code')}
            className="w-full p-3.5 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🛡️</span>
              <span>پنل مدیریت با کد اختصاصی</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Account Settings Link */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="w-full p-3.5 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚙️</span>
              <span>تنظیمات و امنیت حساب</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full p-3.5 rounded-2xl bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/30 text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🚪</span>
              <span>خروج از حساب</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-rose-400 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer links (Matching Screenshot 1) */}
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
