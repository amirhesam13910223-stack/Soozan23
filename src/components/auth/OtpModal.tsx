/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RotateCw, AlertTriangle, Lock, KeyRound } from 'lucide-react';
import { verifyOtp, resendOtp } from '../../services/otp';
import { toPersianDigits } from '../../services/security';

interface Props {
  target: string;
  purpose: 'register' | 'login' | 'change_password' | 'revoke_all';
  demoCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OtpModal: React.FC<Props> = ({
  target,
  purpose,
  demoCode: initialDemoCode,
  onSuccess,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [currentDemoCode, setCurrentDemoCode] = useState<string>(initialDemoCode || '');
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isLocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLocked]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned && value !== '') return;

    const lastChar = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance
    if (lastChar && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (lastChar && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMessage('لطفاً تمام ۶ رقم کد تأیید را وارد کنید.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await verifyOtp(target, code);
      if (result.success) {
        onSuccess();
      } else {
        if (result.isLocked) {
          setIsLocked(true);
        }
        setErrorMessage(result.message);
        // Clear input boxes on error
        setDigits(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } catch {
      setErrorMessage('خطای غیرمنتظره رخ داد؛ لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const { demoCode } = await resendOtp(target, purpose);
      setCurrentDemoCode(demoCode);
      setTimeLeft(120);
      setIsLocked(false);
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch {
      setErrorMessage('ارسال مجدد ناموفق بود؛ لطفاً اندکی بعد تلاش کنید.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">تأیید هویت دومرحله‌ای (OTP)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">کد ۶ رقمی امنیتی را وارد کنید</p>
          </div>
        </div>

        {/* Dev Environment Demo Code Callout */}
        {currentDemoCode && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <KeyRound className="w-4 h-4 shrink-0 text-amber-400" />
              <span>کد دمو شبیه‌ساز پیامک (محیط توسعه):</span>
            </div>
            <span className="font-mono text-sm tracking-widest font-bold text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
              {currentDemoCode}
            </span>
          </div>
        )}

        {/* 6 Digit Inputs */}
        <div className="my-6">
          <div className="flex justify-between gap-2 dir-ltr" dir="ltr">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputsRef.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                disabled={isLocked || timeLeft === 0 || isVerifying}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-mono font-bold rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {isLocked && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-2 text-xs text-rose-300">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>به دلیل سقف ورود اشتباه، کد فعلی باطل شد. دکمه ارسال مجدد را بزنید.</span>
          </div>
        )}

        {/* Timer & Resend */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
          <div className="flex items-center gap-1.5">
            <span>زمان باقیمانده:</span>
            <span
              className={`font-mono font-bold text-sm ${
                timeLeft < 30 ? 'text-rose-400' : 'text-zinc-200'
              }`}
            >
              {toPersianDigits(formatTimer(timeLeft))}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={(!isLocked && timeLeft > 0) || isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-orange-400 hover:border-orange-500/50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>ارسال مجدد کد</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={digits.some((d) => d === '') || isLocked || timeLeft === 0 || isVerifying}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
          >
            {isVerifying ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>در حال اعتبارسنجی...</span>
              </>
            ) : (
              <span>تأیید و ورود</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
