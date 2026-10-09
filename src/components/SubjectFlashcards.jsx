import { LuLock } from "react-icons/lu";
import { getSubject } from "../data/index.js";
import MatchingGame from "./MatchingGame.jsx";
import { navigate } from "../lib/router.js";
import { previewAll } from "../lib/dev.js";

// Subject-wide matching game on /subject/:key/flashcards.
// Unlocked only after the subject's Summit is passed (per-step games live on
// the Stairs and are always available for completed steps).
export default function SubjectFlashcards({ subjectKey, passedSummit, onSRS, onAddXp }) {
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

  // Temporary: preview toggle bypasses the Summit requirement.
  const unlocked = !!(passedSummit && passedSummit[subjectKey]) || previewAll();
  const deck = subject.data.glossary || [];

  if (!unlocked) {
    return (
      <div className="prep-page">
        <div className="prep-head">
          <h1>{subject.name} Match It</h1>
          <p>
            A review deck of every term in {subject.name}, once you have earned
            it.
          </p>
        </div>
        <div className="empty-card">
          <span className="empty-card-icon">
            <LuLock size={26} color="#9CA3AF" />
          </span>
          <h2>Flashcards locked</h2>
          <p className="muted">
            Finish every step of the <b>Stairs</b> and pass the <b>Summit</b> to
            unlock a review deck of all {deck.length} terms in {subject.name}.
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