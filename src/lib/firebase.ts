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
  increment
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { getTodayDateStr } from './dateUtils.ts';
import { readStoredJson, writeStorage } from './storage.ts';
import { withTimeout } from './asyncUtils.ts';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use provisioned firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

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
  completedDates: string[];
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

function isRoutine(value: unknown): value is SpiritualRoutine {
  return !!value && typeof value === 'object' && 'id' in value && typeof value.id === 'string'
    && 'userId' in value && typeof value.userId === 'string'
    && 'title' in value && typeof value.title === 'string'
    && 'time' in value && typeof value.time === 'string'
    && 'enabled' in value && typeof value.enabled === 'boolean'
    && 'category' in value && typeof value.category === 'string'
    && 'completedDates' in value && Array.isArray(value.completedDates)
    && value.completedDates.every(d => typeof d === 'string');
}

function isNote(value: unknown): value is MeditationNote {
  return !!value && typeof value === 'object' && 'id' in value && typeof value.id === 'string'
    && 'userId' in value && typeof value.userId === 'string'
    && 'title' in value && typeof value.title === 'string'
    && 'content' in value && typeof value.content === 'string'
    && 'date' in value && typeof value.date === 'string'
    && 'createdAt' in value && typeof value.createdAt === 'string';
}

function isProfile(value: unknown): value is UserProfileData {
  if (!value || typeof value !== 'object') return false;
  return 'liturgicalRegion' in value && typeof value.liturgicalRegion === 'string'
    && 'bibleFontSize' in value && typeof value.bibleFontSize === 'number'
    && Number.isFinite(value.bibleFontSize) && value.bibleFontSize >= 12 && value.bibleFontSize <= 32
    && 'audioEnabled' in value && typeof value.audioEnabled === 'boolean'
    && 'sacredArtStyle' in value && ['sacred', 'minimal'].includes(String(value.sacredArtStyle))
    && 'currentStreak' in value && typeof value.currentStreak === 'number' && Number.isSafeInteger(value.currentStreak) && value.currentStreak >= 0
    && 'totalRosaries' in value && typeof value.totalRosaries === 'number' && Number.isSafeInteger(value.totalRosaries) && value.totalRosaries >= 0
    && 'updatedAt' in value && typeof value.updatedAt === 'string';
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
    const existing = await withTimeout(getDoc(userDocRef));
    const previous: unknown = existing.data();
    if (existing.exists() && !isProfile(previous)) throw new Error('Perfil remoto inválido.');
    const prev = isProfile(previous) ? previous : null;
    const merged: UserProfileData = {
      displayName: user.displayName || user.email?.split('@')[0] || 'Peregrino',
      email: user.email || '',
      liturgicalRegion: 'Colombia',
      bibleFontSize: data.bibleFontSize || prev?.bibleFontSize || 20,
      audioEnabled: data.audioEnabled !== undefined ? data.audioEnabled : (prev?.audioEnabled ?? true),
      sacredArtStyle: data.sacredArtStyle || prev?.sacredArtStyle || 'sacred',
      currentStreak: data.currentStreak !== undefined ? data.currentStreak : (prev?.currentStreak || 0),
      totalRosaries: data.totalRosaries !== undefined ? data.totalRosaries : (prev?.totalRosaries || 0),
      ...(data.lastPrayedDate || prev?.lastPrayedDate ? { lastPrayedDate: data.lastPrayedDate || prev?.lastPrayedDate } : {}),
      updatedAt: new Date().toISOString(),
    };
    await withTimeout(setDoc(userDocRef, merged, { merge: true }));
    writeStorage(`lumen_profile_${user.uid}`, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('Could not sync profile to Firestore, saving to localStorage:', err);
    const updated: UserProfileData = {
      displayName: user.displayName || 'Peregrino',
      email: user.email || '',
      bibleFontSize: 20, audioEnabled: true,
      sacredArtStyle: 'sacred', currentStreak: 0, totalRosaries: 0,
      ...readStoredJson(`lumen_profile_${user.uid}`, isProfile),
      ...data, liturgicalRegion: 'Colombia', updatedAt: new Date().toISOString(),
    };
    if (!writeStorage(`lumen_profile_${user.uid}`, JSON.stringify(updated))) throw err;
    return updated;
  }
}

export async function getUserProfile(user: User): Promise<UserProfileData> {
  try {
    const snap = await withTimeout(getDoc(doc(db, 'users', user.uid)));
    if (snap.exists()) {
      const value: unknown = snap.data();
      if (!isProfile(value)) throw new Error('Perfil remoto inválido.');
      return { ...value, liturgicalRegion: 'Colombia' };
    }
  } catch (e) {
    console.warn('Error fetching user profile:', e);
  }
  const fallback = readStoredJson(`lumen_profile_${user.uid}`, isProfile);
  if (fallback) return fallback;
  return {
    displayName: user.displayName || (user.isAnonymous ? 'Peregrino Invitado' : 'Fiel de Cristo'),
    email: user.email || '',
    liturgicalRegion: 'Colombia',
    bibleFontSize: 20,
    audioEnabled: true,
    sacredArtStyle: 'sacred',
    currentStreak: 0,
    totalRosaries: 0,
    updatedAt: new Date().toISOString()
  };
}

// Routines sync
export async function getRoutines(userId: string): Promise<SpiritualRoutine[]> {
  const localKey = `lumen_routines_${userId}`;
  const defaults: SpiritualRoutine[] = DEFAULT_ROUTINES.map(r => ({ ...r, userId, completedDates: [] }));
  const completeList = (list: SpiritualRoutine[]) => [
    ...defaults.filter(r => !list.some(saved => saved.id === r.id)), ...list,
  ];
  if (userId !== 'guest') try {
    const ref = collection(db, 'users', userId, 'routines');
    const snap = await withTimeout(getDocs(ref));
    const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    if (!list.every(isRoutine)) throw new Error('Rutinas remotas inválidas.');
    const complete = completeList(list);
    writeStorage(localKey, JSON.stringify(complete));
    return complete;
  } catch (e) {
    console.warn('Could not load routines from Firestore, using local backup:', e);
  }

  const stored = readStoredJson(localKey, (value): value is SpiritualRoutine[] =>
    Array.isArray(value) && value.every(isRoutine));
  if (stored) return completeList(stored);
  if (!writeStorage(localKey, JSON.stringify(defaults))) throw new Error('No se pudieron guardar las rutinas.');
  return defaults;
}

export async function saveRoutine(userId: string, routine: SpiritualRoutine): Promise<void> {
  const localKey = `lumen_routines_${userId}`;
  try {
    const list = await getRoutines(userId);
    const idx = list.findIndex(r => r.id === routine.id);
    if (idx >= 0) list[idx] = routine;
    else list.push(routine);
    if (userId !== 'guest') {
      const docRef = doc(db, 'users', userId, 'routines', routine.id);
      await withTimeout(setDoc(docRef, routine, { merge: true }));
    }
    if (!writeStorage(localKey, JSON.stringify(list)) && userId === 'guest') throw new Error('No se pudo guardar la rutina.');
  } catch (e) {
    console.warn('Error saving routine to Firestore:', e);
    throw e;
  }
}

// Notes sync
export async function getNotes(userId: string): Promise<MeditationNote[]> {
  if (userId !== 'guest') try {
    const ref = collection(db, 'users', userId, 'notes');
    const snap = await withTimeout(getDocs(ref));
    const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    if (!list.every(isNote)) throw new Error('Notas remotas inválidas.');
    writeStorage(`lumen_notes_${userId}`, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Using local notes:', e);
  }
  return readStoredJson(`lumen_notes_${userId}`, (value): value is MeditationNote[] =>
    Array.isArray(value) && value.every(isNote)) || [];
}

export async function saveNote(userId: string, note: MeditationNote): Promise<void> {
  const localKey = `lumen_notes_${userId}`;
  try {
    const list = await getNotes(userId);
    const idx = list.findIndex(n => n.id === note.id);
    if (idx >= 0) list[idx] = note;
    else list.unshift(note);
    if (userId !== 'guest') {
      const docRef = doc(db, 'users', userId, 'notes', note.id);
      await withTimeout(setDoc(docRef, note));
    }
    if (!writeStorage(localKey, JSON.stringify(list)) && userId === 'guest') throw new Error('No se pudo guardar la nota.');
  } catch (e) {
    console.warn('Error saving note:', e);
    throw e;
  }
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const localKey = `lumen_notes_${userId}`;
  try {
    const list = await getNotes(userId);
    const filtered = list.filter(n => n.id !== noteId);
    if (userId !== 'guest') {
      const docRef = doc(db, 'users', userId, 'notes', noteId);
      await withTimeout(deleteDoc(docRef));
    }
    if (!writeStorage(localKey, JSON.stringify(filtered)) && userId === 'guest') throw new Error('No se pudo eliminar la nota local.');
  } catch (e) {
    console.warn('Error deleting note:', e);
    throw e;
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
  if (!target) throw new Error('La rutina no existe.');
  const today = getTodayDateStr();
  let completedDates = target?.completedDates || [];
  if (completed) {
    if (!completedDates.includes(today)) completedDates = [...completedDates, today];
  } else {
    completedDates = completedDates.filter(d => d !== today);
  }
  const updated: SpiritualRoutine = { ...target, completedDates };
  await saveRoutine(userId, updated);
  return updated;
}

export async function updateUserPrayerStats(userId: string, rosariesIncrement = 1): Promise<void> {
  if (!Number.isSafeInteger(rosariesIncrement) || rosariesIncrement < 0) throw new Error('Incremento inválido.');
  if (userId === 'guest') {
    const key = 'lumen_guest_rosaries';
    const previous = readStoredJson(key, (v): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) || 0;
    if (!writeStorage(key, JSON.stringify(previous + rosariesIncrement))) throw new Error('No se pudo guardar la oración.');
    return;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await withTimeout(getDoc(userDocRef));
    if (snap.exists()) {
      await withTimeout(updateDoc(userDocRef, {
        totalRosaries: increment(rosariesIncrement),
        lastPrayedDate: getTodayDateStr(),
        updatedAt: new Date().toISOString()
      }));
    } else throw new Error('El perfil no está disponible.');
  } catch (e) {
    console.warn('Error updating prayer stats:', e);
    throw e;
  }
}
