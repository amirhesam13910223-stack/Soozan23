/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, History, Flame, ShieldCheck, Eye, Lock, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { SoozanFileRecord, AuditLog } from '../../types';
import { db } from '../../services/db';
import { toPersianDigits, formatPersianRelativeTime } from '../../services/security';

interface Props {
  file: SoozanFileRecord;
  currentUserId: string;
  onClose: () => void;
  onFileBurned: () => void;
}

export const FileEventsModal: React.FC<Props> = ({
  file,
  currentUserId,
  onClose,
  onFileBurned,
}) => {
  const events = db.getFileEvents(file.id, { userId: currentUserId });

  const handleImmediateBurn = () => {
    const success = db.burnFile(file.id, { userId: currentUserId });
    if (success) {
      onFileBurned();
      onClose();
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'FILE_SEALED_AND_ISSUED':
        return {
          icon: <Lock className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'صدور و مهر رمزارزی',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      case 'FILE_VIEW_CONSUMED':
        return {
          icon: <Eye className="w-3.5 h-3.5 text-blue-400" />,
          label: 'مشاهده توسط گیرنده',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        };
      case 'FILE_CRYPTOGRAPHICALLY_BURNED':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
          label: 'امحای رمزارزی و سوختن',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-zinc-400" />,
          label: action,
          color: 'text-zinc-400 bg-zinc-800 border-zinc-700',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">لاگ ممیزی و رویدادهای فایل</h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs font-mono mt-0.5" dir="ltr">
                {file.fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manage Code Bar */}
        <div className="my-4 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400">کد مدیریت اختصاصی:</span>
          <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-500/30" dir="ltr">
            {file.manageCode}
          </span>
        </div>

        {/* Events Timeline */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1 my-2">
          {events.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              هنوز رویدادی برای این فایل ثبت نشده است.
            </div>
          ) : (
            events.map((evt) => {
              const badge = getActionBadge(evt.action);
              return (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {formatPersianRelativeTime(evt.timestamp)}
                    </span>
                  </div>

                  {Boolean(evt.details?.reason) && (
                    <div className="text-[11px] text-zinc-300 leading-relaxed pr-1">
                      علت: {String(evt.details?.reason)}
                    </div>
                  )}

                  {Boolean(evt.details?.viewNumber) && (
                    <div className="text-[11px] text-zinc-300 pr-1">
                      بازدید شماره {toPersianDigits(Number(evt.details?.viewNumber))} از سقف {toPersianDigits(Number(evt.details?.maxViews || 1))}
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 font-mono pr-1" dir="ltr">
                    IP: {evt.ipAddress} • {new Date(evt.timestamp).toLocaleTimeString('fa-IR')}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          {file.status !== 'burned' && file.status !== 'expired' ? (
            <button
              type="button"
              onClick={handleImmediateBurn}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>سوزاندن فوری همین حالا</span>
            </button>
          ) : (
            <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>این محتوا قبلاً سوزانده شده و غیرقابل‌دسترسی است.</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
