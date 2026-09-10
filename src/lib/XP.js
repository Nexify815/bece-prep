// Single source of truth for all XP values in the app.
// Every feature should read from here so values stay consistent.
//
// Balanced so learning actions and XP sinks feel fair: correct answers are
// cheap (5), big milestones (lesson/summit/essay) pay out more, and spending
// is affordable but never free.
export const XP = {
  // every correct quiz answer (subject quiz, lesson, summit, review, past papers)
  perCorrect: 5,
  // get every question right in one run
  perfectBonus: 15,
  // marking a term "learned" in the glossary — FIRST time only (see App)
  perTermLearned: 10,
  // finishing an entire lesson on the stairs (completion bonus)
  lessonComplete: 50,
  // passing the summit mega-quiz (added to per-correct XP)
  summitPass: 100,
  // answering the daily featured question
  qotd: 15,
  // completing a study sprint session
  sprint10: 20,
  sprint15: 35,
  // claiming the monthly challenge
  challengeReward: 100,
  // handing in one Section-B self-assessment
  essayReward: 20,
  // unlocking a worked-solution explainer for one missed question
  solutionCost: 30,
  // the quiz "hint" that removes two wrong options / reveals a first letter
  hintCost: 15,
  // buying a single heart back (the only way to pay XP for a life)
  heartCost: 25,
};
