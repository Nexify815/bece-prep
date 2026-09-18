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

// New accounts must use a 6-digit PIN (a 4-digit PIN is trivially guessable);
// sign-in still accepts the older 4–6 digit PINs so existing accounts work.
export const PIN_LENGTH = 6;

export function validPin(raw) {
  return new RegExp(`^[0-9]{${PIN_LENGTH}}$`).test(String(raw || "").trim());
}

export function pinError(raw, { signup = false } = {}) {
  const s = String(raw || "").trim();
  if (signup) {
    if (s.length !== PIN_LENGTH) return `PIN must be exactly ${PIN_LENGTH} digits.`;
  } else if (s.length < 4 || s.length > 6) {
    return "PIN must be 4–6 digits.";
  }
  if (!/^[0-9]+$/.test(s)) return "PIN should be numbers only.";
  return "";
}

// ---- client-side brute-force throttle (best effort; server rules still gate) ----
const AUTH_FAIL_KEY = "sb_auth_fails";
const MAX_AUTH_FAILS = 5;
const AUTH_LOCK_MS = 15 * 60 * 1000;

function readAuthFails() {
  try {
    const raw = JSON.parse(localStorage.getItem(AUTH_FAIL_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((t) => Date.now() - t < AUTH_LOCK_MS) : [];
  } catch {
    return [];
  }
}

export function authLockRemainingMs() {
  const fails = readAuthFails();
  if (fails.length < MAX_AUTH_FAILS) return 0;
  const oldest = Math.min(...fails.slice(-MAX_AUTH_FAILS));
  return Math.max(0, AUTH_LOCK_MS - (Date.now() - oldest));
}

export function recordAuthFailure() {
  const fails = readAuthFails();
  fails.push(Date.now());
  try {
    localStorage.setItem(AUTH_FAIL_KEY, JSON.stringify(fails.slice(-20)));
  } catch {
    /* ignore */
  }
}

export function clearAuthFailures() {
  try {
    localStorage.removeItem(AUTH_FAIL_KEY);
  } catch {
    /* ignore */
  }
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

// ---- leaderboard (optional; needs `leaderboard` rules opened — gracefully
// degrades to local-only stats when rules block the shared path) ----

function boardRef(uid) {
  return ref(db, "progress/" + uid + "/board");
}

function leaderboardRef() {
  return ref(db, "leaderboard");
}

// Write our own score to the shared board (best effort). Also always saves a
// copy under our own progress subtree so the data survives rule changes.
export async function pushLeaderboard(uid, entry) {
  if (!ensure() || !uid) return false;
  try {
    await set(leaderboardRef() + "/" + uid, entry);
  } catch {
    // shared path blocked by rules — still record locally
  }
  try {
    await set(boardRef(uid), { entry, updated: Date.now() });
  } catch {
    /* ignore */
  }
  return true;
}

export function watchLeaderboard(cb, onError) {
  if (!ensure()) return () => {};
  return onValue(leaderboardRef(), cb, onError || (() => {}));
}