/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, FileCheck2, AlertCircle, RotateCw, CheckCircle2, XCircle, FileText, Image as ImageIcon, Video, Music, Archive, Code } from 'lucide-react';
import { WizardState } from '../../types/wizard';
import { AllowedFileCategory } from '../../types';
import { scanFileForMalware } from '../../services/scanner';
import { toPersianDigits } from '../../services/security';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

const CATEGORY_LIMITS_MB: Record<AllowedFileCategory, number> = {
  image: 50,
  video: 500,
  audio: 100,
  document: 50,
  code: 20,
  archive: 200,
};

export const Step1File: React.FC<Props> = ({ state, updateState, onNext }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const determineCategory = (ext: string, mime: string): AllowedFileCategory | null => {
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || mime.startsWith('image/')) return 'image';
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext) || mime.startsWith('video/')) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mime.startsWith('audio/')) return 'audio';
    if (['pdf', 'txt', 'md', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
    if (['py', 'js', 'ts', 'html', 'css', 'json', 'yml', 'xml', 'c', 'cpp', 'java', 'go', 'rs', 'sql', 'sh'].includes(ext)) return 'code';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return null;
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // 1. Check forbidden extensions
    const forbidden = ['exe', 'dll', 'apk', 'msi', 'bat', 'cmd', 'vbs', 'com', 'scr', 'sh'];
    if (forbidden.includes(ext) && ext !== 'sh') {
      setErrorMessage(`بارگذاری فایل‌های اجرایی و باینری (${ext}.) به دلایل امنیتی مطلقاً ممنوع است.`);
      return;
    }

    const category = determineCategory(ext, file.type);
    if (!category) {
      setErrorMessage('فرمت فایل انتخاب‌شده در فهرست انواع مجاز (تصویر، ویدیو، صدا، سند، کد یا آرشیو) نیست.');
      return;
    }

    // 2. Check size limits
    const maxMB = CATEGORY_LIMITS_MB[category];
    if (file.size > maxMB * 1024 * 1024) {
      setErrorMessage(`حجم این فایل بیشتر از سقف مجاز برای فایل‌های ${getCategoryLabel(category)} (${toPersianDigits(maxMB)} مگابایت) است.`);
      return;
    }

    // Generate preview URL if image
    let previewUrl: string | undefined;
    if (category === 'image') {
      previewUrl = URL.createObjectURL(file);
    }

    // Read bytes for encryption
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    updateState({
      file,
      fileBytes: bytes,
      fileName: file.name,
      fileSize: file.size,
      fileCategory: category,
      filePreviewUrl: previewUrl,
      isScanning: true,
      scanReport: null,
    });

    // Run 7-stage malware scanner
    try {
      const report = await scanFileForMalware(file);
      updateState({
        scanReport: report,
        isScanning: false,
      });
    } catch {
      updateState({ isScanning: false });
      setErrorMessage('خطایی در اجرای خط لوله اسکن بدافزار رخ داد.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  };

  const getCategoryLabel = (cat: AllowedFileCategory) => {
    switch (cat) {
      case 'image': return 'تصویر';
      case 'video': return 'ویدیو';
      case 'audio': return 'فایل صوتی';
      case 'document': return 'سند متنی یا اداری';
      case 'code': return 'کد یا متن خام';
      case 'archive': return 'فایل فشرده و آرشیو';
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-100">گام ۱ از ۶: انتخاب فایل و پالایش امنیتی</h3>
        <p className="text-xs text-zinc-400 mt-1">
          فایل مورد نظر را برای اشتراک‌گذاری امن و خودنابودشونده بارگذاری کنید
        </p>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative p-8 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
          dragActive
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40'
        }`}
      >
        <input
          type="file"
          id="wizardFileInput"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processSelectedFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <div className="text-xs font-bold text-zinc-200">
            فایل را اینجا بکشید یا برای انتخاب از سیستم کلیک کنید
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            تصویر، ویدیو، صدا، اسناد، کد منبع و فایل‌های فشرده (فایل‌های اجرایی ممنوع هستند)
          </div>
        </div>

        <button
          type="button"
          onClick={() => document.getElementById('wizardFileInput')?.click()}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors pointer-events-none"
        >
          انتخاب فایل از دستگاه
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* File Details & Scanner Status */}
      {state.file && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                {getCategoryIcon(state.fileCategory)}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200 truncate max-w-[260px] sm:max-w-md">
                  {state.fileName}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                  <span>نوع: {getCategoryLabel(state.fileCategory)}</span>
                  <span>•</span>
                  <span>اندازه: {formatFileSize(state.fileSize)}</span>
                </div>
              </div>
            </div>

            {/* Scanner Status Indicator */}
            <div>
              {state.isScanning ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال اسکن ۷ مرحله‌ای...</span>
                </div>
              ) : state.scanReport?.finalVerdict === 'clean' ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>اسکنر: تمیز و مجاز</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>اسکنر: رد شد</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Preview if applicable */}
          {state.filePreviewUrl && (
            <div className="pt-2">
              <div className="relative max-h-48 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                <img
                  src={state.filePreviewUrl}
                  alt={state.fileName}
                  className="max-h-48 object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Scanner Verdict Explanation */}
          {state.scanReport && (
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              state.scanReport.finalVerdict === 'clean'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
            }`}>
              {state.scanReport.humanMessage}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onNext}
          disabled={!state.file || state.isScanning || state.scanReport?.finalVerdict !== 'clean'}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
        >
          <span>ادامه به تنظیم قوانین نابودی</span>
          <FileCheck2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
