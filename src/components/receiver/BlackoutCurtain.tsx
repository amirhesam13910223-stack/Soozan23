/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Eye, Lock } from 'lucide-react';

interface Props {
  onResume: () => void;
}

export const BlackoutCurtain: React.FC<Props> = ({ onResume }) => {
  return (
    <div
      onClick={onResume}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer animate-fade-in"
    >
      <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4 shadow-2xl shadow-orange-500/10">
        <ShieldAlert className="w-8 h-8 animate-pulse" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-semibold mb-3">
        <Lock className="w-3.5 h-3.5" />
        <span>پرده محافظ محرمانگی سوزان</span>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">صفحه به دلیل تغییر پنجره موقتاً پوشانده شد</h3>

      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed mb-6">
        جهت محافظت در برابر ابزارهای اسکرین‌شات و ضبط غیرمجاز در پس‌زمینه، محتوا به صورت خودکار پوشانده شد. برای ادامه مطالعه، روی صفحه کلیک کنید.
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onResume();
        }}
        className="px-6 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-100 flex items-center gap-2 transition-all shadow-lg hover:border-orange-500/50"
      >
        <Eye className="w-4 h-4 text-orange-400" />
        <span>ادامه مشاهده امن</span>
      </button>
    </div>
  );
};
