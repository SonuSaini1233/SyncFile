import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  linkWithCredential,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured, EmailAuthProvider } from '../firebase/config';
import { TOTAL_QUOTA_BYTES } from '../utils/formatters';
import { getFriendlyErrorMessage, isEducationalEmail } from '../utils/securityValidators';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  // Set up Firebase Auth state listener and Firestore profile listener
  useEffect(() => {
    let unsubscribeProfile = null;

    const isDemoOverride = typeof window !== 'undefined' && sessionStorage.getItem('syncfile_use_demo') === 'true';

    if (!isFirebaseConfigured || isDemoOverride) {
      // In demo / preview mode or test override, check tab sessionStorage
      try {
        const demoSession = sessionStorage.getItem('syncfile_demo_user');
        if (demoSession) {
          const parsed = JSON.parse(demoSession);
          setUser(parsed);
          setUserProfile(parsed.profile);
          const hasPw = parsed.profile?.hasPasswordSet || false;
          const skipped = sessionStorage.getItem('syncfile_skip_pw_' + parsed.uid);
          if (!hasPw && !skipped && parsed.isGoogle) {
            setNeedsPasswordSetup(true);
          } else {
            setNeedsPasswordSetup(false);
          }
        }
      } catch (e) {
        console.warn('Session parse error:', e);
      }
      setLoading(false);
      return;
    }

    // Normal persistent session
    setPersistence(auth, browserLocalPersistence)
      .catch((err) => console.warn('Persistence enforcement notice:', err));

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setAuthError(null);

        if (firebaseUser) {
          setUser(firebaseUser);

          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            const hasPasswordProvider = firebaseUser.providerData?.some(
              (p) => p.providerId === 'password'
            ) || false;
            const isGoogleUser = firebaseUser.providerData?.some(
              (p) => p.providerId === 'google.com'
            ) || false;

            if (!userSnap.exists()) {
              // Initialize new student profile
              const isEdu = isEducationalEmail(firebaseUser.email || '');
              const newProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Student',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                totalStorageUsedBytes: 0,
                storageLimitBytes: TOTAL_QUOTA_BYTES,
                hasPasswordSet: hasPasswordProvider,
                isStudentVerified: isEdu,
                emailVerified: firebaseUser.emailVerified || false,
              };
              await setDoc(userRef, newProfile);
              setUserProfile(newProfile);

              // Check if first-time Google user needs password setup
              const skipped = sessionStorage.getItem('syncfile_skip_pw_' + firebaseUser.uid);
              if (isGoogleUser && !hasPasswordProvider && !skipped) {
                setNeedsPasswordSetup(true);
              } else {
                setNeedsPasswordSetup(false);
              }
            } else {
              // Existing student profile
              const existingData = userSnap.data();
              const hasPw = hasPasswordProvider || Boolean(existingData.hasPasswordSet);

              await setDoc(
                userRef,
                {
                  lastLoginAt: serverTimestamp(),
                  hasPasswordSet: hasPw,
                  emailVerified: firebaseUser.emailVerified || false,
                },
                { merge: true }
              );
              setUserProfile({ ...existingData, hasPasswordSet: hasPw });

              // Prompt returning Google users who have not set a password and have not skipped in this session
              const skipped = sessionStorage.getItem('syncfile_skip_pw_' + firebaseUser.uid);
              if (isGoogleUser && !hasPw && !skipped) {
                setNeedsPasswordSetup(true);
              } else {
                setNeedsPasswordSetup(false);
              }
            }

            // Real-time listener for live quota and profile updates
            if (unsubscribeProfile) unsubscribeProfile();
            unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
              if (docSnap.exists()) {
                setUserProfile(docSnap.data());
              }
            });
          } catch (profileErr) {
            console.error('Error synchronizing user profile:', profileErr);
            setUserProfile({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Student',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              totalStorageUsedBytes: 0,
              storageLimitBytes: TOTAL_QUOTA_BYTES,
              hasPasswordSet: firebaseUser.providerData?.some((p) => p.providerId === 'password'),
              isStudentVerified: isEducationalEmail(firebaseUser.email || ''),
              emailVerified: firebaseUser.emailVerified || false,
            });
          }
        } else {
          // Signed out
          setUser(null);
          setUserProfile(null);
          setNeedsPasswordSetup(false);
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(getFriendlyErrorMessage(error));
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  /**
   * 1. Sign in with Google
   */
  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);

    if (!isFirebaseConfigured) {
      const demoUser = {
        uid: 'demo_student_123',
        displayName: 'Alex Morgan (Student)',
        email: 'alex.morgan@university.edu',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isGoogle: true,
        providerData: [{ providerId: 'google.com' }],
        profile: {
          uid: 'demo_student_123',
          displayName: 'Alex Morgan (Student)',
          email: 'alex.morgan@university.edu',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          totalStorageUsedBytes: 5242880,
          storageLimitBytes: TOTAL_QUOTA_BYTES,
          hasPasswordSet: false,
          isStudentVerified: true,
          emailVerified: true,
        },
      };

      try {
        sessionStorage.setItem('syncfile_demo_user', JSON.stringify(demoUser));
      } catch (e) {}

      setUser(demoUser);
      setUserProfile(demoUser.profile);
      const skipped = sessionStorage.getItem('syncfile_skip_pw_' + demoUser.uid);
      if (!skipped) {
        setNeedsPasswordSetup(true);
      }
      setLoading(false);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      const friendlyMsg = getFriendlyErrorMessage(error);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. Sign in with Email and Password
   */
  const signInWithEmail = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    if (!isFirebaseConfigured) {
      const demoUser = {
        uid: 'demo_email_student_456',
        displayName: email.split('@')[0],
        email: email.trim(),
        photoURL: '',
        providerData: [{ providerId: 'password' }],
        profile: {
          uid: 'demo_email_student_456',
          displayName: email.split('@')[0],
          email: email.trim(),
          photoURL: '',
          createdAt: new Date().toISOString(),
          totalStorageUsedBytes: 0,
          storageLimitBytes: TOTAL_QUOTA_BYTES,
          hasPasswordSet: true,
          isStudentVerified: isEducationalEmail(email.trim()),
          emailVerified: true,
        },
      };

      try {
        sessionStorage.setItem('syncfile_demo_user', JSON.stringify(demoUser));
      } catch (e) {}

      setUser(demoUser);
      setUserProfile(demoUser.profile);
      setNeedsPasswordSetup(false);
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error('Email sign-in error:', error);
      const friendlyMsg = getFriendlyErrorMessage(error);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 3. Register a new student account with Email and Password
   */
  const registerWithEmail = async (name, email, password) => {
    setLoading(true);
    setAuthError(null);

    if (!isFirebaseConfigured) {
      const demoUser = {
        uid: 'demo_reg_' + Date.now(),
        displayName: name.trim(),
        email: email.trim(),
        photoURL: '',
        providerData: [{ providerId: 'password' }],
        profile: {
          uid: 'demo_reg_' + Date.now(),
          displayName: name.trim(),
          email: email.trim(),
          photoURL: '',
          createdAt: new Date().toISOString(),
          totalStorageUsedBytes: 0,
          storageLimitBytes: TOTAL_QUOTA_BYTES,
          hasPasswordSet: true,
          isStudentVerified: isEducationalEmail(email.trim()),
          emailVerified: false,
        },
      };

      try {
        sessionStorage.setItem('syncfile_demo_user', JSON.stringify(demoUser));
      } catch (e) {}

      setUser(demoUser);
      setUserProfile(demoUser.profile);
      setNeedsPasswordSetup(false);
      setLoading(false);
      return { emailVerificationSent: true };
    }

    try {
      // Create user in Firebase Authentication
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = cred.user;

      // Update user display name
      try {
        await updateProfile(newUser, { displayName: name.trim() });
      } catch (updateErr) {
        console.warn('Could not update profile display name:', updateErr);
      }

      // Send verification email
      let emailVerificationSent = false;
      try {
        await sendEmailVerification(newUser);
        emailVerificationSent = true;
      } catch (verifyErr) {
        console.warn('Could not send email verification:', verifyErr);
      }

      // Provision profile in Cloud Firestore
      const isEdu = isEducationalEmail(email.trim());
      const newProfile = {
        uid: newUser.uid,
        displayName: name.trim(),
        email: email.trim(),
        photoURL: '',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        totalStorageUsedBytes: 0,
        storageLimitBytes: TOTAL_QUOTA_BYTES,
        hasPasswordSet: true,
        isStudentVerified: isEdu,
        emailVerified: false,
      };

      try {
        const userRef = doc(db, 'users', newUser.uid);
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } catch (dbErr) {
        console.error('Failed writing user profile:', dbErr);
      }

      setNeedsPasswordSetup(false);
      return { emailVerificationSent };
    } catch (error) {
      console.error('Registration error:', error);
      const friendlyMsg = getFriendlyErrorMessage(error);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 4. Send Password Reset Email
   */
  const sendPasswordReset = async (email) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your registered email address.');
    }

    setAuthError(null);

    if (!isFirebaseConfigured) {
      return { success: true };
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      const friendlyMsg = getFriendlyErrorMessage(error);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  /**
   * 5. Resend verification email
   */
  const resendVerificationEmail = async () => {
    if (!user) throw new Error('No user is currently signed in.');

    if (!isFirebaseConfigured) {
      return { success: true };
    }

    try {
      await sendEmailVerification(user);
      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  /**
   * 6. Link Password to an existing account (First-Time Google Sign-In Setup / Section 8)
   */
  const linkPasswordToAccount = async (password) => {
    if (!user) throw new Error('You must be signed in to set a password.');
    if (!user.email) throw new Error('No email found for currently authenticated account.');

    setLoading(true);
    setAuthError(null);

    if (!isFirebaseConfigured) {
      // Update demo session
      setUserProfile((prev) => ({ ...prev, hasPasswordSet: true }));
      setNeedsPasswordSetup(false);
      setLoading(false);
      return { success: true };
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);

      // Update Firestore profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { hasPasswordSet: true }, { merge: true });

      setUserProfile((prev) => ({ ...prev, hasPasswordSet: true }));
      setNeedsPasswordSetup(false);
      return { success: true };
    } catch (error) {
      console.error('Link password error:', error);
      if (error.code === 'auth/provider-already-linked') {
        // Already linked, update database flag
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { hasPasswordSet: true }, { merge: true });
        } catch (e) {}
        setUserProfile((prev) => ({ ...prev, hasPasswordSet: true }));
        setNeedsPasswordSetup(false);
        return { success: true };
      }

      const friendlyMsg = getFriendlyErrorMessage(error);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 7. Skip password setup for current session
   */
  const skipPasswordSetup = () => {
    if (user) {
      try {
        sessionStorage.setItem('syncfile_skip_pw_' + user.uid, 'true');
      } catch (e) {}
    }
    setNeedsPasswordSetup(false);
  };

  /**
   * 8. Sign out current student session
   */
  const signOutUser = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      } else {
        sessionStorage.removeItem('syncfile_demo_user');
      }
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
      setNeedsPasswordSetup(false);
    } catch (error) {
      console.error('Sign-out error:', error);
      setAuthError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update local user profile state (for quota calculations and UI sync)
   */
  const updateLocalQuota = (newUsedBytes) => {
    setUserProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalStorageUsedBytes: Math.max(0, newUsedBytes),
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        setAuthError,
        needsPasswordSetup,
        isConfigured: isFirebaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        linkPasswordToAccount,
        skipPasswordSetup,
        signOutUser,
        updateLocalQuota,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
