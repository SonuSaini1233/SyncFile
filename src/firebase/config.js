import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  EmailAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read Firebase client configuration from Vite environment variables with project defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAPQqDNfXEemuxadUX3YmplsCd4umJeEZU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'syncfile-e99da.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'syncfile-e99da',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'syncfile-e99da.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '348821772939',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:348821772939:web:ebd950df8e0b3de4e6128e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-8561VRBQVK',
};

// Check if valid Firebase configuration is present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your-project-id'
);

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Configure Google OAuth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Configure normal Firebase Authentication Persistence (persists across reloads)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('Could not set persistence on Firebase Auth:', error);
  });
}

// Initialize Cloud Firestore and Cloud Storage
const firestoreDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'syncfile';
const db = firestoreDbId && firestoreDbId !== '(default)'
  ? getFirestore(app, firestoreDbId)
  : getFirestore(app);
const storage = getStorage(app);
storage.maxUploadRetryTime = 20000; // 20 seconds timeout instead of 10-minute hang
storage.maxOperationRetryTime = 15000;

export { app, auth, db, storage, EmailAuthProvider };

