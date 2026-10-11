import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  User,
  Settings,
  LogOut,
  ChevronDown,
  HardDrive,
  Menu,
  X,
  FolderClosed,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { formatBytes, TOTAL_QUOTA_BYTES, calculateStoragePercentage } from '../../utils/formatters';

export function Navbar({
  onOpenUploadModal,
  onOpenProfile,
  onOpenSettings,
  onOpenSignOutConfirm,
  activeTab,
  setActiveTab,
}) {
  const { user, userProfile } = useAuth();
  const { totalStorageUsedBytes } = useFiles();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = userProfile?.displayName || user?.displayName || 'Student';
  const email = userProfile?.email || user?.email || '';
  const photoURL = userProfile?.photoURL || user?.photoURL;
  const firstName = displayName.split(' ')[0] || 'Student';
  const usagePercent = calculateStoragePercentage(totalStorageUsedBytes, TOTAL_QUOTA_BYTES);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile Logo & Hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo />
        </div>

        {/* Desktop Greeting Header */}
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hello, {firstName}</span>
            <span className="inline-block animate-wiggle">👋</span>
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Your personal cloud storage.
          </p>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Upload Button */}
          <button
            type="button"
            id="header-upload-btn"
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload File</span>
            <span className="sm:hidden">Upload</span>
          </button>

          {/* Profile Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full sm:rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden"
              aria-expanded={dropdownOpen}
              aria-label="User account menu"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs sm:text-sm border border-indigo-200">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block mr-1" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info snippet */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {email}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <HardDrive className="w-3 h-3 text-indigo-600" />
                      Storage
                    </span>
                    <strong className="text-slate-900">
                      {formatBytes(totalStorageUsedBytes)} ({usagePercent}%)
                    </strong>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>View Student Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings & Security</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenSignOutConfirm();
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('files');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'files' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
            }`}
          >
            <FolderClosed className="w-4 h-4" />
            <span>My Files</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('storage');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              activeTab === 'storage' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Storage Allocation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenProfile();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSignOutConfirm();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
