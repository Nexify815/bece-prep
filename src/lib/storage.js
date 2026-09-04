const STORE_KEY = "studybuddy.v1";

export const MAX_HEARTS = 5;
// restore one heart every this many ms
const HEART_RESTORE_MS = 20 * 60 * 1000; // 20 minutes

// ---- sample-profile seeders (demo data so reports/shop look alive) ----
// Generates learned-term keys like "science:sci-001".
function seedTerms(subject, prefix, count) {
  const out = {};
  for (let i = 1; i <= count; i++) {
    out[`${subject}:${prefix}-${String(i).padStart(3, "0")}`] = true;
  }
  return out;
}

// {"math": { easy: {...} }} -> {"math.easy": {...}}
function seedQuizzes(scores) {
  const out = {};
  Object.entries(scores).forEach(([subject, diffs]) => {
    Object.entries(diffs).forEach(([d, v]) => {
      out[`${subject}.${d}`] = v;
    });
  });
  return out;
}

const defaultState = () => ({
  // NOTE: xp / streak / learnedTerms / quizScores are a SAMPLE profile for
  // demos — remove these fields below for a truly fresh start for the brother.
  // Story: ~3 weeks of daily use (~21-day streak). Every subject touched a
  // little; the smaller subjects (French/ICT/Ghanaian) are early/light.
  xp: 1520,
  streak: 21,
  lastPracticeDay: todayKey(),
  learnedTerms: {
    // 513-term glossary across 7 subjects
    ...seedTerms("math", "math", 42),
    ...seedTerms("science", "sci", 55),
    ...seedTerms("english", "eng", 28),
    ...seedTerms("social", "soc", 26),
    ...seedTerms("french", "fr", 6),
    ...seedTerms("ict", "ict", 7),
    ...seedTerms("ghanaian", "ak", 5),
  },
  // { "subject.difficulty": { best, attempts } } — favouring high bests so the
  // report's "Avg. quiz score" lands near 78-80%.
  quizScores: seedQuizzes({
    math: { easy: { best: 82, attempts: 4 }, medium: { best: 75, attempts: 3 }, hard: { best: 68, attempts: 2 } },
    science: { easy: { best: 95, attempts: 6 }, medium: { best: 88, attempts: 4 }, hard: { best: 80, attempts: 3 } },
    english: { easy: { best: 85, attempts: 4 }, medium: { best: 78, attempts: 3 }, hard: { best: 70, attempts: 2 } },
    social: { easy: { best: 84, attempts: 3 }, medium: { best: 76, attempts: 3 }, hard: { best: 66, attempts: 2 } },
    french: { easy: { best: 70, attempts: 2 } },
    ict: { easy: { best: 72, attempts: 2 } },
    ghanaian: { easy: { best: 68, attempts: 1 } },
  }),
  wrongAnswers: [
    { subject: "math", qid: "math-q-005", count: 1, lastWrong: Date.now() },
    { subject: "math", qid: "math-q-009", count: 2, lastWrong: Date.now() },
    { subject: "english", qid: "eng-q-003", count: 1, lastWrong: Date.now() },
    { subject: "social", qid: "soc-q-002", count: 1, lastWrong: Date.now() },
    { subject: "social", qid: "soc-q-004", count: 2, lastWrong: Date.now() },
    { subject: "science", qid: "sci-q-010", count: 1, lastWrong: Date.now() },
  ],
  completedLessons: {},     // { "science:Materials": true }
  passedSummit: { science: true, math: true, english: true }, // passed the top mega-quiz
  hearts: MAX_HEARTS,       // lives; lose one per wrong answer
  heartsUpdatedAt: Date.now(), // timestamp of last heart change
  // ----- store / cosmetics -----
  ownedSkins: ["cat"],     // skin keys the user owns (never empty — cat is free)
  skin: "cat",             // currently equipped skin key
  ownedThemes: ["day"],     // theme keys the user owns
  theme: "day",            // currently equipped theme key
  boosts: { xp2x: 0, streakFreeze: 0 }, // consumables
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
