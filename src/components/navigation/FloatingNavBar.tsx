/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
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
  const fabRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const baseHeightRef = useRef<number>(window.innerHeight);

  useEffect(() => {
    baseHeightRef.current = window.innerHeight;

    const isInputActive = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName?.toUpperCase();
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (typeof active.getAttribute === 'function' && active.getAttribute('contenteditable') === 'true')
      );
    };

    let rafId: number | null = null;

    const updatePosition = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const inputActive = isInputActive();
        const vv = window.visualViewport;

        // When no input is active, update base baseline height
        if (!inputActive) {
          baseHeightRef.current = Math.max(baseHeightRef.current, window.innerHeight);
        }

        const currentHeight = vv ? vv.height : window.innerHeight;
        const offsetTop = vv ? vv.offsetTop : 0;

        // Calculate the height consumed by the virtual keyboard / viewport shrink
        const delta = baseHeightRef.current - (currentHeight + offsetTop);
        const shift = Math.max(0, Math.round(delta));
        const transformValue = shift > 0 ? `translate3d(0, ${shift}px, 0)` : '';

        // Direct DOM update (Zero React re-render thrashing on scroll/resize)
        if (fabRef.current) fabRef.current.style.transform = transformValue;
        if (navRef.current) navRef.current.style.transform = transformValue;
      });
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePosition);
      window.visualViewport.addEventListener('scroll', updatePosition);
    }
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('focusin', updatePosition);
    window.addEventListener('focusout', () => {
      setTimeout(updatePosition, 120);
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePosition);
        window.visualViewport.removeEventListener('scroll', updatePosition);
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('focusin', updatePosition);
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
      {/* Floating Accent Circular FAB - Locked strictly in place via direct GPU transform */}
      <div
        ref={fabRef}
        className="floating-fab-container"
      >
        <button
          type="button"
          onClick={onOpenWizard}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-orange-500 via-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/35 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-2 border-zinc-950 focus:outline-none ring-4 ring-orange-500/10"
          title="اشتراک‌گذاری فایل جدید (ویزارد)"
          aria-label="اشتراک‌گذاری فایل جدید"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.75]" />
        </button>
      </div>

      {/* Centered Floating Capsule Bar - Locked strictly in place, never moves or fades */}
      <div
        ref={navRef}
        className="floating-nav-container flex items-center justify-center px-3"
      >
        <nav
          className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 shadow-2xl shadow-black/80 max-w-[calc(100vw-24px)]"
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
                className={`relative min-w-[70px] sm:min-w-[84px] py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-full flex flex-col items-center justify-center gap-0.5 text-center transition-colors focus:outline-none select-none ${
                  isActive
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {/* Active Sliding Pill Highlight */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 shadow-md shadow-orange-500/25 -z-0"
                  />
                )}

                <Icon className="w-5 h-5 relative z-10 shrink-0 stroke-[2.2]" />
                <span className="text-[11px] sm:text-xs font-bold tracking-tight relative z-10 leading-none truncate max-w-full">
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
