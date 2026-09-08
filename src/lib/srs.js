// Spaced-repetition "review boxes" for glossary terms.
// Box index -> days until the next test.
import { todayKey, dateKey } from "./dates.js";

export const SRS_BOX_DAYS = [0, 1, 3, 7, 14, 30];

// The term key format used everywhere: "math:math-001".
export function termKey(subjectKey, termId) {
  return `${subjectKey}:${termId}`;
}

// Add `n` days to a date key "YYYY-MM-DD".
export function addDays(key, n) {
  const [y, m, d] = String(key).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return dateKey(date);
}

// Register a correct/wrong answer for a term. Returns the new srs map.
export function scheduleSRS(srs, key, correct) {
  const cur = srs[key] || { box: 0, due: todayKey() };
  if (correct) {
    const box = Math.min(cur.box + 1, SRS_BOX_DAYS.length - 1);
    return { ...srs, [key]: { box, due: addDays(todayKey(), SRS_BOX_DAYS[box]) } };
  }
  return { ...srs, [key]: { box: 0, due: todayKey() } };
}

// Pull overdue terms forward to today so the "due soon" view never empties.
export function graceSRS(srs) {
  const today = todayKey();
  const out = {};
  Object.keys(srs || {}).forEach((k) => {
    const v = srs[k];
    out[k] = v.due < today ? { ...v, due: today } : v;
  });
  return out;
}

// Keys whose due date is today or earlier.
export function dueSRSKeys(srs) {
  const today = todayKey();
  return Object.keys(srs || {}).filter((k) => (srs[k].due || today) <= today);
}