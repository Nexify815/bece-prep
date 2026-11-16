import { buildPath, getSubject } from "../data/index.js";

// TEMPORARY: set to true to open every subject's flashcard deck so it can be
// reviewed, then set back to false to restore the half-Stairs gate.
export const TEMP_FLASHCARDS_OPEN = true;

// Progress gate for the subject-wide Flashcard deck.
//
// The deck is review, not the final exam: it opens once half of the subject's
// Stairs lessons are finished. Passing the Summit also counts (by then there
// is nothing left to climb), it is just no longer the requirement.
export function stairsProgress(subjectKey, completedLessons) {
  const subject = getSubject(subjectKey);
  const total = subject ? buildPath(subject).length : 0;
  const done = Object.keys(completedLessons || {}).filter(
    (k) => completedLessons[k] && k.startsWith(`${subjectKey}:`)
  ).length;
  const needed = total ? Math.ceil(total / 2) : 0;
  return {
    done: Math.min(done, total),
    total,
    needed,
    unlocked: TEMP_FLASHCARDS_OPEN || (total > 0 && done >= needed),
  };
}
