/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Flame,
  Shield,
  Eye,
  Clock,
  Sparkles,
  Lock,
  AlertTriangle,
  X,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCheck,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Move,
  Contrast,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Search,
  WrapText,
  Type,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Video,
  Music,
} from 'lucide-react';
import { SoozanFileRecord } from '../../types';
import { toPersianDigits } from '../../services/security';
import { useAntiLeakShield } from './useAntiLeakShield';
import { WatermarkOverlay } from './WatermarkOverlay';
import { BlackoutCurtain } from './BlackoutCurtain';

interface Props {
  file: SoozanFileRecord;
  rawShareCode64: string;
  isLastView: boolean;
  onBurnNow: () => void;
  onClose: () => void;
}

export const SecureFileViewer: React.FC<Props> = ({
  file,
  rawShareCode64,
  isLastView,
  onBurnNow,
  onClose,
}) => {
  const [showBurnConfirm, setShowBurnConfirm] = useState<boolean>(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // Media & Interaction States
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Video / Audio Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mediaTime, setMediaTime] = useState<number>(0);
  const [mediaDuration] = useState<number>(45); // 45 seconds demo duration
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Document / Text States
  const [fontSize, setFontSize] = useState<number>(14);
  const [isWordWrap, setIsWordWrap] = useState<boolean>(true);
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [docTheme, setDocTheme] = useState<'dark' | 'amber' | 'emerald'>('dark');

  const containerRef = useRef<HTMLDivElement>(null);

  const { isBlackedOut, warningMessage, resumeFromBlackout } = useAntiLeakShield({
    enabled: true,
  });

  // Countdown timer for time-based destruction
  useEffect(() => {
    if (!file.policy.expiresAt) return;

    const updateTimer = () => {
      const remainingMs = file.policy.expiresAt! - Date.now();
      if (remainingMs <= 0) {
        setTimeLeftStr('مهلت منقضی شد');
        onBurnNow();
        return;
      }
      const totalSec = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      setTimeLeftStr(
        `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [file.policy.expiresAt, onBurnNow]);

  // Video playback timer ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setMediaTime((prev) => {
          if (prev >= mediaDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, mediaDuration]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  };

  const verificationId = `SZ-${rawShareCode64.slice(0, 4).toUpperCase()}-${rawShareCode64
    .slice(-4)
    .toUpperCase()}`;

  // Interactive Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan & drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Directional step controls (for precision moving)
  const handlePanStep = (dir: 'up' | 'down' | 'left' | 'right') => {
    const step = 60;
    setPanPosition((prev) => {
      switch (dir) {
        case 'up':
          return { ...prev, y: prev.y + step };
        case 'down':
          return { ...prev, y: prev.y - step };
        case 'left':
          return { ...prev, x: prev.x + step };
        case 'right':
          return { ...prev, x: prev.x - step };
      }
    });
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(0.5, Math.min(4, Number((prev + delta).toFixed(2))));
      if (next === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsHighContrast(false);
  };

  const isImage = file.category === 'image' || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.fileName);
  const isVideo = file.category === 'video' || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.fileName);
  const isAudio = file.category === 'audio' || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.fileName);
  const isDocumentOrText =
    !isImage &&
    !isVideo &&
    !isAudio;

  const defaultSampleText = `مفاد کلیدی و تعهدات محرمانه تفاهم‌نامه فنی و حقوقی:

۱. این محتوا پس از دریافت کلید اختصاصی ۲۵۶ بیتی به صورت موقت در رم (RAM) دستگاه رمزگشایی گردیده و به هیچ عنوان بر روی دیسک، کش مرورگر یا پایگاه داده محلی ذخیره نمی‌شود.
۲. بر اساس سیاست تعیین‌شده توسط فرستنده محتوا، این سند تحت نظارت دائم پروتکل امحای رمزارزی (Cryptographic Shredding) قرار دارد و با پایان مهلت زمان یا سقف بازدید فوراً نابود خواهد شد.
۳. کلیه لایه‌های بازدارنده ضد اسکرین‌شات، واتر‌مارک متحرک ره‌گیری، پرده مشکی در هنگام جابجایی تب و مسدودسازی منوی کلیک‌راست به صورت فعال روی این بستر برقرار هستند.
۴. در هر لحظه که مایل باشید می‌توانید از دکمه «سوزاندن خودم و بستن» استفاده کنید تا حتی قبل از اتمام مهلت، فایل برای همیشه بسوزد و ناپدید شود.

پلتفرم امن سوزان: بفرست، بدون اینکه جا بماند.`;

  return (
    <div className={`relative max-w-4xl mx-auto px-2 sm:px-4 py-4 pb-24 select-none ${isFullscreen ? 'fixed inset-0 z-50 max-w-none p-0 pb-0 bg-black' : ''}`}>
      {/* Blackout Curtain on Window Blur / Tab Switch */}
      {isBlackedOut && <BlackoutCurtain onResume={resumeFromBlackout} />}

      {/* Floating Anti-Leak Violation Toast */}
      {warningMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-rose-600/90 text-white border border-rose-400 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-white" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Main Secure Viewer Container */}
      <div className={`relative rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col ${isFullscreen ? 'h-full rounded-none border-0' : ''}`}>
        {/* Dynamic Watermark Overlay */}
        <WatermarkOverlay
          customText={file.watermarkText}
          verificationId={verificationId}
        />

        {/* Top Control Header */}
        <div className="relative z-30 p-3.5 sm:p-4 bg-zinc-950/95 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              {isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : isVideo ? (
                <Video className="w-5 h-5" />
              ) : isAudio ? (
                <Music className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100 truncate max-w-[200px] sm:max-w-xs" dir="ltr">
                  {file.fileName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                  <FileCheck className="w-3 h-3" />
                  <span>رمزگشایی امن</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                <span>اندازه: {formatFileSize(file.fileSize)}</span>
                <span>•</span>
                <span className="font-mono text-zinc-300" dir="ltr">{verificationId}</span>
              </div>
            </div>
          </div>

          {/* Policy Badges & Status */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {isLastView ? (
              <div className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>آخرین مشاهده</span>
              </div>
            ) : file.policy.maxViews ? (
              <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {toPersianDigits(file.policy.consumedViews)} از {toPersianDigits(file.policy.maxViews)}
                </span>
              </div>
            ) : null}

            {timeLeftStr && (
              <div className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-mono font-bold flex items-center gap-1.5 dir-ltr" dir="ltr">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>{toPersianDigits(timeLeftStr)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'نمایش تمام‌صفحه'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sender's Note Banner if present */}
        {file.senderNote && (
          <div className="relative z-30 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">یادداشت فرستنده: </span>
              <span className="leading-relaxed">{file.senderNote}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE MEDIA TOOLBAR (Zoom, Pan, Rotate, Speed, Font, Search)        */}
        {/* ========================================================================= */}
        <div className="relative z-30 px-3 sm:px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* IMAGE & VIDEO ZOOM & PAN CONTROLS */}
          {(isImage || isVideo) && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[11px] text-zinc-400 font-semibold pl-1 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-orange-400" />
                <span>زوم و جابجایی:</span>
              </span>

              <button
                type="button"
                onClick={() => handleZoom(-0.25)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="کوچک‌نمایی"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-orange-400 font-bold min-w-[48px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                type="button"
                onClick={() => handleZoom(0.25)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="بزرگ‌نمایی"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                title="بازنشانی اندازه و موقعیت"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {isImage && (
                <>
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                    title="چرخش ۹۰ درجه"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHighContrast(!isHighContrast)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isHighContrast
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-800 border-transparent text-zinc-400 hover:text-white'
                    }`}
                    title="فیلتر تفکیک کنتراست امنیتی"
                  >
                    <Contrast className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* VIDEO SPECIFIC SPEED CONTROLS */}
          {isVideo && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-zinc-400 font-medium">سرعت:</span>
              {[0.5, 1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          )}

          {/* DOCUMENT / TEXT CONTROLS */}
          {isDocumentOrText && (
            <div className="flex flex-wrap items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-orange-400" />
                  <span>اندازه قلم:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFontSize((p) => Math.max(11, p - 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
                  title="کاهش اندازه قلم"
                >
                  A-
                </button>
                <span className="text-[11px] font-mono text-zinc-300 min-w-[20px] text-center">
                  {fontSize}
                </span>
                <button
                  type="button"
                  onClick={() => setFontSize((p) => Math.min(24, p + 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
                  title="افزایش اندازه قلم"
                >
                  A+
                </button>

                <button
                  type="button"
                  onClick={() => setIsWordWrap(!isWordWrap)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                    isWordWrap
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <WrapText className="w-3 h-3 inline ml-1" />
                  <span>شکست خودکار</span>
                </button>
              </div>

              {/* Text Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجو در متن سند..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="py-1 px-3 pr-7 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <Search className="w-3 h-3 text-zinc-400 absolute right-2.5 top-2" />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECURE CONTENT CANVAS & DISPLAY                                           */}
        {/* ========================================================================= */}
        <div
          ref={containerRef}
          className={`relative flex-1 min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden bg-zinc-950/90 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* DIRECTIONAL PAN JOYSTICK (OVERLAY FOR EASY PRECISE NAVIGATION) */}
          {(isImage || isVideo) && zoomLevel > 1 && (
            <div className="absolute top-4 left-4 z-20 flex flex-col items-center bg-zinc-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 shadow-xl pointer-events-auto">
              <button
                type="button"
                onClick={() => handlePanStep('up')}
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white"
                title="انتقال به بالا"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePanStep('left')}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white"
                  title="انتقال به چپ"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPanPosition({ x: 0, y: 0 })}
                  className="w-3.5 h-3.5 rounded-full bg-orange-500/80 hover:bg-orange-500"
                  title="مرکز"
                />
                <button
                  type="button"
                  onClick={() => handlePanStep('right')}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white"
                  title="انتقال به راست"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handlePanStep('down')}
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white"
                title="انتقال به پایین"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. IMAGE VIEWER ENGINE (WITH PAN, ZOOM & HIGH-RES ARTWORK/DETAILS) */}
          {isImage ? (
            <div
              className="transition-transform duration-75 ease-out select-none"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                filter: isHighContrast ? 'contrast(200%) invert(10%)' : 'none',
              }}
            >
              {/* Rich Visual High-Detail Encrypted Graphic Presentation */}
              <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[460px] rounded-3xl overflow-hidden border-2 border-zinc-800/80 bg-gradient-to-tr from-zinc-900 via-zinc-950 to-neutral-900 shadow-2xl flex flex-col justify-between p-6">
                {/* Background Blueprint Grid Patterns */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* Top Blueprint Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-orange-400" dir="ltr">
                      ENCRYPTED_ASSET://{file.fileName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">RES: 3840x2160 ULTRA-HD</span>
                </div>

                {/* Dynamic Center Graphic: Architectural / Cryptographic Schematic */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-dashed border-orange-500/40 flex items-center justify-center p-3">
                    <div className="w-full h-full rounded-full border border-orange-400/20 bg-orange-500/5 flex flex-col items-center justify-center space-y-1">
                      <ImageIcon className="w-12 h-12 text-orange-400/70" />
                      <span className="text-[11px] font-bold text-zinc-300">تصویر محرمانه رمزگشایی‌شده</span>
                      <span className="text-[9px] font-mono text-zinc-500">SHA256: VALIDATED</span>
                    </div>
                  </div>

                  <div className="space-y-1 max-w-sm">
                    <p className="text-xs font-bold text-zinc-200">
                      داده‌های گرافیکی با کیفیت اصلی در رم تفکیک شدند
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      برای کاوش در جزئیات، تصویر را زوم کنید و با ماوس یا انگشت به بخش‌های مختلف حرکت نمایید.
                    </p>
                  </div>
                </div>

                {/* Bottom Graphic Footer */}
                <div className="relative z-10 flex items-center justify-between pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500">
                  <span>وضعیت لایسنس: یک‌بارمصرف اختصاصی</span>
                  <span className="font-mono" dir="ltr">ZOOM: {Math.round(zoomLevel * 100)}%</span>
                </div>
              </div>
            </div>
          ) : isVideo ? (
            /* 2. VIDEO PLAYER ENGINE (WITH PLAYBACK, SCRUBBER & VIDEO ZOOM/PAN) */
            <div
              className="relative w-full max-w-2xl px-4 py-6 transition-transform duration-75 ease-out select-none"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
              }}
            >
              <div className="relative rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl aspect-video flex flex-col justify-between p-4">
                {/* Visual Video Simulation Screen */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950 to-zinc-900 flex items-center justify-center">
                  {/* Cyber Visualizer Wave */}
                  <div className="flex items-center gap-1.5 h-24">
                    {[40, 75, 55, 90, 30, 85, 60, 95, 45, 80, 50, 70].map((h, i) => (
                      <div
                        key={i}
                        className={`w-2.5 rounded-full transition-all duration-300 ${
                          isPlaying ? 'bg-orange-500 animate-pulse' : 'bg-zinc-800'
                        }`}
                        style={{
                          height: isPlaying ? `${(h * (mediaTime % 5 + 1)) % 100 + 20}%` : '20%',
                        }}
                      />
                    ))}
                  </div>

                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      className="absolute w-16 h-16 rounded-full bg-orange-500/90 hover:bg-orange-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/40 hover:scale-110 active:scale-95 transition-all"
                      title="پخش ویدیو"
                    >
                      <Play className="w-8 h-8 fill-white mr-1" />
                    </button>
                  )}
                </div>

                {/* Top Video Header Overlay */}
                <div className="relative z-10 flex items-center justify-between text-xs text-zinc-300 bg-black/60 backdrop-blur-sm p-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-orange-400" />
                    <span className="font-bold truncate max-w-[200px]" dir="ltr">{file.fileName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{playbackSpeed}x SPEED</span>
                </div>

                {/* Bottom Video Controls Overlay */}
                <div className="relative z-10 space-y-2 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800/80">
                  {/* Time Scrubber */}
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                    <span dir="ltr">00:{mediaTime.toString().padStart(2, '0')}</span>
                    <input
                      type="range"
                      min={0}
                      max={mediaDuration}
                      value={mediaTime}
                      onChange={(e) => setMediaTime(Number(e.target.value))}
                      className="flex-1 accent-orange-500 cursor-pointer h-1.5 rounded-lg bg-zinc-800"
                    />
                    <span dir="ltr">00:{mediaDuration}</span>
                  </div>

                  {/* Player Button Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaTime((t) => Math.max(0, t - 5))}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        title="۵ ثانیه عقب"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaTime((t) => Math.min(mediaDuration, t + 5))}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        title="۵ ثانیه جلو"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 3. DOCUMENT / TEXT VIEWER ENGINE */
            <div className="w-full max-w-3xl p-4 sm:p-6 select-none">
              <div
                className={`p-6 rounded-3xl border shadow-inner transition-colors ${
                  docTheme === 'amber'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : docTheme === 'emerald'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
                  <span className="font-bold text-orange-400 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>سند رمزگشایی‌شده (AES-GCM-256)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocTheme('dark')}
                      className={`w-3.5 h-3.5 rounded-full border ${docTheme === 'dark' ? 'bg-zinc-700 border-white' : 'bg-zinc-900 border-zinc-700'}`}
                      title="پوسته تیره"
                    />
                    <button
                      type="button"
                      onClick={() => setDocTheme('amber')}
                      className={`w-3.5 h-3.5 rounded-full border ${docTheme === 'amber' ? 'bg-amber-600 border-white' : 'bg-amber-950 border-amber-700'}`}
                      title="پوسته کهربایی"
                    />
                    <button
                      type="button"
                      onClick={() => setDocTheme('emerald')}
                      className={`w-3.5 h-3.5 rounded-full border ${docTheme === 'emerald' ? 'bg-emerald-600 border-white' : 'bg-emerald-950 border-emerald-700'}`}
                      title="پوسته ماتریس زمردی"
                    />
                  </div>
                </div>

                <div
                  className={`leading-loose ${isWordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {docSearchQuery.trim()
                    ? defaultSampleText.split(new RegExp(`(${docSearchQuery.trim()})`, 'gi')).map((part, i) =>
                        part.toLowerCase() === docSearchQuery.trim().toLowerCase() ? (
                          <mark key={i} className="bg-amber-400 text-zinc-950 font-bold px-1 rounded">
                            {part}
                          </mark>
                        ) : (
                          part
                        )
                      )
                    : defaultSampleText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ACTIONS BAR & SELF-BURN BUTTON                                      */}
        {/* ========================================================================= */}
        <div className="relative z-30 p-3.5 sm:p-4 bg-zinc-950/95 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>حفاظت فعال: گیرنده هیچ ردی بر جا نمی‌گذارد و فایل در حافظه موقت ایزوله است.</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* VOLUNTARY SELF-BURN BUTTON */}
            <button
              type="button"
              onClick={() => setShowBurnConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Flame className="w-4 h-4 text-rose-200" />
              <span>سوزاندن خودم و بستن</span>
            </button>

            {/* EXIT / CLOSE BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
            >
              پایان مطالعه و بستن
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM IMMEDIATE SELF-BURN MODAL */}
      {showBurnConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-rose-500/40 p-6 text-center space-y-4 animate-scale-up shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-7 h-7 animate-bounce" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">آیا از سوزاندن فوری محتوا اطمینان دارید؟</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                با کلیک بر روی این گزینه، کلید رمزنگاری فوراً از بین رفته و فایل حتی برای خود شما نیز دیگر قابل دسترس نخواهد بود.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBurnConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowBurnConfirm(false);
                  onBurnNow();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                <span>بله، همین حالا بسوزان</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
