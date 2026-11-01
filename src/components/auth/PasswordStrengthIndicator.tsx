/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { evaluatePasswordRules } from '../../services/security';

interface Props {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  if (!password) return null;

  const { score, rules } = evaluatePasswordRules(password);

  const getStrengthColor = () => {
    if (score <= 2) return 'bg-rose-500';
    if (score <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (score <= 2) return 'ضعیف (غیرمجاز)';
    if (score <= 4) return 'متوسط (نیاز به تکمیل)';
    return 'قوی و مورد تأیید';
  };

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-400 font-medium">سطح امنیت رمز عبور:</span>
        <span
          className={`font-semibold ${
            score === 5 ? 'text-emerald-400' : score <= 2 ? 'text-rose-400' : 'text-amber-400'
          }`}
        >
          {getStrengthLabel()}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-5 gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((lvl) => (
          <div
            key={lvl}
            className={`h-1.5 rounded-full transition-colors ${
              score >= lvl ? getStrengthColor() : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Rules Checklist */}
      <div className="space-y-1.5 text-zinc-300">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center gap-2">
            {rule.valid ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
            <span className={rule.valid ? 'text-zinc-200' : 'text-zinc-500'}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
