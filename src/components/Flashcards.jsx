import { useState } from "react";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";

// Reusable flashcard deck. Used three ways:
//  - as the post-lesson "checkpoint" on the Stairs (after passing a step)
//  - to replay a passed step's deck from the staircase
//  - as the full subject deck (unlocked once a subject's Summit is passed)
// Each card self-rates into the spaced-repetition system via onSRS.
export default function Flashcards({
  title = "Flashcards",
  subjectKey,
  deck = [],
  onSRS,
  compact = false,
  onFinish,
}) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [done, setDone] = useState(deck.length === 0);

  const total = deck.length;
  const card = deck[i];

  if (!card && !done) {
    return <p className="muted">No flashcards yet.</p>;
  }

  if (done) {
    return (
      <div className="center">
        <Mascot className="mascot-big" happy={total > 0 && knownCount === total} />
        <h2 className="results-title">Flashcards done!</h2>
        <p className="muted">
          You knew {knownCount} of {total} cards straight away
          {total > 0 ? ` (${Math.round((knownCount / total) * 100)}%).` : "."}
        </p>
        {onFinish && (
          <button className="btn btn-primary mt" onClick={onFinish}>
            Continue
          </button>
        )}
      </div>
    );
  }

  const rate = (knewIt) => {
    if (onSRS) onSRS(`${subjectKey}:${card.id}`, knewIt);
    if (knewIt) setKnownCount((n) => n + 1);
    if (i >= total - 1) {
      setDone(true);
    } else {
      setI(i + 1);
      setFlipped(false);
    }
  };

  return (
    <div className={"flash-page" + (compact ? " flash-compact" : "")}>
      <div className="quiz-top">
        <span className="quiz-count">{title}</span>
        <span className="quiz-count">Card {i + 1} / {total}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((i + 1) / total) * 100}%` }} />
      </div>
      <div
        className={"flash-card" + (flipped ? " flipped" : "")}
        onClick={() => setFlipped((v) => !v)}
      >
        {flipped ? (
          <div className="flash-face flash-back">
            <p className="flash-term">{card.definition}</p>
            {card.example && <p className="muted flash-example">{card.example}</p>}
          </div>
        ) : (
          <div className="flash-face flash-front">
            <p className="flash-term">{card.term}</p>
            <div className="flash-flip-hint">
              <ReadButton text={card.term} className="read-inline" />
              <span className="muted">Tap the card to flip</span>
            </div>
          </div>
        )}
      </div>
      {flipped && (
        <div className="flash-actions">
          <button className="btn btn-primary" onClick={() => rate(true)}>
            I knew it
          </button>
          <button className="btn btn-secondary" onClick={() => rate(false)}>
            Still learning
          </button>
        </div>
      )}
      {!flipped && (
        <p className="muted center flash-note">
          Say the meaning first, then tap to check yourself.
        </p>
      )}
    </div>
  );
}