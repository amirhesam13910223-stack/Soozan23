/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Menu } from 'lucide-react';
import { User } from '../../types';

interface Props {
  user: User | null;
  onOpenMenu: () => void;
}

export const Header: React.FC<Props> = ({ user, onOpenMenu }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/85 border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Hamburger Menu Button (Matches all screenshots) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 flex items-center justify-center text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95"
          title="منوی اصلی سامانه"
          aria-label="باز کردن منوی اصلی"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand (Matches all screenshots: سوزان 🔥) */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-base sm:text-lg font-black tracking-tight text-white">سوزان</div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
