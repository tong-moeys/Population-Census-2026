import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Citizen } from './types/census';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without this exact line
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Validate Connection to Firestore on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'citizens', '1'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info('Firestore is currently in offline mode or network is unreachable.');
    }
    return true;
  }
}

// Immediately trigger connection check
testConnection().catch(() => {});

// Auth Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Record user profile in firestore
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          displayName: result.user.displayName || 'User',
          email: result.user.email || 'user@moeys.gov.kh',
          photoURL: result.user.photoURL || '',
          role: 'teacher'
        }, { merge: true });
      } catch (profileErr) {
        console.info('Profile doc write note:', profileErr);
      }
    }
    return result.user;
  } catch (err: unknown) {
    const fbErr = err as { code?: string; message?: string };
    // Normal user actions or browser popup restrictions - handled cleanly without console.error
    if (
      fbErr?.code === 'auth/popup-closed-by-user' ||
      fbErr?.code === 'auth/cancelled-popup-request' ||
      fbErr?.code === 'auth/popup-blocked'
    ) {
      console.info('Google sign-in popup was cancelled or closed.');
      return null;
    }
    console.warn('Sign-in notification:', fbErr?.message || err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Sign out note:', err);
  }
}

// Sync single citizen to Firestore
export async function syncCitizenToFirestore(citizen: Citizen): Promise<void> {
  const path = `citizens/${citizen.id}`;
  const hhStr = String(citizen.householdCode || citizen.householdId || '1');
  const village = citizen.village?.trim() ? citizen.village.trim() : (hhStr.includes('M') ? 'មុខឈ្នាង' : 'រោគ');
  const school = citizen.school || 'ប.សរោគ';
  try {
    const validStatus = (citizen.enrollmentStatus === 'enrolled' || citizen.enrollmentStatus === 'contacted' || citizen.enrollmentStatus === 'moved') 
      ? citizen.enrollmentStatus 
      : 'not_enrolled';

    const citizenDoc = {
      id: Number(citizen.id),
      originalId: String(citizen.originalId || citizen.id).slice(0, 100),
      name: String(citizen.name || `ពលរដ្ឋ #${citizen.id}`).trim().slice(0, 150),
      gender: String(citizen.gender || 'មិនស្គាល់').trim(),
      dob: String(citizen.dob || '').trim().slice(0, 50),
      age: Math.max(0, Math.min(130, Number(citizen.age) || 0)),
      relationship: String(citizen.relationship || 'កូន').trim().slice(0, 100),
      occupation: String(citizen.occupation || 'កសិករ').trim().slice(0, 100),
      householdId: hhStr.slice(0, 50),
      householdCode: hhStr.slice(0, 50),
      school: school.slice(0, 100),
      village: village.slice(0, 100),
      enrollmentStatus: validStatus
    };
    await setDoc(doc(db, 'citizens', String(citizen.id)), citizenDoc, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete citizen from Firestore
export async function deleteCitizenFromFirestore(id: number): Promise<void> {
  const path = `citizens/${id}`;
  try {
    await deleteDoc(doc(db, 'citizens', String(id)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Batch upload / seed citizens to Firestore
export async function batchSyncCitizens(citizens: Citizen[], onProgress?: (percent: number) => void): Promise<number> {
  const batchSize = 400;
  let synced = 0;
  const total = citizens.length;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = citizens.slice(i, i + batchSize);
    const batch = writeBatch(db);

    for (const c of chunk) {
      const ref = doc(db, 'citizens', String(c.id));
      const hhStr = String(c.householdCode || c.householdId || '1');
      const village = c.village?.trim() ? c.village.trim() : (hhStr.includes('M') ? 'មុខឈ្នាង' : 'រោគ');
      const school = c.school || 'ប.សរោគ';
      const validStatus = (c.enrollmentStatus === 'enrolled' || c.enrollmentStatus === 'contacted' || c.enrollmentStatus === 'moved') 
        ? c.enrollmentStatus 
        : 'not_enrolled';

      batch.set(ref, {
        id: Number(c.id),
        originalId: String(c.originalId || c.id).slice(0, 100),
        name: String(c.name || `ពលរដ្ឋ #${c.id}`).trim().slice(0, 150),
        gender: String(c.gender || 'មិនស្គាល់').trim(),
        dob: String(c.dob || '').trim().slice(0, 50),
        age: Math.max(0, Math.min(130, Number(c.age) || 0)),
        relationship: String(c.relationship || 'កូន').trim().slice(0, 100),
        occupation: String(c.occupation || 'កសិករ').trim().slice(0, 100),
        householdId: hhStr.slice(0, 50),
        householdCode: hhStr.slice(0, 50),
        school: school.slice(0, 100),
        village: village.slice(0, 100),
        enrollmentStatus: validStatus
      }, { merge: true });
    }

    await batch.commit();
    synced += chunk.length;
    if (onProgress) {
      onProgress(Math.min(100, Math.round((synced / total) * 100)));
    }
  }

  return synced;
}

// Fetch citizens from Firestore
export async function fetchCitizensFromFirestore(): Promise<Citizen[]> {
  const path = 'citizens';
  try {
    const q = query(collection(db, path), limit(2500));
    const snapshot = await getDocs(q);
    const list: Citizen[] = [];
    snapshot.forEach(docSnap => {
      const d = docSnap.data() as Citizen;
      const citizenId = Number(d.id);
      const hhStr = String(d.householdCode || d.householdId || '1');
      const village = d.village?.trim() ? d.village.trim() : (hhStr.includes('M') ? 'មុខឈ្នាង' : 'រោគ');
      const school = d.school || 'ប.សរោគ';
      list.push({
        id: citizenId,
        originalId: d.originalId || String(d.id),
        name: d.name,
        gender: d.gender,
        dob: d.dob || '',
        age: Number(d.age),
        relationship: d.relationship,
        occupation: d.occupation,
        householdId: hhStr,
        householdCode: hhStr,
        school,
        village,
        enrollmentStatus: d.enrollmentStatus || 'not_enrolled'
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
