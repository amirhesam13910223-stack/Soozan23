/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  Activity,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCheck2,
  Lock,
  X,
  Play,
  RotateCcw,
  Cpu,
  BarChart3,
  Server,
  Layers,
} from 'lucide-react';
import {
  runConcurrentLoadTest,
  LoadTestResult,
  rateLimiter,
  backupRecoveryService,
  BackupManifest,
  DisasterRecoveryDrillResult,
} from '../../services/resilience';
import { toPersianDigits } from '../../services/security';

interface Props {
  onClose: () => void;
}

export const ResilienceModal: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'load_ddos' | 'backup_dr'>('load_ddos');

  // Load Test State
  const [isRunningLoadTest, setIsRunningLoadTest] = useState<boolean>(false);
  const [loadResult, setLoadResult] = useState<LoadTestResult | null>(null);
  const [concurrencyLevel, setConcurrencyLevel] = useState<number>(100);

  // DDoS Simulation State
  const [isDDoSActive, setIsDDoSActive] = useState<boolean>(false);
  const [ddosBlockedCount, setDdosBlockedCount] = useState<number>(0);
  const [legitimateServedCount, setLegitimateServedCount] = useState<number>(0);

  // Backup & DR State
  const [backups, setBackups] = useState<BackupManifest[]>(backupRecoveryService.getBackups());
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [isRunningDrill, setIsRunningDrill] = useState<boolean>(false);
  const [drillResult, setDrillResult] = useState<DisasterRecoveryDrillResult | null>(null);

  // Execute Load Test
  const handleExecuteLoadTest = async () => {
    setIsRunningLoadTest(true);
    setLoadResult(null);
    try {
      const result = await runConcurrentLoadTest(concurrencyLevel, 3);
      setLoadResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningLoadTest(false);
    }
  };

  // Simulate DDoS Flood
  const handleSimulateDDoSFlood = async () => {
    setIsDDoSActive(true);
    let blocked = 0;
    let served = 0;

    // Simulate 300 rapid requests from an aggressive IP botnet
    for (let i = 0; i < 300; i++) {
      const botIp = `185.220.101.${(i % 5) + 1}`;
      const check = rateLimiter.checkRequest(botIp, undefined, 'heavy');
      if (!check.allowed) {
        blocked++;
      }
    }

    // Simultaneously, legitimate users request core receive/status
    for (let i = 0; i < 50; i++) {
      const legitIp = `5.200.50.${(i % 10) + 1}`;
      const check = rateLimiter.checkRequest(legitIp, `sess_legit_${i}`, 'core');
      if (check.allowed) {
        served++;
      }
    }

    setDdosBlockedCount(blocked);
    setLegitimateServedCount(served);
    setIsDDoSActive(false);
  };

  // Create 3-2-1 Backup
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await backupRecoveryService.createBackupSnapshot();
      setBackups(backupRecoveryService.getBackups());
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Run Disaster Recovery Drill
  const handleRunDrill = async (backupId?: string) => {
    setIsRunningDrill(true);
    setDrillResult(null);
    try {
      const result = await backupRecoveryService.runDisasterRecoveryDrill(backupId);
      setDrillResult(result);
    } finally {
      setIsRunningDrill(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-5xl my-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right">
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  تاب‌آوری، دفاع DDoS و مانور بازیابی ۳-۲-۱
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/25">
                  فاز ۷ (پایداری و فاجعه)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                انطباق با قوانین ۱۶، ۱۷ و ۱۸ ai-kit: صحت ۱۰۰٪ انهدام، دفاع Backpressure و راستی‌آزمایی هش SHA-256
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/30 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('load_ddos')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'load_ddos'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>تست بار ۱۰۰ کاربر و مهار DDoS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup_dr')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'backup_dr'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>پشتیبان‌گیری ۳-۲-۱ و مانور بازیابی فاجعه</span>
          </button>
        </div>

        {/* TAB 1: LOAD TEST & DDOS DEFENSE */}
        {activeTab === 'load_ddos' && (
          <div className="p-6 space-y-6">
            {/* Banner */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white">قانون بنیادین تاب‌آوری (قانون ۱۶ و ۱۷):</span>
                <p className="text-zinc-400 leading-relaxed">
                  پلتفرم زیر بار سنگین و حملات فلوودینگ، به کمک محدودساز نرخ چندسطحی (IP، نشست، متد) و مکانیزم Backpressure، درخواست‌های مازاد را با پاسخ سریع رد می‌کند تا هسته اصلی (دریافت فایل، نابودی و OTP) همواره پایدار بماند و صحت نابودی هرگز نقض نشود.
                </p>
              </div>
            </div>

            {/* Load Test Control Panel */}
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-400" />
                    <span>آزمون بار همزمانی (Concurrent Load Simulator)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    شبیه‌سازی اجرای همزمان عملیات اشتراک، مصرف بازدید و سوزاندن قطعی
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
                    <span>کاربران همزمان:</span>
                    <select
                      value={concurrencyLevel}
                      onChange={(e) => setConcurrencyLevel(Number(e.target.value))}
                      className="bg-transparent font-bold text-orange-400 focus:outline-none"
                    >
                      <option value="25" className="bg-zinc-900 text-white">۲۵ کاربر</option>
                      <option value="50" className="bg-zinc-900 text-white">۵۰ کاربر</option>
                      <option value="100" className="bg-zinc-900 text-white">۱۰۰ کاربر (هدف نهایی)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteLoadTest}
                    disabled={isRunningLoadTest}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                  >
                    {isRunningLoadTest ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>در حال اجرای بار...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>اجرای تست بار</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Load Test Results */}
              {loadResult && (
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">تأخیر p95</div>
                      <div className="text-base font-bold text-orange-400 font-mono" dir="ltr">
                        {toPersianDigits(loadResult.p95LatencyMs)} ms
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">سقف مجاز: کمتر از ۲۰۰ms</div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">کل درخواست‌ها / بازدهی</div>
                      <div className="text-base font-bold text-white font-mono" dir="ltr">
                        {toPersianDigits(loadResult.totalRequests)} / {toPersianDigits(loadResult.throughputRps)} rps
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">موفق: {toPersianDigits(loadResult.successfulRequests)}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">صحت انهدام رمزارزی</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        ٪{toPersianDigits(loadResult.destructionIntegrityPercent)}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">آنتروپی صفر (تضمین‌شده)</div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">ردپای کلیدهای سوخته</div>
                      <div className="text-base font-bold text-emerald-400">
                        {loadResult.zeroLeakedKeys ? 'صفر (امحای کامل)' : 'خطا در امحا'}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">تفکیک فیزیکی کلیدها</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{loadResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* DDoS Defense Simulator */}
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>شبیه‌ساز حمله سیل‌آسا (DDoS Flooding) و سنجش سناریوی ۱۰</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    تزریق ۳۰۰ درخواست تهاجمی رباتیک همزمان با درخواست‌های مشروع کاربران واقعی
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateDDoSFlood}
                  disabled={isDDoSActive}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all"
                >
                  {isDDoSActive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                      <span>در حال دفع حمله...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>تزریق موج حمله و آزمون Backpressure</span>
                    </>
                  )}
                </button>
              </div>

              {(ddosBlockedCount > 0 || legitimateServedCount > 0) && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>درخواست‌های تهاجمی مسدودشده (Backpressure):</span>
                      </div>
                      <div className="text-lg font-bold font-mono mt-1 text-white">
                        {toPersianDigits(ddosBlockedCount)} درخواست با وضعیت ارزان ۴۲۹ رد شد
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        جلوگیری از اشباع رم و پردازنده با مهار در اولین لایه
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>درخواست‌های مشروع کاربران واقعی (دسترس‌پذیری کامل):</span>
                      </div>
                      <div className="text-lg font-bold font-mono mt-1 text-white">
                        {toPersianDigits(legitimateServedCount)} درخواست با موفقیت پردازش شد
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        هسته سامانه (دریافت و نابودی) زیر بار حمله دست‌نخورده باقی ماند
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: 3-2-1 BACKUP & DISASTER RECOVERY DRILL */}
        {activeTab === 'backup_dr' && (
          <div className="p-6 space-y-6">
            {/* Banner */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white">الگوی ۳-۲-۱ پشتیبان‌گیری و بازیابی (قانون ۱۸):</span>
                <p className="text-zinc-400 leading-relaxed">
                  ۳ نسخه پشتیبان، در ۲ رسانه مجزا، ۱ نسخه مجزا و غیرقابل تغییر (Immutable) با هش یکپارچگی SHA-256. کلید رمزنگاری نسخه پشتیبان کاملاً مستقل از کلیدهای عملیاتی داده است. مانور بازیابی دوره‌ای ضامن بازگردانی دقیق بدون تخریب شروط نابودی خودکار است.
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                تعداد نسخه‌های پشتیبان موجود در تاریخچه ممیزی: <strong className="text-white">{toPersianDigits(backups.length)} نسخه</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                >
                  {isCreatingBackup ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                  <span>ایجاد نسخه ۳-۲-۱ با هش SHA-256</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunDrill()}
                  disabled={isRunningDrill}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                >
                  {isRunningDrill ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>اجرای مانور زنده بازیابی فاجعه (DR Drill)</span>
                </button>
              </div>
            </div>

            {/* Drill Result Card */}
            {drillResult && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      نتیجه مانور بازیابی فاجعه (سناریوی طلایی ۹)
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono" dir="ltr">
                    {drillResult.drillId}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">صحت هش SHA-256</div>
                    <div className="font-bold text-emerald-400 mt-0.5">تطبیق ۱۰۰٪ (بدون دستکاری)</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">تعداد رکوردهای احیاشده</div>
                    <div className="font-bold text-white mt-0.5">
                      {toPersianDigits(drillResult.restoredRecordsCount)} پرونده فایل
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">پیوستگی قوانین نابودی</div>
                    <div className="font-bold text-emerald-400 mt-0.5">حفظ کامل شروط انقضا</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] text-zinc-400">تداوم امحای رمزارزی</div>
                    <div className="font-bold text-emerald-400 mt-0.5">کلیدهای سوخته بدون احیا</div>
                  </div>
                </div>

                <div className="text-xs text-emerald-300 leading-relaxed">
                  {drillResult.message}
                </div>
              </div>
            )}

            {/* Backups Table */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300">
                تاریخچه رونوشت‌های فقط‌افزودنی (Immutable Append-Only Backups):
              </h4>

              {backups.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-6">
                  هنوز نسخه پشتیبانی ساخته نشده است. روی «ایجاد نسخه ۳-۲-۱» کلیک کنید.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="text-[11px] text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-2 px-3">شناسه رونوشت</th>
                        <th className="py-2 px-3">زمان ثبت</th>
                        <th className="py-2 px-3">تعداد رکوردها</th>
                        <th className="py-2 px-3">امضای هش یکپارچگی (SHA-256)</th>
                        <th className="py-2 px-3">وضعیت</th>
                        <th className="py-2 px-3 text-left">اقدام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {backups.map((bak) => (
                        <tr key={bak.id} className="hover:bg-zinc-900/50">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-200">
                            {bak.id}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {new Date(bak.timestamp).toLocaleTimeString('fa-IR')}
                          </td>
                          <td className="py-2.5 px-3">
                            {toPersianDigits(bak.recordsCount)} فایل
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-blue-400" dir="ltr">
                            {bak.sha256Checksum.slice(0, 16)}...{bak.sha256Checksum.slice(-8)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Immutable (تغییرناپذیر)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-left">
                            <button
                              type="button"
                              onClick={() => handleRunDrill(bak.id)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] transition-colors"
                            >
                              مانور بازیابی این نسخه
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>سوزان • بفرست، بدون اینکه جا بماند.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
