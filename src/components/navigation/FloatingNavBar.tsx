/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, KeyRound, Download } from 'lucide-react';

export type NavTab = 'home' | 'manage_code' | 'receive_file' | 'profile' | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenWizard?: () => void;
  isAppMode?: boolean;
}

export const FloatingNavBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
}) => {
  const isHomeActive = activeTab === 'home';
  const isReceiveActive = activeTab === 'receive_file';
  const isManageActive = activeTab === 'manage_code';

  return (
    <aside
      className="docked-bottom-bar bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/80 shadow-[0_-10px_35px_rgba(0,0,0,0.85)]"
      role="navigation"
      aria-label="ناوبری اصلی سوزان"
    >
      <div className="max-w-lg mx-auto px-4 h-16 sm:h-18 flex items-center justify-between relative">
        {/* راست (در چیدمان راست‌به‌چپ): دریافت فایل */}
        <button
          type="button"
          onClick={() => onSelectTab('receive_file')}
          aria-current={isReceiveActive ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 transition-all group focus:outline-none select-none ${
            isReceiveActive ? 'text-orange-400 font-black' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isReceiveActive
                ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 shadow-sm shadow-orange-500/10'
                : 'text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-900/60'
            }`}
          >
            <Download className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] sm:text-xs tracking-tight leading-none font-bold">
            دریافت فایل
          </span>
        </button>

        {/* مرکز ویژه و مرتفع: سازنده (داشبورد) */}
        <div className="relative -top-4 sm:-top-5 flex flex-col items-center justify-center px-3 z-10">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            aria-current={isHomeActive ? 'page' : undefined}
            title="میز کار و پیشخوان سازنده"
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white transition-all transform active:scale-95 border-2 border-zinc-950 ring-4 ring-zinc-950 shadow-2xl focus:outline-none ${
              isHomeActive
                ? 'bg-gradient-to-tr from-orange-500 via-orange-500 to-amber-500 shadow-orange-500/40 ring-orange-500/20 scale-105'
                : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border-zinc-800/90 shadow-black/80'
            }`}
          >
            <Home className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.35] drop-shadow-md" />
          </button>
          <span
            className={`text-[11px] sm:text-xs mt-1.5 font-black tracking-tight leading-none transition-colors ${
              isHomeActive ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            سازنده
          </span>
        </div>

        {/* چپ (در چیدمان راست‌به‌چپ): پنل مدیریت */}
        <button
          type="button"
          onClick={() => onSelectTab('manage_code')}
          aria-current={isManageActive ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 transition-all group focus:outline-none select-none ${
            isManageActive ? 'text-blue-400 font-black' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isManageActive
                ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30 shadow-sm shadow-blue-500/10'
                : 'text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-900/60'
            }`}
          >
            <KeyRound className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] sm:text-xs tracking-tight leading-none font-bold">
            پنل مدیریت
          </span>
        </button>
      </div>
    </aside>
  );
};

