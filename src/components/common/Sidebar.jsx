import React from 'react';
import {
  FolderClosed,
  UploadCloud,
  HardDrive,
  Settings,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { formatBytes } from '../../utils/formatters';

export function Sidebar({
  activeTab,
  setActiveTab,
  onOpenUploadModal,
  onOpenProfile,
  onOpenSettings,
  onOpenSignOutConfirm,
}) {
  const { user, userProfile } = useAuth();
  const { rawFilesCount, totalStorageUsedBytes } = useFiles();

  const displayName = userProfile?.displayName || user?.displayName || 'Student';
  const email = userProfile?.email || user?.email || '';
  const photoURL = userProfile?.photoURL || user?.photoURL;

  const navItems = [
    {
      id: 'files',
      label: 'My Files',
      icon: FolderClosed,
      badge: rawFilesCount > 0 ? rawFilesCount : null,
      onClick: () => setActiveTab('files'),
    },
    {
      id: 'upload',
      label: 'Upload Files',
      icon: UploadCloud,
      highlight: true,
      onClick: onOpenUploadModal,
    },
    {
      id: 'storage',
      label: 'Storage',
      icon: HardDrive,
      badgeText: formatBytes(totalStorageUsedBytes),
      onClick: () => setActiveTab('storage'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: onOpenSettings,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-screen p-5 select-none justify-between">
      {/* Brand Header */}
      <div>
        <div className="pb-6 border-b border-slate-100">
          <Logo showTagline={true} />
        </div>

        {/* Primary Navigation */}
        <nav className="mt-6 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 shadow-2xs'
                    : item.highlight
                    ? 'text-indigo-600 hover:bg-indigo-50/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive || item.highlight ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge !== null && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {item.badge}
                  </span>
                )}

                {item.badgeText && (
                  <span className="text-[10px] font-medium text-slate-400">
                    {item.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card at Bottom */}
      <div className="pt-4 border-t border-slate-100">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {email}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSignOutConfirm();
            }}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
