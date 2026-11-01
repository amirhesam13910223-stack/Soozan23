/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Session, User } from '../types';
import { db, SecurityContext } from './db';
import { generateSecureToken } from './security';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const LOCAL_TOKEN_KEY = 'soozan_auth_token';
const TRUSTED_DEVICE_KEY = 'soozan_trusted_device';
const BIOMETRIC_PIN_KEY = 'soozan_local_biometric_pin';

/**
 * Detect client device details for transparency in sessions list.
 */
export function detectDeviceDetails(): { deviceName: string; deviceType: 'mobile' | 'desktop' | 'tablet' } {
  const ua = navigator.userAgent;
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|android|iphone/i.test(ua)) {
    deviceType = 'mobile';
  }

  let os = 'نامشخص';
  if (/windows/i.test(ua)) os = 'ویندوز';
  else if (/macintosh|mac os x/i.test(ua)) os = 'مک‌اواس';
  else if (/android/i.test(ua)) os = 'اندروید';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'آی‌اواس';
  else if (/linux/i.test(ua)) os = 'لینوکس';

  let browser = 'مرورگر';
  if (/edg/i.test(ua)) browser = 'مایکروسافت اج';
  else if (/chrome|crios/i.test(ua)) browser = 'گوگل کروم';
  else if (/firefox|fxios/i.test(ua)) browser = 'موزیلا فایرفاکس';
  else if (/safari/i.test(ua)) browser = 'سافاری';

  return {
    deviceName: `${os} (${browser})`,
    deviceType,
  };
}

/**
 * Create a new active session for an authenticated user.
 */
export function createSessionForUser(
  user: User,
  isTrusted: boolean = false
): Session {
  const { deviceName, deviceType } = detectDeviceDetails();
  const token = generateSecureToken(48);
  const now = Date.now();

  const session: Session = {
    id: `ses_${now}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.id,
    token,
    deviceName,
    deviceType,
    ipAddress: '185.190.144.' + (Math.floor(Math.random() * 200) + 10), // Iranian ISP IP mock
    isTrusted,
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  db.createSession(session);
  localStorage.setItem(LOCAL_TOKEN_KEY, token);

  if (isTrusted) {
    localStorage.setItem(TRUSTED_DEVICE_KEY, 'true');
  } else {
    localStorage.removeItem(TRUSTED_DEVICE_KEY);
  }

  return session;
}

/**
 * Get current active session from storage.
 */
export function getCurrentSession(): { session: Session; user: User } | null {
  const token = localStorage.getItem(LOCAL_TOKEN_KEY);
  if (!token) return null;

  const session = db.getSessionByToken(token);
  if (!session) {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    return null;
  }

  // Retrieve user using system context for token resolution
  const user = db.getUserById(session.userId, { isSystemInternal: true });
  if (!user) {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    return null;
  }

  return { session, user };
}

/**
 * End current session (Logout).
 */
export function terminateCurrentSession(): void {
  const current = getCurrentSession();
  if (current) {
    const context: SecurityContext = {
      userId: current.user.id,
      sessionId: current.session.id,
    };
    db.revokeSession(current.session.id, context);
  }
  localStorage.removeItem(LOCAL_TOKEN_KEY);
}

/**
 * Revoke specific session by ID.
 */
export function revokeSpecificSession(sessionId: string, userId: string): boolean {
  const current = getCurrentSession();
  const context: SecurityContext = {
    userId,
    sessionId: current?.session.id,
  };
  return db.revokeSession(sessionId, context);
}

/**
 * "پایان همه نشست‌ها" (Revoke All Sessions):
 * Section 4.6 & 6.6:
 * Invalidates all devices immediately.
 * Forces full authentication on all devices, even trusted ones.
 */
export function terminateAllSessions(userId: string): number {
  const context: SecurityContext = {
    userId,
    isSystemInternal: false,
  };
  const count = db.revokeAllSessionsForUser(userId, context);
  localStorage.removeItem(LOCAL_TOKEN_KEY);
  localStorage.removeItem(TRUSTED_DEVICE_KEY);
  return count;
}

/**
 * Local Biometric/PIN Lock helpers.
 * Note: Purely client-side screen lock; NEVER used as server identity.
 */
export function hasLocalBiometricLock(): boolean {
  return localStorage.getItem(BIOMETRIC_PIN_KEY) !== null;
}

export function setLocalBiometricLock(pin: string): void {
  localStorage.setItem(BIOMETRIC_PIN_KEY, pin);
}

export function removeLocalBiometricLock(): void {
  localStorage.removeItem(BIOMETRIC_PIN_KEY);
}

export function verifyLocalBiometricLock(pin: string): boolean {
  const stored = localStorage.getItem(BIOMETRIC_PIN_KEY);
  return stored !== null && stored === pin;
}
