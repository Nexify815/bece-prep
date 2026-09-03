const STORE_KEY = "studybuddy.v1";

const defaultState = () => ({
  xp: 0,
  streak: 0,
  lastPracticeDay: null,
  learnedTerms: {},         // { "math:sci-001": true }
  quizScores: {},           // { "math": { easy: {best, attempts}, medium: ..., hard: ... } }
  wrongAnswers: [],         // [{ subject, qid, count, lastWrong }]
  completedLessons: {},     // { "science:Materials": true }
  passedSummit: {},         // { "science": true } — passed the top mega-quiz
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
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
  if (state.lastPracticeDay === today) {
    // already counted today
  } else if (isYesterday(state.lastPracticeDay)) {
    streak += 1;
  } else {
    streak = 1;
  }
  return { ...state, streak, lastPracticeDay: today };
}

// Level = 1 + floor(xp / 100)
export function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

export function xpIntoLevel(xp) {
  return xp % 100;
}
