import { useState } from "react";
import { getSubject } from "../data/index.js";

// Step-by-step "worked solution" for any question, generated on the fly from
// the question's own explanation + the linked glossary term. Unlocking it for
// a question is an XP purchase (see App.onUnlockSolution).
export default function WorkedSolution({ question, subjectKey, unlocked, xp, onUnlock }) {
  const [open, setOpen] = useState(false);
  if (!question) return null;

  const subject = getSubject(subjectKey);
  const term = question.termId && subject
    ? (subject.data.glossary || []).find((t) => t.id === question.termId)
    : null;

  const steps = [
    { icon: "\u{1F4CC}", title: "Read it carefully", body: `Underline what the question is asking: “${question.question}”.` },
    term
      ? { icon: "\u{1F4D6}", title: "Recall the rule", body: `${term.term}: ${term.definition}` }
      : { icon: "\u{1F4D6}", title: "Know your basics", body: "What concept is this testing? Say it out loud before you answer." },
    { icon: "\u{2699}\u{FE0F}", title: "Work it out", body: question.explanation || "Use the rule above to get to your answer." },
    { icon: "\u{2705}", title: "Check your answer", body: `The correct option is “${question.correctAnswer}”. Did you get there? If not, redo the work-out step slowly.` },
  ];

  if (!unlocked) {
    return (
      <button className="btn btn-secondary mt" onClick={() => { if (onUnlock) onUnlock(); }}>
        &#128218; Unlock worked solution &middot; 10 XP {xp < 10 ? "(not enough XP)" : ""}
      </button>
    );
  }

  return (
    <div className="card mt solution-box">
      <div className="solution-head" role="button" tabIndex={0} onClick={() => setOpen(!open)}>
        <span className="solution-title">&#128218; Worked solution</span>
        <span className="solution-toggle">{open ? "\u25B2" : "\u25BC"}</span>
      </div>
      {open && (
        <ol className="solution-steps">
          {steps.map((s, i) => (
            <li key={i} className="solution-step">
              <span className="solution-step-icon">{s.icon}</span>
              <div>
                <b>{s.title}</b>
                <p className="muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}