import { useState, useMemo } from "react";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MegaQuiz({ subjectKey, questions, alreadyPassed, onPass, onExit }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctIds, setCorrectIds] = useState({});
  const [textAnswer, setTextAnswer] = useState("");
  const [status, setStatus] = useState(null); // null | passed | failed

  const quiz = useMemo(() => shuffle(questions), [subjectKey]);
  const total = quiz.length;
  const question = quiz[idx];
  const isLast = idx === total - 1;
  const correct = Object.keys(correctIds).length;
  const passMark = Math.max(1, Math.ceil(total * 0.8)); // 80% to pass

  function normalize(v) {
    if (v == null) return "";
    return String(v).toLowerCase().trim();
  }

  const finish = () => {
    const ok = correct >= passMark;
    setStatus(ok ? "passed" : "failed");
    if (ok) onPass();
  };

  const onPick = (opt) => {
    if (!question || revealed) return;
    setPicked(opt);
    setRevealed(true);
    if (normalize(opt) === normalize(question.correctAnswer)) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
    }
  };

  const submitText = () => {
    if (!question || revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    if (normalize(question.correctAnswer).split(/\s+/).some((w) => normalize(textAnswer).startsWith(w))) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
    }
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
    setTextAnswer("");
  };

  // -------- no questions --------
  if (total === 0) {
    return (
      <div className="center">
        <p className="muted">No summit questions yet.</p>
        <button className="btn btn-secondary mt" onClick={onExit}>Back to stairs</button>
      </div>
    );
  }

  // -------- result --------
  if (status) {
    const passed = status === "passed";
    return (
      <div className="center">
        <span className="mascot-big">{passed ? "\u{1F98A}" : "\u{1F43E}"}</span>
        <h2 className="results-title">{passed ? "Summit reached!" : "Not yet"}</h2>
        <p className="muted">
          {passed
            ? `You passed the mega quiz (${correct}/${total}).`
            : `You got ${correct}/${total}. You need ${passMark} to pass. Try again!`}
        </p>
        <button className="btn btn-secondary mt" onClick={onExit}>
          Back to stairs
        </button>
      </div>
    );
  }

  const isTextQ = question.type === "fill-blank";
  const pickedCorrect = isTextQ
    ? normalize(question.correctAnswer).split(/\s+/).some((w) => normalize(picked).startsWith(w))
    : normalize(picked) === normalize(question.correctAnswer);

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="pill pill-medium">Summit</span>
        <span className="quiz-count">Q {idx + 1} / {total}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(idx / total) * 100}%` }} />
      </div>
      <span className="mascot-big" role="img" aria-label="fox">&#129418;</span>
      <h3 className="quiz-question">{question.question}</h3>

      {isTextQ ? (
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
          <p className={"feedback " + (pickedCorrect ? "correct" : "wrong")}>
            {pickedCorrect ? "Correct!" : "Not quite."}
          </p>
          <div className="card mt"><p>{question.explanation}</p></div>
          <button className="btn btn-primary mt" onClick={next}>
            {isLast ? "See result" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
