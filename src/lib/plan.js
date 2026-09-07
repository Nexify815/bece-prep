import { SUBJECTS, buildPath, getSubject } from "../data/index.js";

// Fantasy-free plain helper: picks what to study and in what order, based on
// real progress data (completed lessons, learned terms, quiz scores, mistakes).

export const DAILY_GOAL_MIN = 120;
// one quiz run = a short session from a difficulty's set
export const QUIZ_SESSION = 15;

// 0-100 "getting there" score for one subject. Lower = weaker = needs more time.
function subjectScore(state, subject) {
  const key = subject.key;
  const path = buildPath(subject);
  const totalLessons = path.length;
  const doneLessons = path.filter(
    (l) => !!state.completedLessons[`${key}:${l.sub}`]
  ).length;
  const totalTerms = subject.data.glossary.length;
  const learnedTerms = Object.keys(state.learnedTerms || {}).filter((k) =>
    k.startsWith(`${key}:`)
  ).length;

  let avgQuiz = 0;
  let quizCount = 0;
  ["easy", "medium", "hard"].forEach((d) => {
    const rec = (state.quizScores || {})[`${key}.${d}`];
    if (rec && rec.attempts > 0) {
      avgQuiz += rec.best;
      quizCount += 1;
    }
  });
  if (quizCount > 0) avgQuiz /= quizCount;

  const wrong = (state.wrongAnswers || []).filter((w) => w.subject === key).length;

  const pLessons = totalLessons ? doneLessons / totalLessons : 0;
  const pTerms = totalTerms ? learnedTerms / totalTerms : 0;
  const pQuiz = quizCount > 0 ? avgQuiz / 100 : 0;

  // Mix: lessons + terms = learning progress; quiz + mistakes = mastery.
  const score = pLessons * 0.35 + pTerms * 0.25 + pQuiz * 0.3 - wrong * 0.02;
  return { score, pLessons, pTerms, pQuiz, doneLessons, totalLessons, wrong };
}

export function weakestFirst(state) {
  return SUBJECTS.slice()
    .map((s) => ({ subject: s, stats: subjectScore(state, s) }))
    .sort((a, b) => a.stats.score - b.stats.score);
}

// The subject to focus on today: the weakest among the 4 core BECE subjects.
function pickFocus(all) {
  const core = ["math", "science", "english", "social"];
  const ranked = all.sort((a, b) => a.stats.score - b.stats.score);
  return ranked.find((r) => core.includes(r.subject.key)) || ranked[0];
}

// Which quiz difficulty has the fewest attempts for this subject?
function weakestDifficulty(state, key) {
  const scores = state.quizScores || {};
  let best = "easy";
  let min = Infinity;
  ["easy", "medium", "hard"].forEach((d) => {
    const rec = scores[`${key}.${d}`];
    const attempts = rec ? rec.attempts : 0;
    if (attempts < min) {
      min = attempts;
      best = d;
    }
  });
  return best;
}

const DIFF_NAME = { easy: "Easy", medium: "Medium", hard: "Hard" };

// Full question-set sizes for a subject (Easy / Medium / Hard). A single Quiz
// run covers the entire chosen set — there is no shorter option.
export function questionSets(key) {
  const subject = getSubject(key);
  const all = (subject && subject.data && subject.data.questions) || [];
  const set = { easy: 0, medium: 0, hard: 0 };
  all.forEach((q) => {
    if (set[q.difficulty] != null) set[q.difficulty] += 1;
  });
  return set;
}

// The real size of the chosen difficulty's question set (the whole set is run
// in a single Quiz run — there is no 10-question option).
export function quizRunCount(state, key) {
  const subject = getSubject(key);
  const diff = weakestDifficulty(state, key);
  const all = (subject && subject.data && subject.data.questions) || [];
  const count = all.filter((q) => q.difficulty === diff).length;
  return { diff, name: DIFF_NAME[diff], count };
}

// Next incomplete lesson's sub-strand name for the subject (for copy text).
export function nextLessonCopy(state, key) {
  const subject = getSubject(key);
  if (!subject) return null;
  const path = buildPath(subject);
  const next = path.find((l) => !state.completedLessons[`${key}:${l.sub}`]);
  if (!next) return null;
  return next.sub;
}

// Build today's concrete plan (focus subject + ordered study steps).
// The required steps always add up to the 2-hour daily goal (120 minutes).
export function todayPlan(state) {
  const all = weakestFirst(state);
  const focus = pickFocus(all);
  const key = focus.subject.key;
  const name = focus.subject.name;
  const steps = [];

  // 1) Learn — continue the Stairs path (lesson + its end-of-lesson mini quiz).
  const next = nextLessonCopy(state, key);
  steps.push({
    icon: "\u{1F3C3}",
    title: "Learn the next lesson",
    detail: next
      ? `${name}: continue your Stairs in "${next}"
        — read the terms, then answer the lesson quiz at the end`
      : `${name}: finish it with the summit quiz`,
    route: `/subject/${key}/path`,
    min: 40,
  });

  // 2) Glossary — learn new terms (plain definitions, the core fix).
  steps.push({
    icon: "\u{1F4D6}",
    title: "Discover new terms",
    detail: `Open the ${name} glossary and learn 5 new words`,
    route: `/subject/${key}/glossary`,
    min: 20,
  });

  // 3) Quiz — a short session from the level attempted least. Runs draw 15
  //    fresh questions from that difficulty's set until the whole set is done.
  const { name: diffName, count } = quizRunCount(state, key);
  steps.push({
    icon: "\u{1F3AF}",
    title: `Practice quiz — ${diffName}`,
    detail: `${name}: complete a ${QUIZ_SESSION}-question run of the ${diffName.toLowerCase()} set — every run feeds you fresh questions until all ${count} are done`,
    route: `/subject/${key}/quiz`,
    min: 30,
  });

  // 4) Fill the last 30 minutes.
  const wrongCount = state.wrongAnswers?.length || 0;
  if (wrongCount > 0) {
    steps.push({
      icon: "\u{1F4CB}",
      title: "Fix your mistakes",
      detail: `You have ${wrongCount} wrong answer${wrongCount === 1 ? "" : "s"} in your review bank — clear them all`,
      route: "/review",
      min: 30,
    });
  } else {
    steps.push({
      icon: "\u{1F4C5}",
      title: "Exam practice",
      detail: `No mistakes to fix yet — do the ${name} past paper or the Mock Exam`,
      route: "/mock-exam",
      min: 30,
    });
  }

  const totalMin = steps.reduce((sum, s) => sum + s.min, 0);
  return { focus: { key, name }, steps, totalMin };
}

// A week of focus days (personalized order, weakest core subject leads).
export function weekPlan(state) {
  const all = weakestFirst(state);
  const coreOrder = all
    .filter((r) => ["math", "science", "english", "social"].includes(r.subject.key))
    .map((r) => r.subject);
  const weakest = coreOrder[0];
  const second = coreOrder[1];
  const extras = all.filter(
    (r) => !["math", "science", "english", "social"].includes(r.subject.key)
  );
  const extra = extras[0] ? extras[0].subject : null;

  const days = [
    { key: "mon", label: "Monday", focus: weakest, note: "Deep focus on your weakest subject. Do every step of today's plan." },
    { key: "tue", label: "Tuesday", focus: second ? second : weakest, note: "Switch subject but keep the same steps: Stairs > Glossary > Quiz." },
    { key: "wed", label: "Wednesday", focus: weakest, note: "Same subject again. Repetition makes the terms stick." },
    { key: "thu", label: "Thursday", focus: coreOrder[2] || weakest, note: "A fresh subject keeps things interesting." },
    { key: "fri", label: "Friday", focus: coreOrder[3] || weakest, note: "Round out the week with a subject you haven't touched." },
    { key: "sat", label: "Saturday", focus: extra, note: extra ? `${extra.name} + one full Mock Exam. Test-day practice!` : "One full Mock Exam. Test-day practice!" },
    { key: "sun", label: "Sunday", focus: null, note: "Light day: review mistakes + browse any glossary. Keep your streak!" },
  ];
  return days;
}