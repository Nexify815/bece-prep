import { useState, useMemo, useEffect, useRef } from "react";
import { SUBJECTS } from "../data/index.js";
import { XP } from "../lib/XP.js";
import ReadButton from "./ReadButton.jsx";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// BECE standard: 40 questions, 60 minutes
const EXAM_SIZE = 40;
const EXAM_SECONDS = 60 * 60; // 60 minutes
const PER_SUBJECT = Math.floor(EXAM_SIZE / 4); // 10 per subject

function buildExam() {
  const pool = [];
  SUBJECTS.forEach((s) => {
    const qs = (s.data.questions || []).map((q) => ({ ...q, subjectKey: s.key, subjectName: s.name }));
    pool.push(...qs);
  });
  const shuffled = shuffle(pool);
  return shuffled.slice(0, EXAM_SIZE);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function normalize(v) {
  if (v == null) return "";
  return String(v).toLowerCase().trim();
}

export default function MockExam({ onAddXp, onComplete }) {
  const [exam, setExam] = useState(() => buildExam());
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctIds, setCorrectIds] = useState({});
  const [textAnswer, setTextAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  const question = exam[idx];
  const total = exam.length;
  const correct = Object.keys(correctIds).length;
  const isLast = idx === total - 1;

  // countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !done) finish();
  }, [timeLeft, done]);

  const finish = () => {
    clearInterval(timerRef.current);
    // award XP for correct answers
    Object.keys(correctIds).forEach(() => onAddXp(XP.perCorrect));
    setDone(true);
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
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
      setRevealed(false);
      setTextAnswer("");
    }
  };

  // results screen
  if (done) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const score = correct * XP.perCorrect;

    // subject breakdown
    const bySubject = {};
    SUBJECTS.forEach((s) => { bySubject[s.key] = { name: s.name, total: 0, correct: 0, wrongTopics: [] }; });
    exam.forEach((q) => {
      const bs = bySubject[q.subjectKey];
      if (!bs) return;
      bs.total++;
      if (correctIds[q.id]) {
        bs.correct++;
      } else {
        const topic = q.termId || q.topic || "General";
        if (!bs.wrongTopics.includes(topic)) bs.wrongTopics.push(topic);
      }
    });

    const elapsed = EXAM_SECONDS - timeLeft;

    return (
      <div className="mock-results">
        <div className="section-title">Mock Exam Results</div>
        <div className="mock-score-ring">
          <span className="mock-score-pct">{pct}%</span>
          <span className="mock-score-detail">{correct}/{total} correct</span>
        </div>
        <p className="muted">Time used: {formatTime(elapsed)} &middot; +{score} XP earned</p>

        {pct >= 80 && <p className="mock-verdict mock-great">Excellent! You're exam ready.</p>}
        {pct >= 60 && pct < 80 && <p className="mock-verdict mock-good">Good job! Keep practicing.</p>}
        {pct < 60 && <p className="mock-verdict mock-needs">Keep studying — you'll get there.</p>}

        <div className="section-title" style={{ marginTop: 20, fontSize: 18 }}>By Subject</div>
        {Object.values(bySubject).filter((s) => s.total > 0).map((s) => (
          <div key={s.name} className="mock-subject-row">
            <span className="mock-subject-name">{s.name}</span>
            <span className="mock-subject-score">{s.correct}/{s.total}</span>
          </div>
        ))}

        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => onComplete && onComplete({ correct, total, pct, bySubject })}>
          Done
        </button>
        <button className="btn btn-secondary mt" style={{ marginTop: 8 }} onClick={() => {
          setExam(buildExam());
          setIdx(0);
          setPicked(null);
          setRevealed(false);
          setCorrectIds({});
          setTextAnswer("");
          setTimeLeft(EXAM_SECONDS);
          setDone(false);
        }}>
          Retake
        </button>
      </div>
    );
  }

  const subjectName = question ? SUBJECTS.find((s) => s.key === question.subjectKey)?.name : "";

  return (
    <div>
      <div className="mock-header">
        <div className="mock-timer" style={{ color: timeLeft < 60 ? "var(--heart-red)" : undefined }}>
          &#9202; {formatTime(timeLeft)}
        </div>
        <div className="mock-progress">
          {idx + 1}/{total}
        </div>
      </div>

      <div className="mock-subject-tag">{subjectName}</div>

      {question && (
        <div className="card mock-question-card">
          <p className="mock-question-text">
            {question.question}
            <ReadButton text={question.question} className="read-small" />
          </p>
          {question.options && question.options.length > 0 ? (
            question.options.map((opt) => {
              const isSelected = picked === opt;
              const isCorrect = revealed && normalize(opt) === normalize(question.correctAnswer);
              const isWrong = revealed && isSelected && !isCorrect;
              let cls = "mock-option";
              if (revealed && isCorrect) cls += " correct";
              if (isWrong) cls += " wrong";
              return (
                <button
                  key={opt}
                  className={cls}
                  disabled={revealed}
                  onClick={() => onPick(opt)}
                >
                  {opt}
                </button>
              );
            })
          ) : (
            <div className="mock-text-input">
              <input
                type="text"
                placeholder="Type your answer..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitText()}
                disabled={revealed}
                autoFocus
              />
              {!revealed && (
                <button className="btn btn-primary btn-sm" onClick={submitText} disabled={!textAnswer.trim()}>
                  Submit
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {revealed && (
        <div className={"mock-feedback " + (correctIds[question?.id] ? "fb-correct" : "fb-wrong")}>
          {correctIds[question?.id] ? "Correct!" : "Wrong"}
          {question?.explanation && (
            <p className="mock-explanation">{question.explanation}</p>
          )}
          {question?.explanation && (
            <ReadButton text={question.explanation} className="read-inline" />
          )}
        </div>
      )}

      {revealed && (
        <button className="btn btn-primary mt" onClick={next}>
          {isLast ? "Finish Exam" : "Next Question"}
        </button>
      )}
    </div>
  );
}
