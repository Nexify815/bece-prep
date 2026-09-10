import { FiLock } from "react-icons/fi";
import { getSubject } from "../data/index.js";
import Mascot from "./Mascot.jsx";
import Flashcards from "./Flashcards.jsx";

// Subject-wide flashcard deck on /subject/:key/flashcards.
// Unlocked only after the subject's Summit is passed (per-step decks live on
// the Stairs and are always available for completed steps).
export default function SubjectFlashcards({ subjectKey, passedSummit, onSRS }) {
  const subject = getSubject(subjectKey);
  if (!subject) {
    return (
      <div className="center">
        <p className="muted">Subject not found.</p>
      </div>
    );
  }

  const unlocked = !!(passedSummit && passedSummit[subjectKey]);
  const deck = subject.data.glossary || [];

  if (!unlocked) {
    return (
      <div className="center">
        <Mascot className="mascot-big" />
        <h2 className="results-title">Flashcards locked</h2>
        <p className="muted">
          Finish every step of the <b>Stairs</b> and pass the <b>Summit</b> to
          unlock a review deck of every term in {subject.name}.
        </p>
        <p className="muted">
          Tip: each completed step already unlocks its own flashcard round on
          the stairs.
        </p>
        <span className="locked-icon">
          <FiLock size={28} />
        </span>
      </div>
    );
  }

  return (
    <Flashcards
      subjectKey={subjectKey}
      deck={deck}
      title={`${subject.name} flashcards`}
      onSRS={onSRS}
    />
  );
}