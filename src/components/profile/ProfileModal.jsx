import React, { useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  HardDrive,
  LogOut,
  ShieldCheck,
  GraduationCap,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { useToast } from '../../context/ToastContext';
import {
  formatBytes,
  formatDate,
  calculateStoragePercentage,
  TOTAL_QUOTA_BYTES,
} from '../../utils/formatters';
import { ProgressBar } from '../common/ProgressBar';

export function ProfileModal({ isOpen, onClose, onOpenSignOutConfirm }) {
  const { user, userProfile, resendVerificationEmail } = useAuth();
  const { rawFilesCount, totalStorageUsedBytes, remainingStorageBytes } = useFiles();
  const toast = useToast();

  const [isSendingVerification, setIsSendingVerification] = useState(false);

  if (!user) return null;

  const usagePercent = calculateStoragePercentage(totalStorageUsedBytes, TOTAL_QUOTA_BYTES);
  const displayName = userProfile?.displayName || user.displayName || 'Student';
  const email = userProfile?.email || user.email || 'No email provided';
  const photoURL = userProfile?.photoURL || user.photoURL;
  const createdAt = userProfile?.createdAt || user.metadata?.creationTime;

  const isEmailVerified = user.emailVerified || userProfile?.emailVerified;
  const isStudentVerified = userProfile?.isStudentVerified || false;
  const hasPasswordSet = userProfile?.hasPasswordSet || user.providerData?.some((p) => p.providerId === 'password');
  const hasGoogleLinked = user.providerData?.some((p) => p.providerId === 'google.com');

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (e) {
      toast.error(e.message || 'Could not send verification email.');
    } finally {
      setIsSendingVerification(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Profile" maxWidth="max-w-md">
      <div>
        {/* User Card */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
          <div className="relative mb-3">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl border-4 border-white shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className={`absolute -bottom-1 -right-1 p-1 rounded-full shadow-xs text-white ${
                isStudentVerified ? 'bg-indigo-600' : 'bg-amber-500'
              }`}
              title={isStudentVerified ? 'Verified Student' : 'Verification Pending'}
            >
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900">{displayName}</h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {email}
          </p>

          {/* Verification & Provider Badges */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {/* Student Status Badge */}
            {isStudentVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold">
                <GraduationCap className="w-3 h-3" />
                Verified Student
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[11px] font-semibold">
                <AlertTriangle className="w-3 h-3" />
                Student Verification: Pending
              </span>
            )}

            {/* Email Verified Badge */}
            {isEmailVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium">
                Email Unverified
              </span>
            )}
          </div>

          {/* Linked Methods row */}
          <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span>Sign-in methods:</span>
            {hasGoogleLinked && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                Google
              </span>
            )}
            {hasPasswordSet && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                Password
              </span>
            )}
          </div>

          {/* Resend Verification notice if unverified */}
          {!isEmailVerified && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-left w-full text-[11px] text-amber-800 flex items-center justify-between gap-2">
              <span className="leading-tight">
                Please verify your university email for account recovery.
              </span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSendingVerification}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-semibold text-amber-900 hover:bg-amber-100/50 flex-shrink-0 disabled:opacity-50 transition-colors"
              >
                {isSendingVerification ? 'Sending...' : 'Resend'}
              </button>
            </div>
          )}
        </div>

        {/* Storage Details Section */}
        <div className="py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              Account Storage Quota
            </span>
            <span className="text-xs font-bold text-slate-900">
              {usagePercent}%
            </span>
          </div>

          <ProgressBar percentage={usagePercent} size="md" />

          <div className="grid grid-cols-2 gap-3 mt-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Used Storage</span>
              <strong className="text-slate-900 font-semibold text-sm">
                {formatBytes(totalStorageUsedBytes)}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Remaining</span>
              <strong className="text-slate-900 font-semibold text-sm">
                {formatBytes(remainingStorageBytes)}
              </strong>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Total Account Limit:</span>
            <strong>20.00 MB</strong>
          </div>
        </div>

        {/* Account Metadata */}
        <div className="py-3.5 space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Member Since
            </span>
            <span className="text-slate-700 font-medium">
              {formatDate(createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total Stored Files</span>
            <span className="text-slate-700 font-medium">
              {rawFilesCount}
            </span>
          </div>
        </div>

        {/* Sign Out CTA */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSignOutConfirm();
            }}
            className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of SyncFile
          </button>
        </div>
      </div>
    </Modal>
  );
}
