/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { toPersianDigits } from '../../services/security';

interface Props {
  customText?: string;
  verificationId?: string;
}

export const WatermarkOverlay: React.FC<Props> = ({ customText, verificationId }) => {
  const stamp = useMemo(() => {
    const d = new Date();
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    const dateStr = d.toLocaleDateString('fa-IR');
    return `${toPersianDigits(dateStr)} • ${toPersianDigits(timeStr)}`;
  }, []);

  const tag = verificationId || 'SZ-VIEW-7193';

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-wrap items-center justify-around gap-12 p-6 opacity-[0.14] text-zinc-100"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {Array.from({ length: 16 }).map((_, index) => (
        <div
          key={index}
          className="transform -rotate-25 text-center flex flex-col items-center justify-center font-mono text-[11px] leading-tight select-none"
        >
          <span className="font-bold text-orange-400">سوزان • محتوای خودنابودشونده</span>
          {customText && <span className="text-zinc-200 font-sans text-xs mt-0.5">{customText}</span>}
          <span className="text-[10px] text-zinc-400 tracking-wider mt-0.5" dir="ltr">
            {tag}
          </span>
          <span className="text-[9px] text-zinc-500 mt-0.5">{stamp}</span>
        </div>
      ))}
    </div>
  );
};
