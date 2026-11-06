/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Flame,
  Clock,
  Eye,
  Search,
  Filter,
  Trash2,
  History,
  Copy,
  Check,
  Plus,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  Sparkles,
  Lock,
  ChevronLeft,
  ChevronDown,
  X,
  Image as ImageIcon,
  Video,
  Music,
  Code,
  Archive,
  Layers
} from 'lucide-react';
import { User, Session, SoozanFileRecord, AllowedFileCategory } from '../../types';
import { db } from '../../services/db';
import { toPersianDigits, formatPersianRelativeTime } from '../../services/security';
import { FileEventsModal } from './FileEventsModal';

interface Props {
  user: User;
  currentSession: Session;
  onOpenWizard: () => void;
  onOpenScanner: () => void;
  onOpenAudit: () => void;
}

type StatusFilter = 'all' | 'issued' | 'consuming' | 'burned' | 'expired' | 'quarantined';
type CategoryFilter = 'all' | AllowedFileCategory;

export const SenderDashboard: React.FC<Props> = ({
  user,
  currentSession,
  onOpenWizard,
  onOpenScanner,
  onOpenAudit,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Modal for audit events
  const [selectedFileForEvents, setSelectedFileForEvents] = useState<SoozanFileRecord | null>(null);

  // Fast confirmation for immediate burn
  const [burnConfirmFileId, setBurnConfirmFileId] = useState<string | null>(null);

  // Load files with RLS
  const allFiles = db.getFilesByOwner(user.id, { userId: user.id });

  const handleCopyManageCode = (file: SoozanFileRecord) => {
    navigator.clipboard.writeText(file.manageCode);
    setCopiedCodeId(file.id);
    setTimeout(() => setCopiedCodeId(null), 3000);
  };

  const handleImmediateBurn = (fileId: string) => {
    db.burnFile(fileId, { userId: user.id });
    setBurnConfirmFileId(null);
  };

  // OVERALL STATISTICS CALCULATION
  const activeCount = allFiles.filter((f) => f.status === 'issued' || f.status === 'consuming').length;
  const burnedCount = allFiles.filter((f) => f.status === 'burned' || f.status === 'expired').length;
  const totalViewsConsumed = allFiles.reduce((acc, f) => acc + (f.policy.consumedViews || 0), 0);
  const totalBytes = allFiles.reduce((acc, f) => acc + f.fileSize, 0);

  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  };

  // FILTERED FILES
  const filteredFiles = allFiles.filter((file) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = file.fileName.toLowerCase().includes(q);
      const matchNote = file.senderNote?.toLowerCase().includes(q);
      const matchCode = file.manageCode.toLowerCase().includes(q);
      if (!matchName && !matchNote && !matchCode) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'issued' && file.status !== 'issued') return false;
      if (statusFilter === 'consuming' && file.status !== 'consuming') return false;
      if (statusFilter === 'burned' && file.status !== 'burned') return false;
      if (statusFilter === 'expired' && file.status !== 'expired') return false;
      if (statusFilter === 'quarantined' && file.status !== 'quarantined') return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && file.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  const getCategoryIcon = (cat: AllowedFileCategory) => {
    switch (cat) {
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'video': return <Video className="w-5 h-5 text-blue-400" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-400" />;
      case 'document': return <FileText className="w-5 h-5 text-amber-400" />;
      case 'code': return <Code className="w-5 h-5 text-cyan-400" />;
      case 'archive': return <Archive className="w-5 h-5 text-orange-400" />;
    }
  };

  const getStatusBadge = (status: SoozanFileRecord['status']) => {
    switch (status) {
      case 'issued':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>فعال</span>
          </span>
        );
      case 'consuming':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>در حال نمایش</span>
          </span>
        );
      case 'burned':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>سوخته و نابودشده</span>
          </span>
        );
      case 'expired':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>منقضی‌شده</span>
          </span>
        );
      case 'quarantined':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>قرنطینه</span>
          </span>
        );
      default:
        return null;
    }
  };

  const quarantinedCount = allFiles.filter((f) => f.status === 'quarantined').length;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-4 space-y-5 sm:space-y-6 text-right overflow-hidden">
      {/* Page Title & Subtitle (Matching Screenshot 4) */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>داشبورد</span>
          <span className="text-lg">📊</span>
        </h1>
        <p className="text-xs text-zinc-400">مدیریت محتوای خودتخریب‌شونده تو</p>
      </div>

      {/* 4 STATS CARDS (Matching Screenshot 4: کل فایل‌ها, فعال, غیرفعال, متوقف شده) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full max-w-full min-w-0">
        {/* Total Files */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs gap-1">
            <span className="truncate">کل فایل‌ها</span>
            <span className="text-sm shrink-0">📁</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white truncate">
            {toPersianDigits(allFiles.length)}
          </div>
          <div className="text-[10px] text-zinc-500 truncate">مجموع ایجادشده</div>
        </div>

        {/* Active Files */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs gap-1">
            <span className="truncate">فعال</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 truncate">
            {toPersianDigits(activeCount)}
          </div>
          <div className="text-[10px] text-emerald-400/80 truncate">آماده دریافت یا مشاهده</div>
        </div>

        {/* Inactive / Burned Files */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs gap-1">
            <span className="truncate">غیرفعال / سوخته</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white truncate">
            {toPersianDigits(burnedCount)}
          </div>
          <div className="text-[10px] text-zinc-500 truncate">امحای قطعی با آنتروپی صفر</div>
        </div>

        {/* Quarantined / Paused Files */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs gap-1">
            <span className="truncate">متوقف شده (موقت)</span>
            <span className="text-sm shrink-0">🔒</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white truncate">
            {toPersianDigits(quarantinedCount)}
          </div>
          <div className="text-[10px] text-zinc-500 truncate">قرنطینه بدافزار یا توقف</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="w-full max-w-full min-w-0 p-3.5 sm:p-4 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-xl backdrop-blur-md overflow-hidden">
        {/* Row 1: Search Input + Category Dropdown Side-by-Side */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="جستجو بر اساس نام فایل، یادداشت خصوصی یا کد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pr-10 pl-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs focus:border-orange-500 focus:outline-none transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 p-0.5 rounded-lg transition-colors"
                title="پاک کردن جستجو"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Format Filter Dropdown */}
          <div className="relative shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="w-full sm:w-auto appearance-none py-2.5 pr-8 pl-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold focus:border-orange-500 focus:outline-none transition-all cursor-pointer shadow-inner"
            >
              <option value="all">همه فرمت‌ها</option>
              <option value="document">اسناد و متون</option>
              <option value="image">تصاویر</option>
              <option value="video">ویدیوها</option>
              <option value="audio">فایل‌های صوتی</option>
              <option value="code">کد برنامه</option>
              <option value="archive">فشرده (Zip)</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-orange-400 absolute right-3 top-3 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Status Pills in a Smooth Horizontal Scrollable Bar (No Wrapping Clutter) */}
        <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
          {[
            { id: 'all' as StatusFilter, label: 'همه وضعیت‌ها', count: allFiles.length, dot: null },
            { id: 'issued' as StatusFilter, label: 'فعال', count: activeCount, dot: 'bg-emerald-400' },
            { id: 'consuming' as StatusFilter, label: 'در حال نمایش', count: allFiles.filter(f => f.status === 'consuming').length, dot: 'bg-amber-400' },
            { id: 'burned' as StatusFilter, label: 'سوخته', count: burnedCount, dot: 'bg-rose-400' },
            { id: 'expired' as StatusFilter, label: 'منقضی', count: allFiles.filter(f => f.status === 'expired').length, dot: 'bg-zinc-500' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                statusFilter === st.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 font-bold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {st.dot && <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shrink-0`} />}
              <span>{st.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  statusFilter === st.id ? 'bg-black/25 text-white font-bold' : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {toPersianDigits(st.count)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* FILES LIST & CARDS */}
      <div className="space-y-3">
        {filteredFiles.length === 0 ? (
          /* EMPTY STATE (Section 11) */
          <div className="p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <Layers className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-200">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'هیچ فایلی با فیلترهای انتخابی یافت نشد'
                  : 'هنوز هیچ فایلی به اشتراک نگذاشته‌اید'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'لطفاً عبارت جستجو را پاک کنید یا فیلتر دیگری برگزینید.'
                  : 'اولین محتوای خود را با تعیین قوانین سوختن هوشمند ارسال کنید. بفرست، بدون اینکه جا بماند.'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'all' && (
              <button
                type="button"
                onClick={onOpenWizard}
                className="px-6 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/25 hover:from-orange-600 hover:to-amber-700 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>اولین اشتراک‌گذاری فایل (ویزارد)</span>
              </button>
            )}
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isBurnedOrExpired = file.status === 'burned' || file.status === 'expired';
            const viewsConsumed = file.policy.consumedViews || 0;
            const maxViews = file.policy.maxViews || 1;
            const viewPercent = Math.min(100, Math.round((viewsConsumed / maxViews) * 100));

            return (
              <div
                key={file.id}
                className={`p-5 rounded-3xl border transition-all ${
                  isBurnedOrExpired
                    ? 'bg-zinc-950/70 border-zinc-900 opacity-80'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-lg'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Icon, Name, Category & Note */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(file.category)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100 font-mono truncate max-w-[190px] sm:max-w-xs block" dir="ltr">
                          {file.fileName}
                        </span>
                        {getStatusBadge(file.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                        <span>اندازه: {formatStorage(file.fileSize)}</span>
                        <span>•</span>
                        <span>تاریخ صدور: {formatPersianRelativeTime(file.createdAt)}</span>
                        {file.policy.expiresAt && !isBurnedOrExpired && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">
                              انقضا: {new Date(file.policy.expiresAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Sender Note */}
                      {file.senderNote && (
                        <div className="text-[11px] text-zinc-300 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800/80 inline-block mt-1 truncate max-w-full">
                          یادداشت خصوصی: <span className="text-zinc-200 font-medium">{file.senderNote}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Views Progress & Manage Code & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                    {/* View Progress */}
                    {file.policy.maxViews && (
                      <div className="min-w-[130px] space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-400">
                          <span>مصرف بازدید:</span>
                          <span className="font-mono text-zinc-200">
                            {toPersianDigits(viewsConsumed)} / {toPersianDigits(maxViews)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-950 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isBurnedOrExpired
                                ? 'bg-rose-500'
                                : viewsConsumed >= maxViews - 1
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${viewPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Manage Code Pill with Copy */}
                    <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                      <div className="text-right">
                        <div className="text-[9px] text-zinc-500">کد مدیریت</div>
                        <div className="font-mono text-xs font-bold text-amber-300" dir="ltr">
                          {file.manageCode}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyManageCode(file)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="کپی کد مدیریت"
                      >
                        {copiedCodeId === file.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFileForEvents(file)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                        title="مشاهده رویدادها و لاگ ممیزی"
                      >
                        <History className="w-4 h-4 text-orange-400" />
                      </button>

                      {!isBurnedOrExpired && (
                        <button
                          type="button"
                          onClick={() => setBurnConfirmFileId(file.id)}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="سوزاندن آنی محتوا و امحای رمزارزی کلید"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>سوزاندن فوری</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* End-of-Dashboard Start Share Button */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={onOpenWizard}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 via-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-98"
        >
          <Plus className="w-5 h-5 stroke-[2.75]" />
          <span>شروع اشتراک‌گذاری فایل جدید</span>
        </button>
      </div>

      {/* Immediate Burn Confirmation Dialog */}
      {burnConfirmFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-rose-500/40 p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-rose-400">
              <Flame className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">سوزاندن آنی این فایل؟</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              با این اقدام، کلید رمزنگاری ۲۵۶ بیتی این فایل فوراً در کمتر از ۱۰۰ میلی‌ثانیه امحا (Shred) شده و دسترسی تمام افراد بلافاصله و برای همیشه قطع می‌شود.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setBurnConfirmFileId(null)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleImmediateBurn(burnConfirmFileId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>بله، سوزاندن قطعی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events Timeline Modal */}
      {selectedFileForEvents && (
        <FileEventsModal
          file={selectedFileForEvents}
          currentUserId={user.id}
          onClose={() => setSelectedFileForEvents(null)}
          onFileBurned={() => {
            // refresh
          }}
        />
      )}

      {/* Footer links (Matching all screenshots) */}
      <footer className="text-center text-[11px] text-zinc-500 space-x-3 space-x-reverse pt-4">
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
