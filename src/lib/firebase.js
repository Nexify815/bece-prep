// Firebase integration: accounts (username + PIN) and cross-device progress
// sync via Realtime Database. Everything degrades gracefully when Firebase
// isn't configured (the app then just works as a local-only offline app).

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as fbSignOut,
} from "firebase/auth";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

// A username becomes a synthetic email for Firebase Auth. Child accounts get
// a real e-mail feel without needing one; the PIN is the account password.
const EMAIL_DOMAIN = "@studybuddy.local";

export function isConfigured() {
  return (
    !!import.meta.env.VITE_FIREBASE_API_KEY &&
    !!import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    !!import.meta.env.VITE_FIREBASE_DATABASE_URL
  );
}

let app = null;
let auth = null;
let db = null;

function ensure() {
  if (!isConfigured()) return false;
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    });
  }
  if (!auth) auth = getAuth(app);
  if (!db) db = getDatabase(app);
  return true;
}

// normalize + validate a username typed by the child
export function normalizeUsername(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
}

export function validUsername(raw) {
  return /^[a-z0-9._-]{3,20}$/.test(normalizeUsername(raw));
}

export function validPin(raw) {
  return /^[0-9]{4,6}$/.test(String(raw || "").trim());
}

export function pinError(raw) {
  const s = String(raw || "").trim();
  if (s.length < 4 || s.length > 6) return "PIN must be 4–6 digits.";
  if (!/^[0-9]+$/.test(s)) return "PIN should be numbers only.";
  return "";
}

function emailFor(username) {
  return normalizeUsername(username) + EMAIL_DOMAIN;
}

// ---- auth ----

export async function signUp(username, pin) {
  if (!ensure()) throw new Error("Cloud sync is not configured on this app.");
  const cred = await createUserWithEmailAndPassword(auth, emailFor(username), String(pin).trim());
  return cred.user;
}

export async function signIn(username, pin) {
  if (!ensure()) throw new Error("Cloud sync is not configured on this app.");
  const cred = await signInWithEmailAndPassword(auth, emailFor(username), String(pin).trim());
  return cred.user;
}

export function signOut() {
  if (auth) fbSignOut(auth);
}

export function onUser(cb) {
  if (!ensure()) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export function currentUser() {
  return auth ? auth.currentUser : null;
}

// ---- cloud state sync (Realtime Database) ----

function userRef(uid) {
  return ref(db, "progress/" + uid);
}

// newest write wins across devices; a writeId distinguishes our own writes
// from remote ones so we can ignore our echo.
export function nextWriteId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function fetchCloudState(uid) {
  if (!ensure() || !uid) return null;
  const snap = await get(userRef(uid)); // may throw — let the caller handle it
  return snap.exists() ? snap.val() || null : null;
}

export async function seedCloudState(uid, state, writeId = nextWriteId()) {
  if (!ensure() || !uid) return writeId;
  await set(userRef(uid), { state, writeId });
  return writeId;
}

export function pushState(uid, state, writeId = nextWriteId()) {
  if (!ensure() || !uid) return Promise.resolve();
  return set(userRef(uid), { state, writeId });
}

// Returns an unsubscribe function. Callback receives { state, writeId }.
// onError is called with any server/permission error instead of crashing.
export function watchState(uid, cb, onError) {
  if (!ensure() || !uid) return () => {};
  return onValue(
    userRef(uid),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      if (!data || !data.state) return;
      cb(data);
    },
    onError ? (err) => onError(err) : undefined
  );
}