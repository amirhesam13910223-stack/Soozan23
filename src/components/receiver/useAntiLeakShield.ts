/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

export interface AntiLeakOptions {
  enabled?: boolean;
  onViolation?: (type: string) => void;
}

export function useAntiLeakShield(options: AntiLeakOptions = { enabled: true }) {
  const { enabled = true, onViolation } = options;
  const [isBlackedOut, setIsBlackedOut] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const showTemporaryWarning = useCallback((msg: string) => {
    setWarningMessage(msg);
    const timer = setTimeout(() => {
      setWarningMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 1. Right-click context menu prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showTemporaryWarning('کلیک راست و ذخیره در محیط امن سوزان غیرفعال است.');
      onViolation?.('context_menu');
      return false;
    };

    // 2. Keyboard shortcut interceptions (PrintScreen, Ctrl+S, Ctrl+P, Ctrl+U, DevTools, Copy)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // PrintScreen deterrence
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        setIsBlackedOut(true);
        showTemporaryWarning('عکس‌برداری از صفحه طبق پروتکل امنیتی سوزان مسدود است.');
        onViolation?.('screenshot_attempt');
        try {
          navigator.clipboard.writeText('');
        } catch {
          // Ignore
        }
        return false;
      }

      // Save page (Ctrl+S / Cmd+S)
      if (cmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        showTemporaryWarning('ذخیره‌سازی و بارگیری این محتوا مسدود است.');
        onViolation?.('save_attempt');
        return false;
      }

      // Print page (Ctrl+P / Cmd+P)
      if (cmdOrCtrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        showTemporaryWarning('چاپ و استخراج سند مسدود است.');
        onViolation?.('print_attempt');
        return false;
      }

      // View Source (Ctrl+U / Cmd+U)
      if (cmdOrCtrl && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        showTemporaryWarning('دسترسی به ساختار محتوا مسدود است.');
        return false;
      }

      // Developer Tools (F12 or Ctrl+Shift+I / Cmd+Option+I)
      if (
        e.key === 'F12' ||
        (cmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j'))
      ) {
        e.preventDefault();
        showTemporaryWarning('ابزارهای بازرسی برای حفظ محرمانگی غیرفعال است.');
        return false;
      }

      // Text Copy (Ctrl+C / Cmd+C) inside secure viewer
      if (cmdOrCtrl && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        showTemporaryWarning('کپی کردن متن در سامانه خودنابودشونده سوزان مسدود است.');
        onViolation?.('copy_attempt');
        return false;
      }
    };

    // 3. Tab visibility switch deterrence (blackout curtain when tab is switched)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlackedOut(true);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, onViolation, showTemporaryWarning]);

  const resumeFromBlackout = () => {
    setIsBlackedOut(false);
  };

  return {
    isBlackedOut,
    warningMessage,
    resumeFromBlackout,
  };
}
