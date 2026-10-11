import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calculatePasswordStrength } from '../utils/securityValidators';

export function SecureAccountPage() {
  const { user, linkPasswordToAccount, skipPasswordSetup, authError, setAuthError } = useAuth();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const passwordStrength = calculatePasswordStrength(password);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (setAuthError) setAuthError(null);

    // Validations
    if (!password) {
      setLocalError('Please create a password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await linkPasswordToAccount(password);
      toast.success('Password linked successfully! You can now sign in using Google or your password.');
    } catch (err) {
      // Error handled by AuthContext and displayed
      setLocalError(err.message || 'Could not link password to your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    skipPasswordSetup();
    toast.info('Password setup skipped for this session. You can set it anytime in Settings.');
  };

  const displayError = localError || authError;

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden select-none">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-100/60 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Logo */}
      <header className="flex justify-center pt-2">
        <Logo size="large" showTagline={false} />
      </header>

      {/* Centered Secure Account Card */}
      <div className="w-full max-w-md mx-auto my-auto">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-7 sm:p-9 relative animate-in fade-in zoom-in-95 duration-200">
          {/* Card Header Icon & Titles */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Secure Your Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm">
              Set a SyncFile password to enable signing in with either Google or your email address.
            </p>
          </div>

          {/* Authenticated Account Info Box */}
          <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="truncate">
                <span className="text-[11px] text-slate-400 block font-medium">Google Account</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {user?.email || 'Authenticated User'}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>

          {/* Error Message Alert */}
          {displayError && (
            <div
              role="alert"
              className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-snug">
                <strong>Notice:</strong> {displayError}
              </div>
            </div>
          )}

          {/* Password Setup Form */}
          <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
            {/* Create Password */}
            <div>
              <label
                htmlFor="setup-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="setup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300 rounded-full`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                    <span>Password Strength:</span>
                    <span className="font-bold">{passwordStrength.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="setup-confirm-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="setup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Linking Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set Password & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Skip for Now
              </button>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Credentials managed securely by Firebase Authentication.</span>
          </div>
        </div>
      </div>

      {/* Subtle Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        <p className="text-[11px] text-slate-400">
          SyncFile &copy; {new Date().getFullYear()} — Your files. Anywhere. Anytime.
        </p>
      </footer>
    </main>
  );
}

