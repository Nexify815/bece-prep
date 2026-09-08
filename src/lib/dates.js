// Lightweight date helpers used across features (heatmap, challenges,
// question-of-the-day, reports). No dependencies.

export function pad(n) {
  return String(n).padStart(2, "0");
}

// "YYYY-MM-DD" for a Date (or now).
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function daysFromTodayKey(n) {
  return dateKey(daysAgo(n));
}

// ["YYYY-MM-DD" ... oldest -> newest] for the last `n` days including today.
export function pastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(daysFromTodayKey(i));
  return out;
}

// Alias matching the name used by the progress report heatmap.
export function lastNDays(n) {
  return pastDays(n);
}

// "YYYY-MM" month bucket of a date key.
export function monthKeyOf(key) {
  return String(key || "").slice(0, 7);
}

export function currentMonthKey() {
  return todayKey().slice(0, 7);
}

// "YYYY-MM-DD" of the Sunday that starts the week containing `key`.
export function weekKeyOf(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const shift = (date.getDay() + 6) % 7; // Monday-first week
  date.setDate(date.getDate() - shift);
  return dateKey(date);
}

export function currentWeekKey() {
  return weekKeyOf(todayKey());
}

// Hours between two ISO-ish day keys (used to compute streak gaps).
export function dayDiff(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((da - db) / 86400000);
}

// Deterministic 32-bit hash of a string (FNV-1a).
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}