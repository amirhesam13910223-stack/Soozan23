/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  LayoutDashboard,
  PlusCircle,
  User as UserIcon,
  Settings,
  Shield,
  Download,
  ShieldCheck,
  Zap,
  HelpCircle,
  Crown,
  Laptop,
  LogOut,
  Flame,
  ChevronLeft,
} from 'lucide-react';
import { User } from '../../types';
import { NavTab } from './FloatingNavBar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activeTab: NavTab | 'profile' | 'settings';
  onNavigate: (tab: NavTab | 'profile' | 'settings') => void;
  onOpenWizard: () => void;
  onOpenGuardian: () => void;
  onOpenAudit: () => void;
  onOpenResilience: () => void;
  onOpenHelp: () => void;
  onOpenPricing: () => void;
  onOpenSessions: () => void;
  onLogout: () => void;
}

export const SideDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  activeTab,
  onNavigate,
  onOpenWizard,
  onOpenGuardian,
  onOpenAudit,
  onOpenResilience,
  onOpenHelp,
  onOpenPricing,
  onOpenSessions,
  onLogout,
}) => {
  if (!isOpen) return null;

  const handleNavClick = (tab: NavTab | 'profile' | 'settings') => {
    onNavigate(tab);
    onClose();
  };

  const handleActionClick = (action: () => void) => {
    action();
    onClose();
  };

  const userInitial = user?.displayName ? user.displayName.trim().charAt(0).toUpperCase() : 'س';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container (Docked strictly to the right edge and sliding from right) */}
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-xs sm:max-w-sm h-full bg-zinc-950 border-l border-zinc-800/80 shadow-2xl flex flex-col z-50 text-right animate-in slide-in-from-right duration-250">
        {/* Header / User Profile Badge */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {user ? (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20 shrink-0">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center font-bold text-lg text-white">
                  {userInitial}
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 shrink-0">
                <Flame className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {user ? user.displayName : 'مهمان سامانه سوزان'}
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="truncate">
                  {user ? 'حساب سازنده' : 'بدون نیاز به ثبت‌نام'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-xs font-medium">
          {/* Main Views */}
          <div className="text-[11px] font-bold text-zinc-400 px-3 py-1">ناوبری اصلی</div>

          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
              activeTab === 'home'
                ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 text-orange-400" />
              <span>داشبورد محتوا</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => handleActionClick(onOpenWizard)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold transition-all"
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>ساخت فایل جدید (ویزارد)</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">۶ مرحله</span>
          </button>

          {user && (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
                  activeTab === 'profile'
                    ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span>پروفایل کاربری</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
                  activeTab === 'settings'
                    ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>تنظیمات حساب</span>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleNavClick('manage_code')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
              activeTab === 'manage_code'
                ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>ورود با کد مدیریت</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('receive_file')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
              activeTab === 'receive_file'
                ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30'
                : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>دریافت فایل (کد ۶۴ کاراکتری)</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <div className="h-px bg-zinc-800/80 my-3" />

          {/* Security & System Features */}
          <div className="text-[11px] font-bold text-zinc-400 px-3 py-1">امنیت و ابزارها</div>

          <button
            type="button"
            onClick={() => handleActionClick(onOpenGuardian)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>دیده‌بان و سلامت سامانه</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => handleActionClick(onOpenResilience)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-rose-400" />
              <span>تاب‌آوری، DDoS و بک‌آپ ۳-۲-۱</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => handleActionClick(onOpenAudit)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-orange-400" />
              <span>سنجش خطوط قرمز امنیتی</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => handleActionClick(onOpenHelp)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>مرکز راهنما و سوالات متداول</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => handleActionClick(onOpenPricing)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>تعرفه‌ها و طرح‌های امنیتی</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">رایگان و Pro</span>
          </button>

          {user && (
            <button
              type="button"
              onClick={() => handleActionClick(onOpenSessions)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span>نشست‌ها و دستگاه‌های فعال</span>
              </div>
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
            </button>
          )}

          {user && (
            <>
              <div className="h-px bg-zinc-800/80 my-3" />
              <button
                type="button"
                onClick={() => handleActionClick(onLogout)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب</span>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-800/80 text-[11px] text-zinc-400 text-center">
          سوزان • بفرست، بدون اینکه جا بماند.
        </div>
      </aside>
    </div>
  );
};
