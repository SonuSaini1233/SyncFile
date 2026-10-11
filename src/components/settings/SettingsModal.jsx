import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Database,
  ExternalLink,
  Laptop,
  Check,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { formatBytes, TOTAL_QUOTA_BYTES } from '../../utils/formatters';
import { reconcileStorageUsage } from '../../services/quotaService';
import { useToast } from '../../context/ToastContext';

export function SettingsModal({ isOpen, onClose }) {
  const { user, userProfile, isConfigured, linkPasswordToAccount } = useAuth();
  const { totalStorageUsedBytes } = useFiles();
  const toast = useToast();

  const [isReconciling, setIsReconciling] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const hasPasswordSet = userProfile?.hasPasswordSet || user?.providerData?.some((p) => p.providerId === 'password');

  const handleAuditStorage = async () => {
    if (!user) return;
    setIsReconciling(true);
    try {
      const reconciled = await reconcileStorageUsage(user.uid);
      toast.success(`Storage verified: ${formatBytes(reconciled)} currently used.`);
    } catch (e) {
      toast.error('Could not run storage audit.');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsLinking(true);
    try {
      await linkPasswordToAccount(newPassword);
      toast.success('Password set successfully! You can now log in with either Google or your password.');
      setShowPasswordSetup(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Could not link password.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SyncFile Settings & Security" maxWidth="max-w-xl">
      <div className="space-y-5 text-xs text-slate-600">
        
        {/* Authentication Methods & Password Management */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Sign-In & Security Methods
            </span>
            {hasPasswordSet ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                Both Login Methods Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                Google Only
              </span>
            )}
          </div>

          <p className="text-slate-500 leading-relaxed">
            SyncFile allows signing in with Google OAuth and Email/Password interchangeably for the same account.
          </p>

          {!hasPasswordSet && !showPasswordSetup && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPasswordSetup(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Set SyncFile Password
              </button>
            </div>
          )}

          {showPasswordSetup && (
            <form onSubmit={handleSetPassword} className="pt-2 border-t border-slate-200 space-y-2.5">
              <h5 className="font-bold text-slate-800 text-xs">Link a Password to {user?.email}</h5>
              
              {passwordError && (
                <p className="text-rose-600 text-[11px] leading-tight">{passwordError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isLinking}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLinking ? 'Linking...' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordSetup(false)}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Storage Limit & Policy */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-slate-500" />
              Strict Storage Quota
            </span>
            <span className="font-mono text-slate-800 font-semibold">
              {formatBytes(totalStorageUsedBytes)} / {formatBytes(TOTAL_QUOTA_BYTES)}
            </span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Every student account is granted exactly 20 MB of total combined cloud storage. Quota is enforced securely through atomic database transactions and Firebase Cloud Storage rules.
          </p>
          {isConfigured && (
            <button
              type="button"
              onClick={handleAuditStorage}
              disabled={isReconciling}
              className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
              Re-verify storage usage from cloud files
            </button>
          )}
        </div>

        {/* Multi-Device Cloud Sync */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
            <Laptop className="w-4 h-4 text-slate-500" />
            <span>Multi-Device Synchronization</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            All files are stored in Google Cloud Storage with real-time Firestore listeners. You can upload a lecture on your laptop and download it on your mobile device immediately.
          </p>
        </div>

        {/* Security & Access Rules */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Private Storage Partitioning</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Your files are stored in private paths (<code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700 font-mono text-[11px]">users/{'{userId}'}/files/</code>). Firebase Storage & Firestore Security Rules strictly prohibit other users from accessing your files.
          </p>
        </div>
      </div>
    </Modal>
  );
}
