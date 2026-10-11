import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { StorageStatsCards } from '../components/dashboard/StorageStatsCards';
import { FileList } from '../components/files/FileList';
import { StorageView } from '../components/dashboard/StorageView';
import { FileUploadModal } from '../components/files/FileUploadModal';
import { ProfileModal } from '../components/profile/ProfileModal';
import { SettingsModal } from '../components/settings/SettingsModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export function DashboardPage() {
  const { signOutUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'storage'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      toast.info('You have been signed out.');
    } catch (e) {
      toast.error('Error signing out.');
    } finally {
      setIsSigningOut(false);
      setIsSignOutConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSignOutConfirm={() => setIsSignOutConfirmOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Responsive Navbar / Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenSignOutConfirm={() => setIsSignOutConfirmOpen(true)}
        />

        {/* Dashboard Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {/* Storage Overview Stats Cards */}
          <StorageStatsCards />

          {/* Tab View: Files vs Storage */}
          {activeTab === 'files' ? (
            <FileList onOpenUploadModal={() => setIsUploadModalOpen(true)} />
          ) : (
            <StorageView onOpenUploadModal={() => setIsUploadModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenSignOutConfirm={() => setIsSignOutConfirmOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSignOutConfirmOpen}
        onClose={() => setIsSignOutConfirmOpen(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of SyncFile? In accordance with tab-session persistence, closing or signing out ends your authenticated session."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        isDestructive={false}
        isLoading={isSigningOut}
      />
    </div>
  );
}

