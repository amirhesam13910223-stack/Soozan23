/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Session } from './types';
import { getCurrentSession, terminateCurrentSession, hasLocalBiometricLock } from './services/session';
import { Header } from './components/common/Header';
import { AuthView } from './components/auth/AuthView';
import { SenderDashboard } from './components/dashboard/SenderDashboard';
import { ManageCodeView } from './components/manage/ManageCodeView';
import { ReceiveFileView } from './components/receiver/ReceiveFileView';
import { FloatingNavBar, NavTab } from './components/navigation/FloatingNavBar';
import { WebNoticeModal } from './components/common/WebNoticeModal';
import { SecurityAuditModal } from './components/tests/SecurityAuditModal';
import { BiometricLockModal } from './components/auth/BiometricLockModal';
import { SessionsManager } from './components/auth/SessionsManager';
import { MalwareScannerTester } from './components/scanner/MalwareScannerTester';
import { FileShareWizard } from './components/wizard/FileShareWizard';
import { GuardianPanel } from './components/guardian/GuardianPanel';
import { ResilienceModal } from './components/resilience/ResilienceModal';
import { HelpCenterModal } from './components/help/HelpCenterModal';
import { PricingModal } from './components/pricing/PricingModal';
import { SideDrawer } from './components/navigation/SideDrawer';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { Sparkles, ArrowRight, ShieldAlert, Plus } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const saved = localStorage.getItem('soozan_active_tab') as NavTab | null;
      if (saved && ['home', 'manage_code', 'receive_file', 'profile', 'settings'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'home';
  });
  const [isBiometricLocked, setIsBiometricLocked] = useState<boolean>(false);
  const [showScannerTester, setShowScannerTester] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);

  // Modals
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showGuardianModal, setShowGuardianModal] = useState<boolean>(false);
  const [showSessionsModal, setShowSessionsModal] = useState<boolean>(false);
  const [showResilienceModal, setShowResilienceModal] = useState<boolean>(false);
  const [showHelpCenterModal, setShowHelpCenterModal] = useState<boolean>(false);
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);

  const handleNavigate = (tab: NavTab | 'profile' | 'settings') => {
    setActiveTab(tab as NavTab);
    try {
      localStorage.setItem('soozan_active_tab', tab);
    } catch {
      // ignore
    }
    setShowScannerTester(false);
  };

  // Initial session resolution
  const refreshSession = () => {
    const authData = getCurrentSession();
    if (authData) {
      setCurrentUser(authData.user);
      setCurrentSession(authData.session);

      // Check client-side biometric lock (only once per browser session, never loops)
      if (hasLocalBiometricLock() && sessionStorage.getItem('soozan_biometric_unlocked') !== 'true') {
        setIsBiometricLocked(true);
      }
    } else {
      setCurrentUser(null);
      setCurrentSession(null);
      setIsBiometricLocked(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const handleLogout = () => {
    terminateCurrentSession();
    try {
      localStorage.removeItem('soozan_active_tab');
      sessionStorage.removeItem('soozan_biometric_unlocked');
    } catch {
      // ignore
    }
    refreshSession();
    setActiveTab('home');
    setShowScannerTester(false);
  };

  const handleAllSessionsTerminated = () => {
    try {
      localStorage.removeItem('soozan_active_tab');
      sessionStorage.removeItem('soozan_biometric_unlocked');
    } catch {
      // ignore
    }
    refreshSession();
    setShowSessionsModal(false);
    setActiveTab('home');
    setShowScannerTester(false);
  };

  const handleOpenScannerTester = () => {
    setShowScannerTester(true);
    handleNavigate('home');
  };

  // Bulletproof View Renderer - Guaranteed NEVER to return null or render a blank black screen
  const renderCurrentView = () => {
    // 1. Public tabs available without authentication
    if (activeTab === 'manage_code') {
      return <ManageCodeView />;
    }
    if (activeTab === 'receive_file') {
      return <ReceiveFileView />;
    }

    // 2. Protected tabs requiring authentication
    if (!currentUser) {
      return (
        <div className="flex-1 flex items-center justify-center py-6 px-4">
          <AuthView
            onAuthSuccess={() => {
              refreshSession();
            }}
          />
        </div>
      );
    }

    // 3. Authenticated Views
    if (activeTab === 'profile') {
      return (
        <ProfileView
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      );
    }

    if (activeTab === 'settings') {
      return (
        <SettingsView
          user={currentUser}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            refreshSession();
          }}
          onAccountDeleted={handleLogout}
          onLogout={handleLogout}
        />
      );
    }

    // Default / Home View: Scanner Tester or Sender Dashboard
    if (showScannerTester) {
      return (
        <div className="space-y-4">
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <button
              type="button"
              onClick={() => setShowScannerTester(false)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به پیشخوان اصلی</span>
            </button>
          </div>
          <MalwareScannerTester userId={currentUser.id} />
        </div>
      );
    }

    // Resilient fallback session if currentSession is ever pending
    const safeSession: Session = currentSession || {
      id: `ses_active_${Date.now()}`,
      userId: currentUser.id,
      token: 'soozan_session_token',
      deviceName: 'دستگاه امن جاری',
      deviceType: 'mobile',
      ipAddress: '185.190.144.100',
      isTrusted: true,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + 86400000 * 14,
    };

    return (
      <SenderDashboard
        user={currentUser}
        currentSession={safeSession}
        onOpenAudit={() => setShowAuditModal(true)}
        onOpenWizard={() => setShowWizard(true)}
        onOpenScanner={handleOpenScannerTester}
      />
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden">
      {/* Top Header with Hamburger Menu and Brand Logo */}
      <Header
        user={currentUser}
        onOpenMenu={() => setIsSideMenuOpen(true)}
      />

      {/* Side Navigation Drawer (Matches Screenshot 2) */}
      <SideDrawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        user={currentUser}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenWizard={() => {
          if (!currentUser) {
            setActiveTab('home');
          } else {
            setShowWizard(true);
          }
        }}
        onOpenGuardian={() => setShowGuardianModal(true)}
        onOpenAudit={() => setShowAuditModal(true)}
        onOpenResilience={() => setShowResilienceModal(true)}
        onOpenHelp={() => setShowHelpCenterModal(true)}
        onOpenPricing={() => setShowPricingModal(true)}
        onOpenSessions={() => setShowSessionsModal(true)}
        onLogout={handleLogout}
      />

      {/* Web View Compliance Notice Modal (Section 5.2 & Golden Scenario 6) */}
      <WebNoticeModal />

      {/* Local Biometric Lock Overlay (Section 4.5 & rules/10) */}
      {isBiometricLocked && (
        <BiometricLockModal
          onUnlocked={() => {
            try {
              sessionStorage.setItem('soozan_biometric_unlocked', 'true');
            } catch {
              // ignore
            }
            setIsBiometricLocked(false);
          }}
          onFallbackToFullLogin={handleLogout}
        />
      )}

      {/* Main Content Area with safe clearance above docked bottom bar */}
      <main className="flex-1 w-full max-w-full min-w-0 flex flex-col overflow-x-hidden pb-24 sm:pb-28">
        {renderCurrentView()}
      </main>

      {/* Docked Bottom Navigation Bar with Elevated Center Hero Button */}
      <FloatingNavBar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
      />

      {/* File Share 6-Step Wizard Modal */}
      {showWizard && currentUser && (
        <FileShareWizard
          userId={currentUser.id}
          onClose={() => setShowWizard(false)}
          onSuccessDone={() => {
            setShowWizard(false);
            refreshSession();
          }}
        />
      )}

      {/* Security Audit Modal (Live Phase 1 & 2 Verification) */}
      {showAuditModal && (
        <SecurityAuditModal onClose={() => setShowAuditModal(false)} />
      )}

      {/* Phase 6: Guardian & Macro Health Panel Modal */}
      {showGuardianModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex items-start justify-center">
          <div className="w-full max-w-6xl my-auto">
            <GuardianPanel onClose={() => setShowGuardianModal(false)} />
          </div>
        </div>
      )}

      {/* Sessions Manager Standalone Modal */}
      {showSessionsModal && currentUser && currentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <SessionsManager
              user={currentUser}
              currentSessionId={currentSession.id}
              onSessionRevoked={refreshSession}
              onAllTerminated={handleAllSessionsTerminated}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSessionsModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 7: Resilience & 3-2-1 Disaster Recovery Modal */}
      {showResilienceModal && (
        <ResilienceModal onClose={() => setShowResilienceModal(false)} />
      )}

      {/* Phase 7: Help Center & Interactive Tour Modal */}
      {showHelpCenterModal && (
        <HelpCenterModal
          onClose={() => setShowHelpCenterModal(false)}
          onStartWizard={() => {
            setShowHelpCenterModal(false);
            if (currentUser) {
              setShowWizard(true);
            } else {
              setActiveTab('home');
            }
          }}
        />
      )}

      {/* Phase 7: Pricing & Security Plans Modal */}
      {showPricingModal && (
        <PricingModal onClose={() => setShowPricingModal(false)} />
      )}
    </div>
  );
}
