/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AllowedFileCategory, MalwareScanReport } from './index';

export type DestructionRuleMode = 'views' | 'time' | 'both' | 'custom';
export type QuickPreset = 'single_use' | 'hours_24' | 'days_7' | 'custom';
export type WatermarkPosition = 'center_faint' | 'corners' | 'tiled';

export interface WizardState {
  currentStep: number; // 1 to 6

  // Step 1: File
  file: File | null;
  fileBytes: Uint8Array | null;
  fileName: string;
  fileSize: number;
  fileCategory: AllowedFileCategory;
  filePreviewUrl?: string;
  scanReport: MalwareScanReport | null;
  isScanning: boolean;

  // Step 2: Destruction Rules
  quickPreset: QuickPreset;
  ruleMode: DestructionRuleMode;
  maxViews: number; // 1, 2, 3, 5, 10 or custom
  customViewsInput: string;
  durationValue: number; // e.g. 24, 7, etc.
  durationUnit: 'minutes' | 'hours' | 'days';
  humanSummary: string;

  // Step 3: Protection
  hasPassword: boolean;
  password: string;
  confirmPassword: string;
  passwordMaxAttempts: 3 | 5 | 10;
  hasWatermark: boolean;
  watermarkText: string;
  watermarkPosition: WatermarkPosition;

  // Step 4: Personalization
  senderNote: string;
  recipientMessages: string[];
  welcomeMessage: string;

  // Step 5: Review
  acceptedDestructionTerms: boolean;

  // Step 6: Issued Result
  rawShareCode64: string | null;
  manageCode: string | null;
  issuedFileId: string | null;
}
