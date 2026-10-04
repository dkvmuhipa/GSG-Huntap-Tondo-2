import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { initializeFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Using initializeFirestore instead of getFirestore to set experimental settings
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const loginWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);
export const getRedirectLoginResult = () => getRedirectResult(auth);

export const logout = () => auth.signOut();

export const SYSTEM_OWNER_EMAILS = ["dkvsmkmuhipa@gmail.com"];

export interface AdminAuthCheckResult {
  authorized: boolean;
  role: string | null;
  profile: any | null;
}

export const checkIsAdminAuthorized = async (firebaseUser: { email?: string | null } | null): Promise<AdminAuthCheckResult> => {
  if (!firebaseUser || !firebaseUser.email) {
    return { authorized: false, role: null, profile: null };
  }

  const userEmail = firebaseUser.email.toLowerCase().trim();

  // 1. Direct System Owner check
  if (SYSTEM_OWNER_EMAILS.includes(userEmail)) {
    return {
      authorized: true,
      role: 'owner',
      profile: { role: 'owner', displayName: 'System Owner', email: userEmail }
    };
  }

  // 2. Direct lookup in Firestore 'admins' collection by email key
  try {
    const docRef = doc(db, 'admins', userEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        authorized: true,
        role: data.role || 'admin',
        profile: data
      };
    }
  } catch (err) {
    console.warn("Could not verify admin document from Firestore:", err);
  }

  return { authorized: false, role: null, profile: null };
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
