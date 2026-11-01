/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { verifyLocalBiometricLock } from '../../services/session';

interface Props {
  onUnlocked: () => void;
  onFallbackToFullLogin: () => void;
}

export const BiometricLockModal: React.FC<Props> = ({
  onUnlocked,
  onFallbackToFullLogin,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSimulatingBiometric, setIsSimulatingBiometric] = useState<boolean>(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyLocalBiometricLock(pin)) {
      onUnlocked();
    } else {
      setError('پین امنیتی محلی نادرست است.');
    }
  };

  const handleSimulateBiometric = () => {
    setIsSimulatingBiometric(true);
    setError(null);
    setTimeout(() => {
      setIsSimulatingBiometric(false);
      onUnlocked();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-center text-zinc-100 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
          <Fingerprint className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-zinc-100">قفل امنیتی دستگاه (محلی)</h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          برای بازگشایی نشست فعال روی این دستگاه، اثر انگشت یا پین محلی خود را وارد کنید.
        </p>

        <div className="my-5 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>مطابق قاعده امنیتی سوزان: بیومتریک صرفاً قفل محلی است و هویت سرور نیست.</span>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSimulateBiometric}
          disabled={isSimulatingBiometric}
          className="w-full py-3 mb-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
        >
          <Fingerprint className="w-4 h-4" />
          <span>{isSimulatingBiometric ? 'در حال سنجش اثر انگشت...' : 'ورود با اثر انگشت / تشخیص چهره'}</span>
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <span className="relative bg-zinc-900 px-3 text-[11px] text-zinc-500">یا ورود با پین ۴ رقمی</span>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-3">
          <input
            type="password"
            maxLength={6}
            placeholder="پین محلی"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(null);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono text-sm tracking-widest text-zinc-100 focus:border-orange-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>بازگشایی با پین</span>
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onFallbackToFullLogin}
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors"
          >
            خروج و ورود مجدد کامل با گذرواژه
          </button>
        </div>
      </div>
    </div>
  );
};
