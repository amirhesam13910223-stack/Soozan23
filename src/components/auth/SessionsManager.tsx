/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Monitor, Tablet, ShieldAlert, LogOut, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Session, User } from '../../types';
import { db } from '../../services/db';
import { revokeSpecificSession, terminateAllSessions } from '../../services/session';
import { formatPersianRelativeTime } from '../../services/security';

interface Props {
  user: User;
  currentSessionId: string;
  onSessionRevoked: () => void;
  onAllTerminated: () => void;
}

export const SessionsManager: React.FC<Props> = ({
  user,
  currentSessionId,
  onSessionRevoked,
  onAllTerminated,
}) => {
  const [showConfirmAllModal, setShowConfirmAllModal] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const sessions = db.getSessionsByUserId(user.id, {
    userId: user.id,
    sessionId: currentSessionId,
  });

  const handleRevokeSingle = (session: Session) => {
    const success = revokeSpecificSession(session.id, user.id);
    if (success) {
      setSuccessNotice(`نشست دستگاه «${session.deviceName}» با موفقیت پایان یافت.`);
      setTimeout(() => setSuccessNotice(null), 3000);
      onSessionRevoked();
    }
  };

  const handleConfirmTerminateAll = () => {
    terminateAllSessions(user.id);
    setShowConfirmAllModal(false);
    onAllTerminated();
  };

  const getDeviceIcon = (type: Session['deviceType']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-orange-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-amber-400" />;
      default:
        return <Monitor className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 text-zinc-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-zinc-100">نشست‌ها و دستگاه‌های فعال</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            فهرست دستگاه‌هایی که هم‌اکنون به این حساب کاربری دسترسی دارند
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowConfirmAllModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>پایان همه نشست‌ها</span>
        </button>
      </div>

      {successNotice && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* List of Sessions */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
              session.id === currentSessionId
                ? 'bg-zinc-800/60 border-orange-500/30'
                : 'bg-zinc-950/60 border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                {getDeviceIcon(session.deviceType)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-200">
                    {session.deviceName}
                  </span>
                  {session.id === currentSessionId && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      این دستگاه (نشست جاری)
                    </span>
                  )}
                  {session.isTrusted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                      دستگاه مورد اعتماد
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                  <span>نشانی آی‌پی: <span className="font-mono text-zinc-300" dir="ltr">{session.ipAddress}</span></span>
                  <span>•</span>
                  <span>فعالیت: {formatPersianRelativeTime(session.lastActiveAt)}</span>
                </div>
              </div>
            </div>

            {session.id !== currentSessionId && (
              <button
                type="button"
                onClick={() => handleRevokeSingle(session)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 transition-colors shrink-0"
              >
                خروج
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal for Terminate All */}
      {showConfirmAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-rose-500/30 p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <AlertOctagon className="w-7 h-7 shrink-0" />
              <h3 className="text-base font-bold text-zinc-100">تأیید پایان همه نشست‌ها</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              با این اقدام، نشست تمامی دستگاه‌ها (شامل همین دستگاه و حتی دستگاه‌های علامت‌خورده به عنوان مورد اعتماد) <strong className="text-rose-400 font-bold">فوراً و سراسری باطل</strong> خواهد شد.
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              برای ورود مجدد در هر دستگاه، ورود کامل (نام کاربری + رمز عبور + کد تأیید پیامکی) الزامی خواهد بود. آیا مطمئن هستید؟
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowConfirmAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleConfirmTerminateAll}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>بله، پایان سراسری همه نشست‌ها</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
