/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, KeyRound, Download, Plus } from 'lucide-react';

export type NavTab = 'home' | 'manage_code' | 'receive_file' | 'profile' | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenWizard: () => void;
  isAppMode?: boolean; // false = web mode (only home & manage_code), true = app mode (all 3)
}

export const FloatingNavBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenWizard,
  isAppMode = true,
}) => {
  // Mobile Virtual Keyboard Detection (prevents FAB & navbar from popping up over keyboard/inputs)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Visual Viewport height shrinkage listener (standard in mobile Chrome)
    const handleViewportResize = () => {
      if (window.visualViewport) {
        const heightDifference = window.innerHeight - window.visualViewport.height;
        setIsKeyboardOpen(heightDifference > 140);
      }
    };

    // 2. Focus in/out listeners on form inputs
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('contenteditable') === 'true')
      ) {
        if (window.innerWidth <= 768) {
          setIsKeyboardOpen(true);
        }
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== 'INPUT' &&
            active.tagName !== 'TEXTAREA' &&
            active.getAttribute('contenteditable') !== 'true')
        ) {
          setIsKeyboardOpen(false);
        }
      }, 120);
    };

    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const items = [
    {
      id: 'home' as NavTab,
      label: 'سازنده',
      icon: Home,
    },
    {
      id: 'manage_code' as NavTab,
      label: 'پنل مدیریت',
      icon: KeyRound,
    },
    ...(isAppMode
      ? [
          {
            id: 'receive_file' as NavTab,
            label: 'دریافت فایل',
            icon: Download,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Floating Accent Circular FAB - Elevated and stays behind/hidden when keyboard is open */}
      <div
        className={`fixed bottom-24 sm:bottom-28 left-4 sm:left-6 z-40 transition-all duration-200 ease-out ${
          isKeyboardOpen ? 'opacity-0 pointer-events-none translate-y-36' : 'opacity-100 translate-y-0'
        }`}
      >
        <button
          type="button"
          onClick={onOpenWizard}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-orange-500 via-orange-500 to-amber-500 text-white shadow-2xl shadow-orange-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-zinc-950 focus:outline-none ring-4 ring-orange-500/10"
          title="اشتراک‌گذاری فایل جدید (ویزارد)"
          aria-label="اشتراک‌گذاری فایل جدید"
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.75]" />
        </button>
      </div>

      {/* Centered Floating Capsule Bar - Enlarged slightly with extra padding, stays hidden when keyboard opens */}
      <div
        className={`fixed bottom-4 sm:bottom-6 inset-x-0 z-40 flex items-center justify-center px-3 pointer-events-none transition-all duration-200 ease-out ${
          isKeyboardOpen ? 'opacity-0 pointer-events-none translate-y-36' : 'opacity-100 translate-y-0'
        }`}
      >
        <nav
          className="pointer-events-auto flex items-center gap-1.5 p-1.5 sm:p-2 rounded-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 shadow-2xl shadow-black/80 max-w-[calc(100vw-24px)]"
          role="navigation"
          aria-label="ناوبری اصلی سوزان"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-w-[82px] sm:min-w-[100px] py-2.5 sm:py-3 px-3.5 sm:px-4.5 rounded-full flex flex-col items-center justify-center gap-1 text-center transition-all duration-300 focus:outline-none select-none ${
                  isActive
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {/* Active Sliding Pill Highlight */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 shadow-md shadow-orange-500/25 -z-0"
                    layout-id="active-pill"
                  />
                )}

                <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10 shrink-0 stroke-[2.2]" />
                <span className="text-[11.5px] sm:text-xs font-bold tracking-tight relative z-10 leading-none truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
