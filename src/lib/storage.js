const STORE_KEY = "studybuddy.v1";

export const MAX_HEARTS = 5;
// restore one heart every this many ms
const HEART_RESTORE_MS = 20 * 60 * 1000; // 20 minutes

const defaultState = () => ({
  xp: 0,
  streak: 0,
  lastPracticeDay: null,
  learnedTerms: {},
  quizScores: {},
  wrongAnswers: [],
  completedLessons: {},
  passedSummit: {},
  // questions answered correctly, keyed "subject.difficulty" -> { qid: true }.
  // A "set" (Easy/Medium/Hard) is complete when every qid is solved; runs are
  // short sessions drawn from the still-unsolved pool.
  quizSolved: {},
  hearts: MAX_HEARTS,
  heartsUpdatedAt: Date.now(),
  ownedThemes: ["day"],
  theme: "day",
  boosts: { xp2x: 0, streakFreeze: 0 },
  // stair steps whose lesson quiz was failed (locked until a 1-heart retry)
  failedLessons: {},
  // user-created glossary terms under their own subject: [{id, subjectKey, term, definition, example}]
  customTerms: [],
  // daily active usage in seconds, keyed by date like "2026-09-07"
  usageSecs: {},
  // xp earned per day, keyed by date (drives heatmap, challenge + weekly recap)
  xpLog: {},
  // spaced-repetition state for glossary terms: "subject:term" -> {box, due}
  srs: {},
  // question of the day answers: date -> true/false (correct)
  qotdAnswered: {},
  // monthly challenge claims: "YYYY-MM" -> true
  challengesClaimed: {},
  // completed study sprints: [{ date, mins, xp }]
  sprints: [],
  // worked solutions bought by question id: qid -> true
  solutionsUnlocked: {},
  // earned badge keys: key -> date claimed/earned
  badges: {},
  // mock exam history: [{ date, pct, seconds, mode }]
  mockHistory: [],
  // completed plan steps per day: date -> { stepId: true } (Today's Plan)
  planDone: {},
  // frozen subject ordering for the current week ({ weekKey, core, extra })
  planWeek: null,
  // daily goal in seconds (DailyUsage shows this target). Default is 1 hour.
  goalSecs: 60 * 60,
  // reminder hour (0-23) for the daily goal notification, null = off
  notifHour: null,
  // optional leaderboard participation (cloud) + display name
  leaderboardOptIn: false,
  nickname: "",
});

// Add `secs` of active time to today's daily usage bucket in the state.
export function addUsage(state, secs) {
  if (!secs || secs <= 0) return state;
  const today = todayKey();
  const usageSecs = { ...(state.usageSecs || {}) };
  usageSecs[today] = (usageSecs[today] || 0) + secs;
  return { ...state, usageSecs };
}

// Add earned XP to today's xp log (used by heatmap, challenge, weekly recap).
export function addXpLog(state, amount) {
  if (!amount || amount <= 0) return state;
  const today = todayKey();
  const xpLog = { ...(state.xpLog || {}) };
  xpLog[today] = (xpLog[today] || 0) + amount;
  return { ...state, xpLog };
}

// Fold a pre-1h-default goal (2 hours) into the new default whenever a state
// arrives from anywhere — localStorage or a cloud copy on another device.
// One-time migration: remove once no stale cloud/local copies carry 7200.
export function sanitizeGoal(state) {
  if (!state || typeof state !== "object") return state;
  return state.goalSecs === 120 * 60 ? { ...state, goalSecs: 60 * 60 } : state;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return sanitizeGoal({ ...defaultState(), ...parsed });
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — fail silently
  }
}

// Portable text code containing the whole state, for transfer to another
// device ("backup & restore"). Device-specific daily usage isn't carried over.
export function encodeBackup(state) {
  const clean = { ...state };
  delete clean.usageSecs;
  const json = JSON.stringify(clean);
  return "SB1." + btoa(unescape(encodeURIComponent(json)));
}

export function decodeBackup(code) {
  const c = String(code || "").trim();
  if (!c.startsWith("SB1.")) throw new Error("That doesn't look like a StudyBuddy backup code.");
  const json = decodeURIComponent(escape(atob(c.slice(4))));
  const obj = JSON.parse(json);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("That code isn't valid.");
  return { ...defaultState(), ...obj };
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isYesterday(key) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return key === y;
}

// No gap logic — tracks consecutive days practiced.
export function touchedToday(state) {
  return state.lastPracticeDay === todayKey();
}

export function markPractice(state) {
  const today = todayKey();
  let streak = state.streak;
  let boosts = state.boosts;
  if (state.lastPracticeDay === today) {
    // already counted today
  } else if (isYesterday(state.lastPracticeDay)) {
    streak += 1;
  } else if ((boosts?.streakFreeze || 0) > 0 && state.streak > 0) {
    // missed a day, but a streak freeze saves the streak
    boosts = { ...boosts, streakFreeze: boosts.streakFreeze - 1 };
  } else {
    streak = 1;
  }
  return { ...state, streak, lastPracticeDay: today, boosts };
}

// Level = 1 + floor(xp / 100)
export function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

export function xpIntoLevel(xp) {
  return xp % 100;
}

// Compute how many hearts the player actually has right now, restoring based
// on elapsed time since the last heart change. Returns a fresh state object
// if hearts were restored, otherwise the same object.
export function healHearts(state) {
  const now = Date.now();
  const elapsed = now - (state.heartsUpdatedAt || now);
  const refills = Math.floor(elapsed / HEART_RESTORE_MS);
  if (refills <= 0) return state;
  const healed = Math.min(MAX_HEARTS, state.hearts + refills);
  if (healed === state.hearts) return state;
  return { ...state, hearts: healed, heartsUpdatedAt: now };
}

export function loseHeart(state) {
  const hearts = Math.max(0, state.hearts - 1);
  // Going from full -> not-full: start a fresh regen timer from now.
  // If already below full, keep the existing regen timeline running so the
  // countdown does NOT reset to 20:00 every time you miss another question.
  const heartsUpdatedAt =
    state.hearts >= MAX_HEARTS ? Date.now() : state.heartsUpdatedAt;
  return { ...state, hearts, heartsUpdatedAt };
}

// Returns milliseconds until the next heart is restored, or 0 if hearts are full.
export function msUntilNextHeart(state) {
  if (state.hearts >= MAX_HEARTS) return 0;
  const elapsed = Date.now() - (state.heartsUpdatedAt || Date.now());
  const remaining = HEART_RESTORE_MS - (elapsed % HEART_RESTORE_MS);
  return remaining > 0 ? remaining : 0;
}
