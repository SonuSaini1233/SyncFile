const assert = require('assert');

// 1. Quota Constants
const TOTAL_QUOTA_BYTES = 20 * 1024 * 1024; // 20,971,520 bytes
const MAX_SINGLE_FILE_BYTES = 20 * 1024 * 1024;

console.log('--- RUNNING SYNCFILE TEST SUITE ---');

// Test 1: Quota byte integrity
console.log('Test 1: Verify 20 MB integer byte calculations');
assert.strictEqual(TOTAL_QUOTA_BYTES, 20971520, '20 MB must be exactly 20,971,520 integer bytes');
assert.strictEqual(MAX_SINGLE_FILE_BYTES, 20971520, 'Max single file size must be exactly 20,971,520 integer bytes');
console.log('✓ PASS: Exact integer byte constants verified');

// Test 2: File size & Quota validation logic
console.log('\nTest 2: File size and aggregate quota validation logic');
function validateFileUpload(file, currentUsedBytes = 0) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (file.size > MAX_SINGLE_FILE_BYTES) {
    return { valid: false, error: 'Exceeds 20 MB single file limit' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'Empty file' };
  }
  const projectedTotal = currentUsedBytes + file.size;
  if (projectedTotal > TOTAL_QUOTA_BYTES) {
    return { valid: false, error: 'Not enough storage available. Delete a file to free up space.' };
  }
  return { valid: true };
}

// 2a. Valid file under quota
const fileA = { name: 'Lecture1.pdf', size: 5 * 1024 * 1024 }; // 5 MB
const resA = validateFileUpload(fileA, 0);
assert.strictEqual(resA.valid, true, '5 MB file should be accepted on empty quota');

// 2b. File exceeding single file limit (e.g. 21 MB)
const fileTooLarge = { name: 'GiantVideo.mov', size: 21 * 1024 * 1024 };
const resTooLarge = validateFileUpload(fileTooLarge, 0);
assert.strictEqual(resTooLarge.valid, false, 'File larger than 20 MB must be rejected');

// 2c. Combined quota scenario from prompt:
// File A: 8 MB, File B: 7 MB, File C: 5 MB -> Total 20 MB
// Attempting File D: 1 MB -> Must be rejected with exact error message!
const used20MB = (8 + 7 + 5) * 1024 * 1024;
const fileD = { name: 'ExtraDoc.docx', size: 1 * 1024 * 1024 };
const resD = validateFileUpload(fileD, used20MB);
assert.strictEqual(resD.valid, false, 'Exceeding aggregate 20 MB must be rejected');
assert.strictEqual(resD.error, 'Not enough storage available. Delete a file to free up space.');
console.log('✓ PASS: 20 MB aggregate quota enforcement correctly rejects excess uploads');

// Test 3: Non-negative storage usage on deletion
console.log('\nTest 3: Storage deletion non-negative clamp');
function calculateNewStorageAfterDelete(currentUsed, deletedSize) {
  return Math.max(0, currentUsed - deletedSize);
}
assert.strictEqual(calculateNewStorageAfterDelete(5000, 2000), 3000);
assert.strictEqual(calculateNewStorageAfterDelete(2000, 5000), 0, 'Storage must never be negative');
console.log('✓ PASS: Deletion safely clamped to non-negative byte count');

// Test 4: Path Sanitization (Directory Traversal prevention)
console.log('\nTest 4: Filename sanitization against directory traversal');
function sanitizeFileName(fileName) {
  if (!fileName) return 'unnamed_file';
  return fileName
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .trim()
    .slice(0, 180);
}
const maliciousName = '../../etc/passwd.pdf';
const sanitized = sanitizeFileName(maliciousName);
assert.strictEqual(sanitized, '.._.._etc_passwd.pdf', 'Slashes must be converted to underscores');
assert.ok(!sanitized.includes('/'), 'Must not contain forward slashes');
assert.ok(!sanitized.includes('\\'), 'Must not contain backslashes');
console.log('✓ PASS: Filename sanitization prevents directory traversal attacks');

// Test 5: Friendly error mapper
console.log('\nTest 5: Friendly error mapper replaces cryptic stack traces');
function getFriendlyErrorMessage(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';
  if (code === 'auth/popup-closed-by-user') return 'Sign-in cancelled. The Google popup was closed before completing.';
  if (code === 'auth/popup-blocked') return 'The sign-in popup was blocked by your browser. Please allow popups for SyncFile.';
  if (code === 'storage/quota-exceeded') return 'Storage quota exceeded. Please delete some existing files to free up space.';
  return 'Something went wrong. Please refresh the page or try again in a few moments.';
}
const authErr = { code: 'auth/popup-closed-by-user', message: 'FirebaseError: internal trace' };
const friendly = getFriendlyErrorMessage(authErr);
assert.ok(!friendly.includes('FirebaseError'), 'Friendly message must not leak internal trace');
assert.strictEqual(friendly, 'Sign-in cancelled. The Google popup was closed before completing.');
console.log('✓ PASS: User-facing errors are polite, safe, and descriptive');

// Test 6: Password strength scoring
console.log('\nTest 6: Password strength scoring and rules');
function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: 'None', color: 'bg-slate-200' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-indigo-600' };
  return { score, label: 'Very Strong', color: 'bg-emerald-600' };
}
assert.strictEqual(calculatePasswordStrength('123').label, 'Weak');
assert.strictEqual(calculatePasswordStrength('Abc123!@#LongPassword').label, 'Very Strong');
console.log('✓ PASS: Password strength scoring works accurately');

// Test 7: Educational email detection
console.log('\nTest 7: Educational email domain verification');
function isEducationalEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  return (
    normalized.endsWith('.edu') ||
    normalized.endsWith('.ac.uk') ||
    normalized.endsWith('.edu.au') ||
    normalized.endsWith('.edu.cn') ||
    normalized.endsWith('.edu.in') ||
    /\.edu\.[a-z]{2}$/.test(normalized) ||
    /\.ac\.[a-z]{2}$/.test(normalized)
  );
}
assert.strictEqual(isEducationalEmail('student@stanford.edu'), true);
assert.strictEqual(isEducationalEmail('jordan@oxford.ac.uk'), true);
assert.strictEqual(isEducationalEmail('user@gmail.com'), false);
console.log('✓ PASS: Educational email domain detection verified');

// Test 8: Comprehensive Firebase Auth error mapping
console.log('\nTest 8: Firebase Auth error mapping coverage');
function mapAuthError(code) {
  if (code === 'auth/email-already-in-use') return 'This email is already registered. Please sign in or reset your password.';
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Invalid email or password. Please verify your credentials.';
  if (code === 'auth/weak-password') return 'The chosen password is too weak. Please use at least 6 characters with letters and numbers.';
  if (code === 'auth/operation-not-allowed') return 'Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.';
  if (code === 'auth/provider-already-linked') return 'This account has already set a password.';
  return 'Unknown';
}
assert.ok(mapAuthError('auth/email-already-in-use').includes('already registered'));
assert.ok(mapAuthError('auth/wrong-password').includes('Invalid email or password'));
assert.ok(mapAuthError('auth/operation-not-allowed').includes('Firebase Console'));
console.log('✓ PASS: All required authentication error mappings verified');

console.log('\n===========================================');
console.log('ALL UNIT & SECURITY VALIDATION TESTS PASSED!');
console.log('===========================================\n');


