// Single source of truth for all XP values in the app.
// Every feature should read from here so values stay consistent.
export const XP = {
  // every correct quiz answer (subject quiz, lesson, summit, review, past papers)
  perCorrect: 10,
  // get every question right in one run
  perfectBonus: 20,
  // marking a term "learned" in the glossary — FIRST time only (see App)
  perTermLearned: 5,
  // finishing an entire lesson on the stairs (completion bonus)
  lessonComplete: 20,
  // passing the summit mega-quiz (added to per-correct XP)
  summitPass: 30,
  // answering the daily featured question
  qotd: 10,
  // completing a study sprint session
  sprint10: 20,
  sprint15: 50,
  // claiming the monthly challenge
  challengeReward: 50,
  // handing in one Section-B self-assessment
  essayReward: 10,
  // unlocking a worked-solution explainer for one missed question
  solutionCost: 10,
};
