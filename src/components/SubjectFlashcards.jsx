import { LuLock } from "react-icons/lu";
import { getSubject } from "../data/index.js";
import MatchingGame from "./MatchingGame.jsx";
import { navigate } from "../lib/router.js";
import { stairsProgress } from "../lib/unlocks.js";
import { previewAll } from "../lib/dev.js";

// Subject-wide matching game on /subject/:key/flashcards.
// Unlocked once half of the subject's Stairs lessons are finished (the Summit
// is the final exam, not the review gate). Per-step games live on the Stairs
// and are always available for completed steps.
export default function SubjectFlashcards({
  subjectKey,
  passedSummit,
  completedLessons,
  onSRS,
  onAddXp,
}) {
  const subject = getSubject(subjectKey);
  if (!subject) {
    return (
      <div className="prep-page">
        <div className="prep-head">
          <h1>Flashcards</h1>
          <p>That subject could not be found.</p>
        </div>
      </div>
    );
  }

  const stairs = stairsProgress(subjectKey, completedLessons);
  const summitDone = !!(passedSummit && passedSummit[subjectKey]);
  // Temporary: preview toggle bypasses the Stairs requirement.
  const unlocked = stairs.unlocked || summitDone || previewAll();
  const deck = subject.data.glossary || [];

  if (!unlocked) {
    return (
      <div className="prep-page">
        <div className="prep-head">
          <h1>{subject.name} Match It</h1>
          <p>
            A review deck of every term in {subject.name} — five random pairs per
            round — once you have finished half the Stairs.
          </p>
        </div>
        <div className="empty-card">
          <span className="empty-card-icon">
            <LuLock size={26} color="#9CA3AF" />
          </span>
          <h2>Flashcards locked</h2>
          <p className="muted">
            Finish half of the <b>Stairs</b> for {subject.name} to unlock a review
            deck of all {deck.length} terms. You have finished{" "}
            <b>
              {stairs.done} of {stairs.needed}
            </b>{" "}
            steps needed.
          </p>
          <p className="muted">
            Tip: each completed step already unlocks its own flashcard round on
            the stairs, so you can start playing now.
          </p>
          <button
            className="focus-btn"
            onClick={() => navigate("/subject/" + subjectKey + "/path")}
          >
            Go to the {subject.name} stairs
          </button>
        </div>
      </div>
    );
  }

  return (
    <MatchingGame
      subjectKey={subjectKey}
      deck={deck}
      title={`${subject.name} Match It`}
      onSRS={onSRS}
      onAddXp={onAddXp}
    />
  );
}