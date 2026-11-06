/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Flame, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Soozan Application Error Boundary Caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans selection:bg-orange-500/30" dir="rtl">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Flame/Alert Icon */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 p-0.5 shadow-xl shadow-orange-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center">
                <Flame className="w-8 h-8 text-orange-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white">خطای موقت در نمایش سامانه</h1>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                یک تداخل موقت رخ داد، اما نگران نباشید: تمام اطلاعات و کلیدهای محرمانه شما امن هستند.
              </p>
            </div>

            {/* Security Guarantee Badge */}
            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-emerald-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>محیط ذخیره‌سازی محلی و ایزوله رم (RAM) کاملاً پایدار است.</span>
            </div>

            {/* Error Message Details (if available) */}
            {this.state.error?.message && (
              <div className="text-right p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono truncate" dir="ltr">
                {this.state.error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleResetState}
                className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
              >
                بازنشانی نمایش
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بارگذاری مجدد</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
