// Internal storage limits in exact integer bytes
export const TOTAL_QUOTA_BYTES = 20 * 1024 * 1024; // Exactly 20 MB (20,971,520 bytes)
export const MAX_SINGLE_FILE_BYTES = 20 * 1024 * 1024; // Exactly 20 MB

/**
 * Format bytes to human-readable string (B, KB, MB, GB)
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0 || !bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);
  const value = parseFloat((bytes / Math.pow(k, index)).toFixed(dm));

  return `${value} ${sizes[index]}`;
}

/**
 * Calculate storage usage percentage clamped between 0% and 100%
 * @param {number} usedBytes 
 * @param {number} totalBytes 
 * @returns {number}
 */
export function calculateStoragePercentage(usedBytes, totalBytes = TOTAL_QUOTA_BYTES) {
  if (!usedBytes || usedBytes <= 0 || !totalBytes || totalBytes <= 0) return 0;
  const pct = (usedBytes / totalBytes) * 100;
  return Math.min(100, Math.max(0, parseFloat(pct.toFixed(1))));
}

/**
 * Format a Date or Firestore Timestamp into student-friendly readable format
 * @param {Date | Object | string | number} timestamp 
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'Just now';

  let date;
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return 'Just now';
  }

  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format exact full date and time for file details modal
 * @param {Date | Object | string | number} timestamp 
 * @returns {string}
 */
export function formatFullDateTime(timestamp) {
  if (!timestamp) return 'Unknown';
  let date;
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sanitize filename to avoid directory traversal or unsafe URL characters in Cloud Storage paths
 * @param {string} fileName 
 * @returns {string}
 */
export function sanitizeFileName(fileName) {
  if (!fileName) return 'unnamed_file';
  // Remove control characters, slashes, and characters problematic in Cloud Storage paths
  return fileName
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .trim()
    .slice(0, 180);
}

