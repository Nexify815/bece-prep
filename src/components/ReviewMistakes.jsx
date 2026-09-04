import { useState, useEffect, useMemo } from "react";
import { getQuestion, getSubject } from "../data/index.js";
import { XP } from "../lib/XP.js";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(v) {
  if (v == null) return "";
  return String(v).toLowerCase().trim();
}

export default function ReviewMistakes({
  wrongAnswers,
  onAddXp,
  onLoseHeart,
  onClearWrong,
  onRunActiveChange,
  onLivesRunChange,
}) {
  const items = useMemo(() => {
    return (wrongAnswers || [])
      .map((w) => ({
        subject: w.subject,
        question: getQuestion(w.subject, w.qid),
      }))
      .filter((x) => x.question);
  }, [wrongAnswers]);

  const [queue, setQueue] = useState([]);      // [{subject, qid, question}]
  const [idx, setIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  // report run state to the shell (leave confirmation + out-of-lives modal)
  useEffect(() => {
    const active = started && !done;
    if (onRunActiveChange) onRunActiveChange(active);
    if (onLivesRunChange) onLivesRunChange(active);
  }, [started, done, onRunActiveChange, onLivesRunChange]);

  const start = () => {
    setQueue(shuffle(items));
    setIdx(0);
    setStarted(true);
    setPicked(null);
    setRevealed(false);
    setTextAnswer("");
    setCorrectCount(0);
    setDone(false);
  };

  if (!started) {
    return (
      <div>
        <div className="section-title">Review mistakes</div>
        {items.length === 0 ? (
          <div className="center">
            <Mascot className="hero-mascot" />
            <p className="muted">
              Nothing to review — answer a question wrong and it will show up
              here to practise again.
            </p>
            <button className="btn btn-primary mt" onClick={() => (window.location.hash = "/")}>
              Back home
            </button>
          </div>
        ) : (
          <div className="center">
            <Mascot className="hero-mascot" />
            <p className="muted">
              You've got <strong>{items.length}</strong> question{items.length === 1 ? "" : "s"} to re-test.
              Get it right and it's cleared from the list.
            </p>
            <button className="btn btn-primary mt" onClick={start}>
              &#128221; Start review
            </button>
          </div>
        )}
      </div>
    );
  }

  if (done) {
    const total = queue.length;
    const perfect = correctCount === total;
    return (
      <div className="center">
        <Mascot className="mascot-big" happy={perfect} />
        <h2 className="results-title">{perfect ? "All clear!" : "Review done"}</h2>
        <p className="muted">
          {correctCount}/{total} answered correctly.
          {!perfect && " The rest are still in your mistakes list."}
        </p>
        <button className="btn btn-primary mt" onClick={() => (window.location.hash = "/")}>
          Back home
        </button>
        <button className="btn btn-secondary mt" onClick={() => setStarted(false)}>
          Review again
        </button>
      </div>
    );
  }

  const current = queue[idx];
  const question = current.question;
  const subject = getSubject(current.subject);
  const isLast = idx === queue.length - 1;

  const isPickedCorrect = () => {
    if (question.type === "fill-blank") return isTextCorrect(picked);
    return normalize(picked) === normalize(question.correctAnswer);
  };

  function isTextCorrect(input) {
    const answer = normalize(question.correctAnswer);
    const given = normalize(input);
    if (!given) return false;
    if (given === answer) return true;
    const words = answer.split(/\s+/).filter(Boolean);
    if (words.length === 1) return given.startsWith(words[0]);
    return false;
  }

  const onPick = (choice) => {
    if (revealed || queue.length === 0) return;
    setPicked(choice);
    setRevealed(true);
    if (normalize(choice) === normalize(question.correctAnswer)) {
      setCorrectCount(correctCount + 1);
      onAddXp(XP.perCorrect);
      onClearWrong(current.subject, question.id);
    } else {
      onLoseHeart();
    }
  };

  const submitText = () => {
    if (revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    if (isTextCorrect(textAnswer.trim())) {
      setCorrectCount(correctCount + 1);
      onAddXp(XP.perCorrect);
      onClearWrong(current.subject, question.id);
    } else {
      onLoseHeart();
    }
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
    setTextAnswer("");
  };

  return (
    <div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(idx / queue.length) * 100}%`, background: subject ? subject.colorHex : "var(--brand-primary)" }} />
      </div>

      <Mascot className="mascot-inline" happy={revealed && isPickedCorrect()} />

      <h3 className="quiz-question">
        {question.question}
        <ReadButton text={question.question} className="read-small" />
      </h3>
      {subject && <p className="muted hint">{subject.name}</p>}

      {question.type === "fill-blank" ? (
        <div className="fillblank">
          <input
            className="txt-input"
            type="text"
            placeholder="Type your answer..."
            value={textAnswer}
            disabled={revealed}
            onChange={(e) => setTextAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && textAnswer.trim() && !revealed) submitText();
            }}
            autoComplete="off"
          />
          {!revealed && (
            <button className="btn btn-primary mt" disabled={!textAnswer.trim()} onClick={submitText}>
              Check
            </button>
          )}
        </div>
      ) : (
        <div className="quiz-options">
          {question.options.map((opt) => (
            <button
              key={opt}
              className={
                "btn-option" +
                (revealed
                  ? normalize(opt) === normalize(question.correctAnswer)
                    ? " correct"
                    : normalize(opt) === normalize(picked)
                    ? " wrong"
                    : ""
                  : "")
              }
              onClick={() => onPick(opt)}
              disabled={revealed}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {revealed && (
        <div className="feedback">
          <p className={"feedback " + (isPickedCorrect() ? "correct" : "wrong")}>
            {isPickedCorrect() ? "Correct — cleared!" : "Not quite."}
          </p>
          <div className="card mt">
            <p>{question.explanation}</p>
            <ReadButton text={question.explanation} className="read-inline" />
          </div>
          <button className="btn btn-primary mt" onClick={next}>
            {isLast ? "See results" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
