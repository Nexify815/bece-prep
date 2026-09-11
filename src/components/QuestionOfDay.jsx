import { useState } from "react";
import { FiZap } from "react-icons/fi";
import { getQuestionOfTheDay } from "../lib/qotd.js";
import { getSubject } from "../data/index.js";
import { useSnack } from "./Snackbar.jsx";
import { XP } from "../lib/XP.js";
import ReadButton from "./ReadButton.jsx";
import { playRight, playWrong } from "../lib/sound.js";

const isPastPaperStyle = (q) => /^[a-d]\s*[.)]/i.test((q.options?.[0] || "").trim());

export default function QuestionOfDay({ onCorrect, answeredToday }) {
  const q = getQuestionOfTheDay();
  const snack = useSnack();
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  // once the user answers, keep showing this question with the reveal (the
  // parent records the answer immediately, which flips `answeredToday` — we
  // must not swap to the "done" card before they've seen the explanation)
  const [finished, setFinished] = useState(false);

  if (!q) return null;

  const subject = getSubject(q.subjectKey);
  const subjectName = subject ? subject.name : q.subjectKey;
  const lettered = isPastPaperStyle(q);

  // expects a lettered option or plain text; reuses past-paper-style compare
  const grade = (given, correct) => {
    const norm = (v) => String(v || "").toLowerCase().trim();
    const ltr = (v) => (norm(v).match(/^([a-d])\s*[.)]/) || [])[1] || norm(v);
    if (lettered && /^[a-d]$/.test(norm(correct))) return norm(ltr(given)) === norm(correct);
    return norm(given) === norm(correct);
  };

  if (!answeredToday || finished) {
    const onPick = (opt) => {
      if (revealed) return;
      setPicked(opt);
      setRevealed(true);
      setFinished(true);
      const correct = grade(opt, q.correctAnswer);
      if (correct) {
        playRight();
        onCorrect(q, true);
        snack(`Question of the day correct! +${XP.qotd} XP \u2728`);
      } else {
        playWrong();
        onCorrect(q, false);
        snack("Not this time — check the explanation below.");
      }
    };

    return (
      <div className="card qotd-card">
        <div className="qotd-head">
          <span className="qotd-title"><FiZap size={16} /> Question of the day</span>
          {answeredToday ? (
            <span className="qotd-done">Done for today \u2713</span>
          ) : (
            <span className="pill pill-medium">{subjectName}</span>
          )}
        </div>
        <p className="qotd-question">
          {q.question}
          <ReadButton text={q.question} className="read-small" />
        </p>
        <div className="quiz-options">
          {q.options.map((opt) => (
            <button
              key={opt}
              className={
                "btn-option" +
                (revealed
                  ? grade(opt, q.correctAnswer)
                    ? " correct"
                    : opt === picked
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
        {revealed && (
          <div className="card mt">
            <p>{q.explanation}</p>
            <ReadButton text={q.explanation} className="read-inline" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card qotd-card">
      <div className="qotd-head">
        <span className="qotd-title"><FiZap size={16} /> Question of the day</span>
        <span className="qotd-done">Done for today \u2713</span>
      </div>
      <p className="muted">Come back tomorrow for a new question.</p>
    </div>
  );
}