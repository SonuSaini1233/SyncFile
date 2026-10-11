import { MAX_SINGLE_FILE_BYTES, TOTAL_QUOTA_BYTES, formatBytes } from './formatters';

/**
 * Validates a file before upload attempt
 * @param {File} file 
 * @param {number} currentUsedBytes 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileUpload(file, currentUsedBytes = 0) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check individual file size limit (20 MB)
  if (file.size > MAX_SINGLE_FILE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the 20 MB single file limit (${formatBytes(file.size)}).`,
    };
  }

  // Zero-byte files check
  if (file.size === 0) {
    return {
      valid: false,
      error: `"${file.name}" is an empty file (0 bytes) and cannot be uploaded.`,
    };
  }

  // Check aggregate quota limit (20 MB total)
  const projectedTotal = currentUsedBytes + file.size;
  if (projectedTotal > TOTAL_QUOTA_BYTES) {
    const remaining = Math.max(0, TOTAL_QUOTA_BYTES - currentUsedBytes);
    return {
      valid: false,
      error: `Not enough storage available. Delete a file to free up space. You have ${formatBytes(remaining)} remaining, but this file is ${formatBytes(file.size)}.`,
    };
  }

  // Check filename length
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'File name is too long (maximum 255 characters).',
    };
  }

  return { valid: true };
}

/**
 * Maps raw Firebase authentication & storage errors to friendly student-readable messages.
 * Prevents raw stack traces and internal Firebase messages from being shown to users.
 * @param {Error | Object} error 
 * @returns {string}
 */
export function getFriendlyErrorMessage(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';

  // Auth errors
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled. The Google popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for SyncFile.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in window can be open at a time.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection and retry.';
    case 'auth/user-disabled':
      return 'This student account has been disabled. Please contact support.';
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found':
      return 'SyncFile is awaiting Firebase project setup. Please check your environment configuration.';
    case 'auth/unauthorized-domain':
      return 'This web domain is not authorized in the Firebase Authentication console.';
    case 'auth/requires-recent-login':
      return 'For your security, please sign in again before completing this operation.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Try signing in with Google or your password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account was found with this email address. Please check your spelling or create an account.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in your Firebase Console. Please open Firebase Console > Authentication > Sign-in method and enable the Email/Password provider.';
    case 'auth/provider-already-linked':
      return 'This account is already linked with a password.';
    case 'auth/credential-already-in-use':
      return 'This email or credential is already associated with another student account.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in credentials. Please sign in with Google.';
    case 'auth/too-many-requests':
      return 'Access temporarily restricted due to many failed login attempts. Please reset your password or try again later.';
    case 'storage/unauthorized':
    case 'permission-denied':
      return 'Access denied. You do not have permission to perform this file action.';
    case 'storage/canceled':
      return 'Upload was cancelled.';
    case 'storage/quota-exceeded':
      return 'Storage quota exceeded. Please delete some existing files to free up space.';
    case 'storage/object-not-found':
      return 'The requested file could not be found in storage. It may have already been deleted.';
    case 'storage/bucket-not-found':
      return 'Firebase Storage has not been initialized yet. Please go to Firebase Console > Storage and click "Get Started".';
    case 'storage/retry-limit-exceeded':
      return 'Operation timed out due to unstable network. Please retry.';
    default:
      if (message.includes('bucket') || message.includes('Requested entity was not found')) {
        return 'Firebase Storage has not been initialized yet. Please go to Firebase Console > Storage and click "Get Started".';
      }
      if (message.includes('database (default) does not exist')) {
        return 'Connecting to your custom Firestore database. Please refresh the page.';
      }
      if (message.includes('quota') || message.includes('Storage')) {
        return message;
      }
      if (message.includes('network') || message.includes('offline')) {
        return 'Network error encountered. Please check your connection.';
      }
      return error.message || 'Something went wrong. Please refresh the page or try again in a few moments.';
  }
}

/**
 * Calculates password strength score (0-4) and metadata
 * @param {string} password 
 * @returns {{ score: number, label: string, color: string, width: string }}
 */
export function calculatePasswordStrength(password = '') {
  if (!password) {
    return { score: 0, label: 'None', color: 'bg-slate-200', width: 'w-0' };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Normalized score 1 - 4
  const normalized = Math.min(4, Math.max(1, score));

  switch (normalized) {
    case 1:
      return { score: 1, label: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    case 2:
      return { score: 2, label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    case 3:
      return { score: 3, label: 'Good', color: 'bg-indigo-500', width: 'w-3/4' };
    case 4:
      return { score: 4, label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
    default:
      return { score: 0, label: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
  }
}

/**
 * Checks whether an email belongs to an educational institution (.edu, etc.)
 * @param {string} email 
 * @returns {boolean}
 */
export function isEducationalEmail(email = '') {
  if (!email || typeof email !== 'string') return false;
  const lower = email.trim().toLowerCase();
  return (
    lower.endsWith('.edu') ||
    lower.endsWith('.ac.uk') ||
    lower.endsWith('.edu.au') ||
    lower.endsWith('.edu.in') ||
    lower.endsWith('.edu.sg') ||
    lower.endsWith('.edu.ca') ||
    lower.includes('.edu.')
  );
}

