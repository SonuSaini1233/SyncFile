import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { FileProvider } from './context/FileContext';
import { LoginPage } from './pages/LoginPage';
import { SecureAccountPage } from './pages/SecureAccountPage';
import { DashboardPage } from './pages/DashboardPage';
import { Logo } from './components/common/Logo';

function AppContent() {
  const { user, loading, needsPasswordSetup } = useAuth();

  // Full-screen loading state while authentication status is resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="mb-6 animate-pulse">
          <Logo size="large" showTagline={false} />
        </div>
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-800">
          Connecting to SyncFile...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Securing your private files & quota
        </p>
      </div>
    );
  }

  // Not authenticated: always show the minimal login card first
  if (!user) {
    return <LoginPage />;
  }

  // First-time Google user or user needing password setup (Section 8)
  if (needsPasswordSetup) {
    return <SecureAccountPage />;
  }

  // Authenticated student: provide FileContext and render Dashboard
  return (
    <FileProvider>
      <DashboardPage />
    </FileProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
