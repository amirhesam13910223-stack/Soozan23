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
  const [activeTab, setActiveTab] = useState<NavTab>('home');
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

  // Initial session resolution
  const refreshSession = () => {
    const authData = getCurrentSession();
    if (authData) {
      setCurrentUser(authData.user);
      setCurrentSession(authData.session);

      // Check client-side biometric lock
      if (hasLocalBiometricLock()) {
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
    refreshSession();
    setActiveTab('home');
    setShowScannerTester(false);
  };

  const handleAllSessionsTerminated = () => {
    refreshSession();
    setShowSessionsModal(false);
    setActiveTab('home');
    setShowScannerTester(false);
  };

  const handleOpenScannerTester = () => {
    setShowScannerTester(true);
    setActiveTab('home');
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
        onNavigate={(tab) => {
          setActiveTab(tab);
          setShowScannerTester(false);
        }}
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
          onUnlocked={() => setIsBiometricLocked(false)}
          onFallbackToFullLogin={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col overflow-x-hidden">
        {/* View Router */}
        {!currentUser && activeTab === 'home' ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <AuthView
              onAuthSuccess={() => {
                refreshSession();
              }}
            />
          </div>
        ) : activeTab === 'home' && currentUser && currentSession ? (
          showScannerTester ? (
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
          ) : (
            <SenderDashboard
              user={currentUser}
              currentSession={currentSession}
              onOpenAudit={() => setShowAuditModal(true)}
              onOpenWizard={() => setShowWizard(true)}
              onOpenScanner={handleOpenScannerTester}
            />
          )
        ) : activeTab === 'manage_code' ? (
          <ManageCodeView />
        ) : activeTab === 'receive_file' ? (
          <ReceiveFileView />
        ) : activeTab === 'profile' && currentUser ? (
          <ProfileView
            user={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
            onLogout={handleLogout}
          />
        ) : activeTab === 'settings' && currentUser ? (
          <SettingsView
            user={currentUser}
            onUserUpdated={(updatedUser) => {
              setCurrentUser(updatedUser);
              refreshSession();
            }}
            onAccountDeleted={handleLogout}
            onLogout={handleLogout}
          />
        ) : null}
      </main>

      {/* Floating Capsule Navigation Bar (Adhering strictly to 03-DESIGN.md & refs/nav-reference.png) */}
      <FloatingNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setShowScannerTester(false);
        }}
        onOpenWizard={() => {
          if (!currentUser) {
            setActiveTab('home');
          } else {
            setShowWizard(true);
          }
        }}
        isAppMode={true}
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
