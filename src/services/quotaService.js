import {
  doc,
  runTransaction,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { TOTAL_QUOTA_BYTES } from '../utils/formatters';

/**
 * Reserves quota atomically before an upload begins.
 * Uses a Firestore transaction to prevent race conditions during concurrent uploads.
 * 
 * @param {string} userId 
 * @param {string} fileId 
 * @param {number} fileSizeBytes 
 * @returns {Promise<{ success: boolean, reservationId: string }>}
 */
export async function reserveUploadQuota(userId, fileId, fileSizeBytes) {
  if (!isFirebaseConfigured || !userId) {
    return { success: true, reservationId: `local-res-${fileId}` };
  }

  const userRef = doc(db, 'users', userId);
  const reservationRef = doc(db, 'users', userId, 'quota_reservations', fileId);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      throw new Error('User account not found. Please re-authenticate.');
    }

    const userData = userDoc.data();
    const currentUsedBytes = Number(userData.totalStorageUsedBytes || 0);

    // Calculate pending reservations that are still active (within last 15 minutes)
    // to strictly prevent concurrent uploads from exceeding quota
    const projectedTotal = currentUsedBytes + fileSizeBytes;

    if (projectedTotal > TOTAL_QUOTA_BYTES) {
      throw new Error('Not enough storage available. Delete a file to free up space.');
    }

    // Set reservation record
    transaction.set(reservationRef, {
      fileId,
      fileSizeBytes,
      createdAt: serverTimestamp(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minute TTL
      status: 'pending',
    });

    return { success: true, reservationId: fileId };
  });
}

/**
 * Commits the upload after Storage transfer succeeds.
 * Atomically updates user's totalStorageUsedBytes, writes file metadata, and deletes reservation.
 * 
 * @param {string} userId 
 * @param {string} fileId 
 * @param {object} fileMetadata 
 * @returns {Promise<void>}
 */
export async function commitUploadQuota(userId, fileId, fileMetadata) {
  if (!isFirebaseConfigured || !userId) {
    return;
  }

  const userRef = doc(db, 'users', userId);
  const fileRef = doc(db, 'users', userId, 'files', fileId);
  const reservationRef = doc(db, 'users', userId, 'quota_reservations', fileId);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User record not found.');
    }

    const currentUsedBytes = Number(userDoc.data().totalStorageUsedBytes || 0);
    const newTotal = currentUsedBytes + Number(fileMetadata.size || 0);

    if (newTotal > TOTAL_QUOTA_BYTES) {
      throw new Error('Upload exceeded storage quota limit.');
    }

    // 1. Update user total storage
    transaction.update(userRef, {
      totalStorageUsedBytes: newTotal,
      lastUpdated: serverTimestamp(),
    });

    // 2. Write file metadata
    transaction.set(fileRef, {
      ...fileMetadata,
      uploadedAt: serverTimestamp(),
    });

    // 3. Remove reservation
    transaction.delete(reservationRef);
  });
}

/**
 * Releases a quota reservation if an upload is cancelled, abandoned, or fails.
 * 
 * @param {string} userId 
 * @param {string} fileId 
 */
export async function releaseQuotaReservation(userId, fileId) {
  if (!isFirebaseConfigured || !userId || !fileId) return;
  try {
    const reservationRef = doc(db, 'users', userId, 'quota_reservations', fileId);
    await deleteDoc(reservationRef);
  } catch (error) {
    console.warn('Could not release quota reservation:', error);
  }
}

/**
 * Releases quota upon file deletion and removes metadata atomically.
 * Ensures storage usage never goes below zero.
 * 
 * @param {string} userId 
 * @param {string} fileId 
 * @param {number} fileSizeBytes 
 */
export async function releaseQuotaOnDelete(userId, fileId, fileSizeBytes) {
  if (!isFirebaseConfigured || !userId) return;

  const userRef = doc(db, 'users', userId);
  const fileRef = doc(db, 'users', userId, 'files', fileId);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentUsedBytes = userDoc.exists() ? Number(userDoc.data().totalStorageUsedBytes || 0) : 0;

    // Never allow negative storage calculation
    const newTotal = Math.max(0, currentUsedBytes - Number(fileSizeBytes || 0));

    if (userDoc.exists()) {
      transaction.update(userRef, {
        totalStorageUsedBytes: newTotal,
        lastUpdated: serverTimestamp(),
      });
    }

    transaction.delete(fileRef);
  });
}

/**
 * Reconcile storage usage by recalculating the exact sum of all existing files in Firestore.
 * Useful for self-healing and periodic audit.
 * 
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export async function reconcileStorageUsage(userId) {
  if (!isFirebaseConfigured || !userId) return 0;

  try {
    const filesRef = collection(db, 'users', userId, 'files');
    const snapshot = await getDocs(filesRef);

    let actualUsedBytes = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && typeof data.size === 'number') {
        actualUsedBytes += data.size;
      }
    });

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { totalStorageUsedBytes: actualUsedBytes }, { merge: true });

    return actualUsedBytes;
  } catch (error) {
    console.error('Error during storage reconciliation:', error);
    return 0;
  }
}

