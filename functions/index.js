const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const TOTAL_QUOTA_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * 1. Callable Cloud Function: reserveUploadQuota
 * Strictly validates aggregate quota on the backend before upload starts.
 */
exports.reserveUploadQuota = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to reserve upload quota.'
    );
  }

  const userId = context.auth.uid;
  const { fileId, fileSizeBytes } = data;

  if (!fileId || typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Valid fileId and positive fileSizeBytes are required.'
    );
  }

  if (fileSizeBytes > TOTAL_QUOTA_BYTES) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Individual file size cannot exceed the 20 MB account quota.'
    );
  }

  const userRef = db.collection('users').doc(userId);
  const reservationRef = userRef.collection('quota_reservations').doc(fileId);

  return await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Student account profile not found.');
    }

    const currentUsed = Number(userDoc.data().totalStorageUsedBytes || 0);

    // Sum active pending reservations
    const reservationsSnap = await transaction.get(
      userRef.collection('quota_reservations').where('status', '==', 'pending')
    );

    let activePendingBytes = 0;
    const now = Date.now();
    reservationsSnap.forEach((doc) => {
      const res = doc.data();
      if (res.expiresAt && res.expiresAt > now && doc.id !== fileId) {
        activePendingBytes += Number(res.fileSizeBytes || 0);
      }
    });

    const projectedTotal = currentUsed + activePendingBytes + fileSizeBytes;

    if (projectedTotal > TOTAL_QUOTA_BYTES) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Not enough storage available. Delete a file to free up space.'
      );
    }

    transaction.set(reservationRef, {
      fileId,
      fileSizeBytes,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: now + 15 * 60 * 1000, // 15 minute TTL
    });

    return {
      success: true,
      remainingBytes: Math.max(0, TOTAL_QUOTA_BYTES - projectedTotal),
    };
  });
});

/**
 * 2. Cloud Storage Trigger: onObjectFinalized
 * Automatically updates user storage quota and commits file metadata upon successful upload.
 */
exports.onStorageObjectFinalized = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name; // e.g. users/{userId}/files/{fileId}/{fileName}
  if (!filePath) return null;

  const parts = filePath.split('/');
  if (parts.length < 5 || parts[0] !== 'users' || parts[2] !== 'files') {
    return null; // Not a student file
  }

  const userId = parts[1];
  const fileId = parts[3];
  const fileName = parts.slice(4).join('/');
  const fileSize = parseInt(object.size, 10);

  const userRef = db.collection('users').doc(userId);
  const fileRef = userRef.collection('files').doc(fileId);
  const reservationRef = userRef.collection('quota_reservations').doc(fileId);

  return await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentUsed = userDoc.exists ? Number(userDoc.data().totalStorageUsedBytes || 0) : 0;
    const newUsed = currentUsed + fileSize;

    // 1. Update user total storage
    transaction.set(
      userRef,
      {
        totalStorageUsedBytes: newUsed,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Commit file record
    transaction.set(
      fileRef,
      {
        id: fileId,
        name: object.metadata?.originalName || fileName,
        storagePath: filePath,
        size: fileSize,
        mimeType: object.contentType || 'application/octet-stream',
        ownerUid: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 3. Clear reservation
    transaction.delete(reservationRef);
  });
});

/**
 * 3. Cloud Storage Trigger: onObjectDeleted
 * Automatically decrements user storage quota upon object deletion.
 */
exports.onStorageObjectDeleted = functions.storage.object().onDelete(async (object) => {
  const filePath = object.name;
  if (!filePath) return null;

  const parts = filePath.split('/');
  if (parts.length < 5 || parts[0] !== 'users' || parts[2] !== 'files') {
    return null;
  }

  const userId = parts[1];
  const fileId = parts[3];
  const fileSize = parseInt(object.size, 10);

  const userRef = db.collection('users').doc(userId);
  const fileRef = userRef.collection('files').doc(fileId);

  return await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentUsed = userDoc.exists ? Number(userDoc.data().totalStorageUsedBytes || 0) : 0;

    // Never allow negative storage calculation
    const newUsed = Math.max(0, currentUsed - fileSize);

    if (userDoc.exists) {
      transaction.update(userRef, {
        totalStorageUsedBytes: newUsed,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    transaction.delete(fileRef);
  });
});

