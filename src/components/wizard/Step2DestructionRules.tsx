/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Flame, Eye, Clock, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { DestructionRuleMode, QuickPreset, WizardState } from '../../types/wizard';
import { toPersianDigits } from '../../services/security';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2DestructionRules: React.FC<Props> = ({ state, updateState, onNext, onBack }) => {

  // Generate live human sentence
  const calculateHumanSummary = (
    mode: DestructionRuleMode,
    views: number,
    durationVal: number,
    unit: 'minutes' | 'hours' | 'days'
  ): string => {
    const unitFa = unit === 'minutes' ? 'دقیقه' : unit === 'hours' ? 'ساعت' : 'روز';

    if (mode === 'views') {
      if (views === 1) return 'این محتوا بلافاصله پس از اولین مشاهده موفق گیرنده، برای همیشه می‌سوزد و ناپدید می‌شود.';
      return `این محتوا پس از ${toPersianDigits(views)} بار مشاهده موفق توسط گیرنده، برای همیشه می‌سوزد و پاک می‌شود.`;
    }

    if (mode === 'time') {
      return `این محتوا پس از گذشت ${toPersianDigits(durationVal)} ${unitFa} (بر مبنای ساعت سرور)، حتی اگر دیده نشده باشد، منقضی و نابود می‌شود.`;
    }

    // Both or Custom
    if (views === 1) {
      return `این محتوا با ۱ بار مشاهده یا پس از ${toPersianDigits(durationVal)} ${unitFa}، هرکدام زودتر فرا برسد، بلافاصله می‌سوزد.`;
    }
    return `این محتوا با ${toPersianDigits(views)} بار مشاهده یا پس از ${toPersianDigits(durationVal)} ${unitFa}، هرکدام که زودتر برسد، برای همیشه می‌سوزد.`;
  };

  // Sync human summary whenever options change
  useEffect(() => {
    const summary = calculateHumanSummary(
      state.ruleMode,
      state.maxViews,
      state.durationValue,
      state.durationUnit
    );
    updateState({ humanSummary: summary });
  }, [state.ruleMode, state.maxViews, state.durationValue, state.durationUnit]);

  // Apply Quick Preset
  const applyPreset = (preset: QuickPreset) => {
    switch (preset) {
      case 'single_use':
        updateState({
          quickPreset: 'single_use',
          ruleMode: 'views',
          maxViews: 1,
          durationValue: 24,
          durationUnit: 'hours',
        });
        break;
      case 'hours_24':
        updateState({
          quickPreset: 'hours_24',
          ruleMode: 'both',
          maxViews: 3,
          durationValue: 24,
          durationUnit: 'hours',
        });
        break;
      case 'days_7':
        updateState({
          quickPreset: 'days_7',
          ruleMode: 'both',
          maxViews: 10,
          durationValue: 7,
          durationUnit: 'days',
        });
        break;
      case 'custom':
        updateState({
          quickPreset: 'custom',
          ruleMode: 'custom',
        });
        break;
    }
  };

  const VIEW_OPTIONS = [1, 2, 3, 5, 10];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-100">گام ۲ از ۶: قوانین خودنابودی محتوا</h3>
        <p className="text-xs text-zinc-400 mt-1">
          دقیقاً مشخص کنید محتوا تحت چه شرایطی (تعداد دفعات دیده شدن یا مدت زمان) برای همیشه می‌سوزد
        </p>
      </div>

      {/* Quick Presets Bar */}
      <div>
        <label className="block text-xs font-semibold text-zinc-300 mb-2">
          پریست‌های سریع:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'single_use' as QuickPreset, label: 'یک‌بارمصرف (۱ بازدید)', desc: 'بلافاصله پس از دیدن' },
            { id: 'hours_24' as QuickPreset, label: '۲۴ ساعته (۳ بازدید)', desc: 'یا پایان روز' },
            { id: 'days_7' as QuickPreset, label: 'هفتگی (۱۰ بازدید)', desc: 'یا ۷ روز' },
            { id: 'custom' as QuickPreset, label: 'تنظیمات دلخواه', desc: 'تعیین دقیق مقادیر' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                state.quickPreset === preset.id
                  ? 'bg-orange-500/10 border-orange-500/50 text-orange-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-bold">{preset.label}</div>
              <div className="text-[10px] opacity-70 mt-1">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-1 rounded-2xl bg-zinc-950 border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs font-semibold">
        {[
          { id: 'views' as DestructionRuleMode, label: 'تعداد بازدید' },
          { id: 'time' as DestructionRuleMode, label: 'مدت زمانی' },
          { id: 'both' as DestructionRuleMode, label: 'ترکیب هر دو (زودتر)' },
          { id: 'custom' as DestructionRuleMode, label: 'کاملاً دلخواه' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => updateState({ ruleMode: m.id, quickPreset: 'custom' })}
            className={`py-2 rounded-xl transition-all ${
              state.ruleMode === m.id
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Detailed Control Sections based on Mode */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-5">
        {/* VIEW CONTROLS */}
        {(state.ruleMode === 'views' || state.ruleMode === 'both' || state.ruleMode === 'custom') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Eye className="w-4 h-4 text-orange-400" />
              <span>سقف دفعات مجاز مشاهده:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => updateState({ maxViews: count, quickPreset: 'custom' })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    state.maxViews === count
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {toPersianDigits(count)} بازدید
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TIME CONTROLS */}
        {(state.ruleMode === 'time' || state.ruleMode === 'both' || state.ruleMode === 'custom') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>مدت زمان اعتبار پیش از سوختن خودکار:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">مقدار زمان:</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={state.durationValue}
                  onChange={(e) => updateState({ durationValue: Math.max(1, parseInt(e.target.value) || 1), quickPreset: 'custom' })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">واحد زمان:</label>
                <select
                  value={state.durationUnit}
                  onChange={(e) => updateState({ durationUnit: e.target.value as 'minutes' | 'hours' | 'days', quickPreset: 'custom' })}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-orange-500 focus:outline-none"
                >
                  <option value="minutes">دقیقه</option>
                  <option value="hours">ساعت</option>
                  <option value="days">روز</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Human Summary Banner */}
      <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
        <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-bold text-orange-400 mb-0.5">ترجمه قانون انتخاب‌شده به زبان ساده:</div>
          <div className="text-xs text-orange-200 leading-relaxed font-medium">
            {state.humanSummary}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به گام قبل</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-700 transition-all flex items-center gap-2"
        >
          <span>ادامه به تنظیمات محافظت</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
