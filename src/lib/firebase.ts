import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use provisioned firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Skill requirement: test connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline, will use local persistence fallback.');
    }
  }
}
testConnection();

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error('Google Sign-In error:', err);
    throw err;
  }
}

export async function loginAnonymously() {
  try {
    return await signInAnonymously(auth);
  } catch (err) {
    console.error('Anonymous sign-in error:', err);
    throw err;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user && name) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred;
}

export async function logoutUser() {
  return await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function initializeUserRecord(user: User) {
  return await syncUserProfile(user, {});
}

// Data models
export interface UserProfileData {
  displayName?: string;
  email?: string;
  liturgicalRegion: string;
  bibleFontSize: number;
  audioEnabled: boolean;
  sacredArtStyle: 'sacred' | 'minimal';
  currentStreak: number;
  totalRosaries: number;
  lastPrayedDate?: string;
  updatedAt: string;
}

export interface SpiritualRoutine {
  id: string;
  userId: string;
  title: string;
  time: string;
  enabled: boolean;
  category: string;
  completedDates: string[]; // ['2026-09-11', ...]
}

export interface MeditationNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
}

export interface FavoriteVerse {
  id: string;
  userId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

// Default routines to bootstrap for Catholic daily life
export const DEFAULT_ROUTINES = [
  { id: 'r1', title: 'Laudes y Oficio Matutino', time: '06:30', category: 'Liturgia', enabled: true },
  { id: 'r2', title: 'El Ángelus del Mediodía', time: '12:00', category: 'Oración', enabled: true },
  { id: 'r3', title: 'Hora de la Divina Misericordia', time: '15:00', category: 'Coronilla', enabled: true },
  { id: 'r4', title: 'Santo Rosario Diario', time: '18:30', category: 'Rosario', enabled: true },
  { id: 'r5', title: 'Lectura Bíblica y Meditación', time: '20:30', category: 'Biblia', enabled: true },
  { id: 'r6', title: 'Examen de Conciencia y Completas', time: '22:00', category: 'Noche', enabled: true },
];

// Firestore User Profile helpers
export async function syncUserProfile(user: User, data: Partial<UserProfileData>): Promise<UserProfileData> {
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const existing = await getDoc(userDocRef);
    const prev = existing.exists() ? (existing.data() as UserProfileData) : null;
    const merged: UserProfileData = {
      displayName: user.displayName || user.email?.split('@')[0] || 'Peregrino',
      email: user.email || '',
      liturgicalRegion: data.liturgicalRegion || prev?.liturgicalRegion || 'Colombia',
      bibleFontSize: data.bibleFontSize || prev?.bibleFontSize || 20,
      audioEnabled: data.audioEnabled !== undefined ? data.audioEnabled : (prev?.audioEnabled ?? true),
      sacredArtStyle: data.sacredArtStyle || prev?.sacredArtStyle || 'sacred',
      currentStreak: data.currentStreak !== undefined ? data.currentStreak : (prev?.currentStreak || 1),
      totalRosaries: data.totalRosaries !== undefined ? data.totalRosaries : (prev?.totalRosaries || 0),
      lastPrayedDate: data.lastPrayedDate || prev?.lastPrayedDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, merged, { merge: true });
    return merged;
  } catch (err) {
    console.warn('Could not sync profile to Firestore, saving to localStorage:', err);
    const local = JSON.parse(localStorage.getItem(`lumen_profile_${user.uid}`) || '{}');
    const updated = { ...local, ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(`lumen_profile_${user.uid}`, JSON.stringify(updated));
    return updated as UserProfileData;
  }
}

export async function getUserProfile(user: User): Promise<UserProfileData> {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
  } catch (e) {
    console.warn('Error fetching user profile:', e);
  }
  const fallback = localStorage.getItem(`lumen_profile_${user.uid}`);
  if (fallback) {
    try { return JSON.parse(fallback); } catch {}
  }
  return {
    displayName: user.displayName || (user.isAnonymous ? 'Peregrino Invitado' : 'Fiel de Cristo'),
    email: user.email || '',
    liturgicalRegion: 'Colombia',
    bibleFontSize: 20,
    audioEnabled: true,
    sacredArtStyle: 'sacred',
    currentStreak: 1,
    totalRosaries: 0,
    updatedAt: new Date().toISOString()
  };
}

// Routines sync
export async function getRoutines(userId: string): Promise<SpiritualRoutine[]> {
  try {
    const ref = collection(db, 'users', userId, 'routines');
    const snap = await getDocs(ref);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SpiritualRoutine));
    }
  } catch (e) {
    console.warn('Could not load routines from Firestore, using local backup:', e);
  }

  const localKey = `lumen_routines_${userId}`;
  const stored = localStorage.getItem(localKey);
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }

  // Initial defaults
  const defaults: SpiritualRoutine[] = DEFAULT_ROUTINES.map(r => ({
    ...r,
    userId,
    completedDates: []
  }));
  localStorage.setItem(localKey, JSON.stringify(defaults));
  return defaults;
}

export async function saveRoutine(userId: string, routine: SpiritualRoutine): Promise<void> {
  const localKey = `lumen_routines_${userId}`;
  try {
    const list = await getRoutines(userId);
    const idx = list.findIndex(r => r.id === routine.id);
    if (idx >= 0) list[idx] = routine;
    else list.push(routine);
    localStorage.setItem(localKey, JSON.stringify(list));

    const docRef = doc(db, 'users', userId, 'routines', routine.id);
    await setDoc(docRef, routine, { merge: true });
  } catch (e) {
    console.warn('Error saving routine to Firestore:', e);
  }
}

// Notes sync
export async function getNotes(userId: string): Promise<MeditationNote[]> {
  try {
    const ref = collection(db, 'users', userId, 'notes');
    const snap = await getDocs(ref);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MeditationNote));
    }
  } catch (e) {
    console.warn('Using local notes:', e);
  }
  const stored = localStorage.getItem(`lumen_notes_${userId}`);
  return stored ? JSON.parse(stored) : [];
}

export async function saveNote(userId: string, note: MeditationNote): Promise<void> {
  const localKey = `lumen_notes_${userId}`;
  try {
    const list = await getNotes(userId);
    const idx = list.findIndex(n => n.id === note.id);
    if (idx >= 0) list[idx] = note;
    else list.unshift(note);
    localStorage.setItem(localKey, JSON.stringify(list));

    const docRef = doc(db, 'users', userId, 'notes', note.id);
    await setDoc(docRef, note);
  } catch (e) {
    console.warn('Error saving note:', e);
  }
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const localKey = `lumen_notes_${userId}`;
  try {
    const list = await getNotes(userId);
    const filtered = list.filter(n => n.id !== noteId);
    localStorage.setItem(localKey, JSON.stringify(filtered));

    const docRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Error deleting note:', e);
  }
}

// Aliases and convenience methods
export type SpiritualNote = MeditationNote;
export const getUserRoutines = getRoutines;
export const saveUserRoutine = saveRoutine;
export const getUserNotes = getNotes;

export async function toggleRoutineCompleted(userId: string, routineId: string, completed: boolean): Promise<SpiritualRoutine> {
  const list = await getRoutines(userId);
  const target = list.find(r => r.id === routineId);
  const today = '2026-09-11';
  let completedDates = target?.completedDates || [];
  if (completed) {
    if (!completedDates.includes(today)) completedDates = [...completedDates, today];
  } else {
    completedDates = completedDates.filter(d => d !== today);
  }
  const updated: SpiritualRoutine = target ? { ...target, completedDates } : {
    id: routineId,
    userId,
    title: 'Rutina espiritual',
    time: '08:00',
    enabled: true,
    category: 'oracion',
    completedDates
  };
  await saveRoutine(userId, updated);
  return updated;
}

export async function updateUserPrayerStats(userId: string, rosariesIncrement = 1): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfileData;
      await updateDoc(userDocRef, {
        totalRosaries: (data.totalRosaries || 0) + rosariesIncrement,
        lastPrayedDate: '2026-09-11',
        updatedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    console.warn('Error updating prayer stats:', e);
  }
}

