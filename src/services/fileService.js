import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Bytes,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import {
  reserveUploadQuota,
  commitUploadQuota,
  releaseQuotaReservation,
  releaseQuotaOnDelete,
} from './quotaService';
import { sanitizeFileName } from '../utils/formatters';
import { getFriendlyErrorMessage } from '../utils/securityValidators';

// Chunk size: 700 KB per document (comfortably below Firestore's 1 MiB document limit)
const FIRESTORE_CHUNK_SIZE = 700 * 1024;

/**
 * Upload a file directly into Cloud Firestore in 700 KB binary chunks.
 * Works 100% on the FREE Spark plan without requiring any credit card or Blaze billing account!
 *
 * @param {File} file 
 * @param {string} userId 
 * @param {Function} onProgress (percent: number, transferred: number, total: number)
 * @param {object} controls { cancel: () => void }
 * @returns {Promise<object>} Uploaded file metadata
 */
export async function uploadFileToStorage(file, userId, onProgress, controls = {}) {
  if (!file) throw new Error('No file provided for upload.');
  if (!userId) throw new Error('User not authenticated.');

  // Generate unique file ID to prevent overwriting files with identical names
  const fileId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const sanitized = sanitizeFileName(file.name);
  const storagePath = `users/${userId}/files/${fileId}/${sanitized}`;

  // 1. Reserve quota atomically in Firestore
  await reserveUploadQuota(userId, fileId, file.size);

  if (!isFirebaseConfigured) {
    // Demo / offline mode simulation
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(progress, (file.size * progress) / 100, file.size);
        if (progress >= 100) {
          clearInterval(interval);
          const mockFile = {
            id: fileId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            storagePath,
            downloadUrl: URL.createObjectURL(file),
            createdAt: new Date(),
            ownerUid: userId,
          };
          resolve(mockFile);
        }
      }, 150);

      controls.cancel = () => {
        clearInterval(interval);
      };
    });
  }

  // 2. Upload file directly into Firestore subcollection chunks (binary Uint8Array)
  try {
    let isCancelled = false;
    controls.cancel = () => {
      isCancelled = true;
    };

    const totalChunks = Math.ceil(file.size / FIRESTORE_CHUNK_SIZE) || 1;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (isCancelled) {
        throw new Error('Upload cancelled by user.');
      }

      const start = chunkIndex * FIRESTORE_CHUNK_SIZE;
      const end = Math.min(file.size, start + FIRESTORE_CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);
      const arrayBuffer = await chunkBlob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const bytes = Bytes.fromUint8Array(uint8);

      const chunkDocRef = doc(db, 'users', userId, 'files', fileId, 'chunks', String(chunkIndex));
      await setDoc(chunkDocRef, {
        index: chunkIndex,
        data: bytes,
        size: uint8.byteLength,
        createdAt: serverTimestamp(),
      });

      const transferred = end;
      const percent = Math.min(99, Math.round((transferred / file.size) * 100));
      if (onProgress) {
        onProgress(percent, transferred, file.size);
      }
    }

    if (isCancelled) {
      throw new Error('Upload cancelled by user.');
    }

    const fileDocData = {
      id: fileId,
      name: file.name,
      storagePath,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageType: 'firestore',
      totalChunks,
      chunkSize: FIRESTORE_CHUNK_SIZE,
      ownerUid: userId,
    };

    // Commit quota and write file metadata in Firestore
    await commitUploadQuota(userId, fileId, fileDocData);

    if (onProgress) {
      onProgress(100, file.size, file.size);
    }

    return fileDocData;
  } catch (err) {
    console.error('Firestore chunk upload error:', err);
    // Cleanup any uploaded chunks on failure or cancellation
    try {
      const chunksRef = collection(db, 'users', userId, 'files', fileId, 'chunks');
      const snap = await getDocs(chunksRef);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (cleanErr) {
      console.warn('Could not clean up orphaned chunks:', cleanErr);
    }
    await releaseQuotaReservation(userId, fileId);
    throw new Error(getFriendlyErrorMessage(err));
  }
}

/**
 * Downloads a file securely by reconstructing chunks from Cloud Firestore.
 * Preserves original filename and contents.
 * 
 * @param {object} file 
 */
export async function downloadFileSecurely(file) {
  if (!file) throw new Error('File data missing.');

  try {
    // 1. If stored in Firestore chunks (our primary 100% free storage)
    if (isFirebaseConfigured && (file.storageType === 'firestore' || !file.downloadUrl)) {
      const userId = file.ownerUid;
      const chunksRef = collection(db, 'users', userId, 'files', file.id, 'chunks');
      const q = query(chunksRef, orderBy('index', 'asc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const chunkParts = [];
        snapshot.forEach((snap) => {
          const chunkData = snap.data();
          if (chunkData.data && typeof chunkData.data.toUint8Array === 'function') {
            chunkParts.push(chunkData.data.toUint8Array());
          } else if (chunkData.data) {
            chunkParts.push(chunkData.data);
          }
        });

        const blob = new Blob(chunkParts, { type: file.mimeType || 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        return;
      }
    }

    // 2. Demo or direct URL fallback
    if (file.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    throw new Error('File content could not be retrieved.');
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(getFriendlyErrorMessage(error));
  }
}

/**
 * Delete a file completely from Firestore (metadata and all chunks), freeing up storage quota.
 * 
 * @param {object} file 
 * @param {string} userId 
 */
export async function deleteFileFromStorage(file, userId) {
  if (!file || !file.id) throw new Error('Invalid file reference.');
  if (!userId) throw new Error('User not authenticated.');

  if (!isFirebaseConfigured) {
    return true;
  }

  // 1. Delete all binary chunks from Firestore subcollection
  try {
    const chunksRef = collection(db, 'users', userId, 'files', file.id, 'chunks');
    const chunksSnap = await getDocs(chunksRef);
    const deletePromises = chunksSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (chunkErr) {
    console.warn('Warning during chunks deletion:', chunkErr);
  }

  // 2. Release quota and delete metadata in Firestore
  await releaseQuotaOnDelete(userId, file.id, file.size);

  return true;
}

/**
 * Subscribe to real-time updates of user files in Firestore
 * 
 * @param {string} userId 
 * @param {Function} onUpdate 
 * @param {Function} onError 
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserFiles(userId, onUpdate, onError) {
  if (!isFirebaseConfigured || !userId) {
    return () => {};
  }

  const filesRef = collection(db, 'users', userId, 'files');
  const q = query(filesRef, where('ownerUid', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const files = [];
      snapshot.forEach((docSnap) => {
        files.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(files);
    },
    (error) => {
      console.error('Error fetching files:', error);
      if (onError) onError(error);
    }
  );
}
