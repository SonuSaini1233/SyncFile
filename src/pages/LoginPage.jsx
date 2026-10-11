import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  ArrowLeft,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PrivacyModal, TermsModal } from '../components/common/LegalModals';
import { calculatePasswordStrength } from '../utils/securityValidators';

export function LoginPage() {
  const {
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    loading,
    authError,
    setAuthError,
  } = useAuth();
  const toast = useToast();

  // View state: 'login' | 'register' | 'forgot-password'
  const [viewMode, setViewMode] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot password form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSentSuccess, setResetSentSuccess] = useState(false);

  // Action / loading state
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const passwordStrength = calculatePasswordStrength(regPassword);

  const switchView = (mode) => {
    setViewMode(mode);
    setLocalError('');
    if (setAuthError) setAuthError(null);
    setResetSentSuccess(false);
  };

  /**
   * Handle Google OAuth Sign In
   */
  const handleGoogleSignIn = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLocalError('');
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google successfully!');
    } catch (err) {
      // Handled by AuthContext and displayed
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle Email & Password Sign In
   */
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setLocalError('');
    if (setAuthError) setAuthError(null);

    // Validation
    if (!loginEmail.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(loginEmail.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsProcessing(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
      toast.success('Welcome back to SyncFile!');
    } catch (err) {
      setLocalError(err.message || 'Incorrect email or password.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle New Student Registration
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setLocalError('');
    if (setAuthError) setAuthError(null);

    // Form validations
    if (!regName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(regEmail.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!regPassword) {
      setLocalError('Please create a password.');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setLocalError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await registerWithEmail(regName, regEmail, regPassword);
      toast.success('Account created successfully!');
      if (res?.emailVerificationSent) {
        toast.info(`A verification email was sent to ${regEmail.trim()}. Please verify your address.`, 6000);
      }
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle Password Reset
   */
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setLocalError('');
    if (setAuthError) setAuthError(null);
    setResetSentSuccess(false);

    if (!resetEmail.trim()) {
      setLocalError('Please enter your registered student email.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    setIsProcessing(true);
    try {
      await sendPasswordReset(resetEmail);
      setResetSentSuccess(true);
      toast.success('Reset link dispatched! Check your email inbox.');
    } catch (err) {
      setLocalError(err.message || 'Could not send reset email.');
    } finally {
      setIsProcessing(false);
    }
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

      {/* Centered Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-7 sm:p-9 relative transition-all duration-200">
          
          {/* ============================================================== */}
          {/* 1. LOGIN VIEW */}
          {/* ============================================================== */}
          {viewMode === 'login' && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                  Welcome back!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs">
                  Sign in to access your files securely.
                </p>
              </div>

              {/* Error Message */}
              {displayError && (
                <div
                  role="alert"
                  className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <div className="leading-snug">
                    <strong>Notice:</strong> {displayError}
                  </div>
                </div>
              )}

              {/* Google Sign-In Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80 text-slate-800 text-sm font-semibold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 group disabled:opacity-60 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      {/* Google 'G' Logo SVG */}
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.35 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                    or sign in with email
                  </span>
                </div>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                {/* Email input */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="student@university.edu"
                      disabled={isProcessing}
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot-password')}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isProcessing}
                      autoComplete="current-password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In CTA */}
                <button
                  type="submit"
                  id="btn-sign-in-email"
                  disabled={isProcessing}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* Create Account Link */}
              <div className="mt-5 text-center text-xs text-slate-500">
                <span>New to SyncFile? </span>
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Create an account
                </button>
              </div>

              {/* Privacy Note */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center">
                <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Your files are private and accessible only to you.</span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. CREATE ACCOUNT / REGISTRATION VIEW */}
          {/* ============================================================== */}
          {viewMode === 'register' && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Create your account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs">
                  Get your free 20 MB cloud storage for university files.
                </p>
              </div>

              {/* Error Message */}
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

              {/* Google One-Click Register */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80 text-slate-800 text-xs sm:text-sm font-semibold shadow-xs transition-all duration-200 flex items-center justify-center gap-2.5 group disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2.5 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                    or register with email
                  </span>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Alex Morgan"
                      disabled={isProcessing}
                      autoComplete="name"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@university.edu"
                      disabled={isProcessing}
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      disabled={isProcessing}
                      autoComplete="new-password"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Password strength feedback */}
                  {regPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300 rounded-full`}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>Strength:</span>
                        <span className="font-bold">{passwordStrength.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="reg-confirm-password"
                    className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-confirm-password"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      disabled={isProcessing}
                      autoComplete="new-password"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Register */}
                <button
                  type="submit"
                  id="btn-create-account"
                  disabled={isProcessing}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              {/* Sign In Link */}
              <div className="mt-4 text-center text-xs text-slate-500">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. FORGOT PASSWORD VIEW */}
          {/* ============================================================== */}
          {viewMode === 'forgot-password' && (
            <div className="animate-in fade-in duration-200">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Reset your password
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs">
                  Enter your registered student email to receive a password reset link.
                </p>
              </div>

              {/* Error Message */}
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

              {/* Success Message */}
              {resetSentSuccess ? (
                <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Reset Email Dispatched!
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    We sent a password reset link to <strong className="text-slate-800">{resetEmail}</strong>. Please check your inbox and spam folder.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => switchView('login')}
                      className="px-4 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50/50 shadow-2xs transition-colors"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="student@university.edu"
                        disabled={isProcessing}
                        autoComplete="email"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-send-reset-link"
                    disabled={isProcessing}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => switchView('login')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Storage Quota Hint */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Free 20 MB personal storage for every verified student
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Footer with Legal Links */}
      <footer className="text-center py-4 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="hover:text-slate-600 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="hover:text-slate-600 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          SyncFile &copy; {new Date().getFullYear()} — Your files. Anywhere. Anytime.
        </p>
      </footer>

      {/* Legal Modals */}
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </main>
  );
}
