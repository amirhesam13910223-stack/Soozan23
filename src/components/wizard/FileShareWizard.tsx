/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { WizardState } from '../../types/wizard';
import { Step1File } from './Step1File';
import { Step2DestructionRules } from './Step2DestructionRules';
import { Step3Protection } from './Step3Protection';
import { Step4Personalization } from './Step4Personalization';
import { Step5Review } from './Step5Review';
import { Step6IssueResult } from './Step6IssueResult';
import { encryptFilePayload, generateShareCode64, generateManageCode } from '../../services/crypto';
import { sha256, toPersianDigits } from '../../services/security';
import { db } from '../../services/db';
import { SoozanFileRecord } from '../../types';

interface Props {
  userId: string;
  onClose: () => void;
  onSuccessDone: () => void;
}

const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: 1,

  // Step 1
  file: null,
  fileBytes: null,
  fileName: '',
  fileSize: 0,
  fileCategory: 'document',
  scanReport: null,
  isScanning: false,

  // Step 2
  quickPreset: 'hours_24',
  ruleMode: 'both',
  maxViews: 3,
  customViewsInput: '3',
  durationValue: 24,
  durationUnit: 'hours',
  humanSummary: 'این محتوا با ۳ بار مشاهده یا پس از ۲۴ ساعت، هرکدام زودتر برسد، برای همیشه می‌سوزد.',

  // Step 3
  hasPassword: false,
  password: '',
  confirmPassword: '',
  passwordMaxAttempts: 5,
  hasWatermark: false,
  watermarkText: '',
  watermarkPosition: 'center_faint',

  // Step 4
  senderNote: '',
  recipientMessages: [],
  welcomeMessage: '',

  // Step 5
  acceptedDestructionTerms: false,

  // Step 6
  rawShareCode64: null,
  manageCode: null,
  issuedFileId: null,
};

const STEP_LABELS = [
  'انتخاب فایل',
  'قوانین نابودی',
  'محافظت و رمز',
  'شخصی‌سازی',
  'بازبینی و تعهد',
  'صدور کد اشتراک',
];

export const FileShareWizard: React.FC<Props> = ({ userId, onClose, onSuccessDone }) => {
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [isIssuing, setIsIssuing] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleNextStep = () => {
    setState((prev) => ({ ...prev, currentStep: Math.min(6, prev.currentStep + 1) }));
  };

  const handleBackStep = () => {
    setState((prev) => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }));
  };

  const handleGoToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= 5) {
      setState((prev) => ({ ...prev, currentStep: stepNumber }));
    }
  };

  const handleFinalIssue = async () => {
    if (!state.fileBytes || !state.scanReport || state.scanReport.finalVerdict !== 'clean') {
      return;
    }

    setIsIssuing(true);
    try {
      // 1. Encrypt payload with AES-GCM 256-bit
      const { payload } = await encryptFilePayload(
        state.fileBytes,
        state.fileName,
        state.file?.type || 'application/octet-stream'
      );

      // 2. Generate 64-character share code (Recipient key)
      const rawShareCode64 = generateShareCode64();

      // 3. Compute SHA-256 hash of share code (ONLY hash is stored in DB!)
      const shareCodeHash = await sha256(rawShareCode64, 'soozan_share_salt_v1');

      // 4. Generate 16-character management code for sender
      const manageCode = generateManageCode();

      // 5. Compute duration in minutes
      const multiplier = state.durationUnit === 'minutes' ? 1 : state.durationUnit === 'hours' ? 60 : 1440;
      const durationMinutes = state.durationValue * multiplier;
      const expiresAt = Date.now() + durationMinutes * 60 * 1000;

      // 6. Optional file password hash
      let filePasswordHash: string | undefined;
      if (state.hasPassword && state.password) {
        filePasswordHash = await sha256(state.password, `file_pass_${rawShareCode64.slice(0, 16)}`);
      }

      // 7. Store file record
      const record: SoozanFileRecord = {
        id: `fil_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ownerUserId: userId,
        fileName: state.fileName,
        fileSize: state.fileSize,
        category: state.fileCategory,
        shareCodeHash,
        manageCode,
        encryptedPayload: payload,
        scanReport: state.scanReport,
        policy: {
          type: state.ruleMode === 'views' ? 'views' : state.ruleMode === 'time' ? 'time' : 'both',
          maxViews: (state.ruleMode === 'views' || state.ruleMode === 'both' || state.ruleMode === 'custom') ? state.maxViews : undefined,
          consumedViews: 0,
          durationMinutes: (state.ruleMode === 'time' || state.ruleMode === 'both' || state.ruleMode === 'custom') ? durationMinutes : undefined,
          expiresAt: (state.ruleMode === 'time' || state.ruleMode === 'both' || state.ruleMode === 'custom') ? expiresAt : undefined,
        },
        status: 'issued',
        filePasswordHash,
        passwordMaxAttempts: state.hasPassword ? state.passwordMaxAttempts : undefined,
        watermarkText: state.hasWatermark ? state.watermarkText : undefined,
        senderNote: state.senderNote.trim() || undefined,
        recipientMessages: state.recipientMessages.length > 0 ? state.recipientMessages : undefined,
        createdAt: Date.now(),
        issuedAt: Date.now(),
      };

      db.createFileRecord(record, { userId });

      // Move to Step 6
      updateState({
        rawShareCode64,
        manageCode,
        issuedFileId: record.id,
        currentStep: 6,
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleCloseAttempt = () => {
    if (state.currentStep > 1 && state.currentStep < 6) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-100 flex flex-col my-auto max-h-[92vh]">
        {/* WIZARD HEADER */}
        <div className="p-5 sm:p-6 pb-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">ویزارد اشتراک‌گذاری محتوای خودنابودشونده</h2>
            <div className="text-xs text-orange-400 mt-0.5">
              مرحله {toPersianDigits(state.currentStep)} از ۶: {STEP_LABELS[state.currentStep - 1]}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAttempt}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="بستن ویزارد"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="px-6 pt-4 bg-zinc-950/30">
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6].map((st) => (
              <div key={st} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    st === state.currentStep
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                      : st < state.currentStep
                      ? 'bg-emerald-500'
                      : 'bg-zinc-800'
                  }`}
                />
                <div className="hidden sm:block text-[9px] font-medium text-zinc-500 truncate text-center">
                  {STEP_LABELS[st - 1]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP CONTENT BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {state.currentStep === 1 && (
            <Step1File
              state={state}
              updateState={updateState}
              onNext={handleNextStep}
            />
          )}

          {state.currentStep === 2 && (
            <Step2DestructionRules
              state={state}
              updateState={updateState}
              onNext={handleNextStep}
              onBack={handleBackStep}
            />
          )}

          {state.currentStep === 3 && (
            <Step3Protection
              state={state}
              updateState={updateState}
              onNext={handleNextStep}
              onBack={handleBackStep}
            />
          )}

          {state.currentStep === 4 && (
            <Step4Personalization
              state={state}
              updateState={updateState}
              onNext={handleNextStep}
              onBack={handleBackStep}
            />
          )}

          {state.currentStep === 5 && (
            <Step5Review
              state={state}
              updateState={updateState}
              onGoToStep={handleGoToStep}
              onIssueFinal={handleFinalIssue}
              onBack={handleBackStep}
              isIssuing={isIssuing}
            />
          )}

          {state.currentStep === 6 && (
            <Step6IssueResult
              state={state}
              onGoToDashboard={() => {
                onClose();
                onSuccessDone();
              }}
            />
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl text-zinc-100">
            <h4 className="text-sm font-bold text-white mb-2">انصراف از اشتراک‌گذاری فایل؟</h4>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              با بستن ویزارد، تنظیماتی که تا این مرحله وارد کرده‌اید لغو خواهد شد. آیا مطمئن هستید؟
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-300 hover:bg-zinc-800"
              >
                ادامه ویزارد
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                بستن و انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
