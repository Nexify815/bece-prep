import { useState, useMemo, useEffect, useRef } from "react";
import { SUBJECTS, getSubject } from "../data/index.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { todayKey } from "../lib/dates.js";
import { playRight, playWrong, playTick, playWin } from "../lib/sound.js";
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
const EXAM_SECONDS = 60 * 60;
const MINTS = { standard: EXAM_SECONDS, hard: EXAM_SECONDS };

const MODES = [
  { key: "standard", label: "Standard BECE", sub: "40 questions \u00B7 60 minutes", icon: "\u2705" },
  { key: "hard", label: "e-BECE 2026 (harder)", sub: "Tougher 40 \u00B7 60 minutes", icon: "\u{1F4AA}" },
];

function buildExam(mode) {
  const pool = [];
  SUBJECTS.forEach((s) => {
    let qs = s.data?.questions || [];
    if (mode === "hard") {
      const hard = qs.filter((q) => q.difficulty === "hard");
      if (hard.length) qs = hard;
    }
    qs.forEach((q) => pool.push({ ...q, subjectKey: s.key, subjectName: s.name }));
  });
  return shuffle(pool).slice(0, EXAM_SIZE);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Resolve the topic (strand) a question belongs to.
function topicOf(subject, q) {
  if (q.topic) return q.topic;
  if (q.termId && subject) {
    const term = (subject.data.glossary || []).find((t) => t.id === q.termId);
    if (term) return term.strand || term.subStrand || "General";
  }
  return "General";
}

export default function MockExam({ onAddXp, onComplete, onRecord }) {
  const [mode, setMode] = useState(null);
  const [exam, setExam] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answered, setAnswered] = useState({});   // qid -> chosen
  const [correctIds, setCorrectIds] = useState({});
  const [marked, setMarked] = useState({});       // qid -> true (for review)
  const [qTimes, setQTimes] = useState({});       // qid -> seconds spent
  const [qStart, setQStart] = useState(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  // countdown timer + per-question timing
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

  // store elapsed seconds on the question we just left
  const snapTime = (qid) => {
    if (!qid || qStart == null) return;
    setQTimes((m) => ({ ...m, [qid]: (m[qid] || 0) + (Date.now() - qStart) / 1000 }));
  };

  useEffect(() => {
    if (timeLeft === 60) playTick();
  }, [timeLeft]);

  function finish() {
    clearInterval(timerRef.current);
    snapTime(question && question.id);
    Object.keys(correctIds).forEach(() => onAddXp(XP.perCorrect));
    setDone(true);
    const elapsed = EXAM_SECONDS - timeLeft;
    if (onRecord) onRecord({ pct: exam.length ? Math.round((Object.keys(correctIds).length / exam.length) * 100) : 0, seconds: elapsed, mode });
  }

  const onPick = (opt) => {
    if (!question || revealed) return;
    setPicked(opt);
    setRevealed(true);
    const correct = isCorrectAnswer(question, opt);
    if (correct) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
      playRight();
    } else {
      playWrong();
    }
    setAnswered((ans) => ({ ...ans, [question.id]: opt }));
  };

  const submitText = () => {
    if (!question || revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    const correct = isCorrectAnswer(question, textAnswer);
    if (correct) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
      playRight();
    } else {
      playWrong();
    }
    setAnswered((ans) => ({ ...ans, [question.id]: textAnswer.trim() }));
  };

  const next = () => {
    snapTime(question.id);
    if (isLast) {
      finish();
    } else {
      setIdx(idx + 1);
      setPicked(null);
      setRevealed(false);
      setTextAnswer("");
    }
  };

  const jumpTo = (i) => {
    if (i === idx) return;
    snapTime(question.id);
    setIdx(i);
    setPicked(null);
    setRevealed(false);
    setTextAnswer("");
  };

  const goReviewMarked = () => {
    const first = Object.keys(marked).map((qid) => exam.findIndex((q) => q.id === qid)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (first != null) jumpTo(first);
  };

  // ----- mode picker -----
  if (!mode) {
    return (
      <div>
        <div className="section-title">Mock Exam</div>
        <p className="muted">Set the clock, sit the paper, see exactly where to improve.</p>
        <div className="spacer" />
        {MODES.map((m) => (
          <button key={m.key} className="row" onClick={() => {
            setMode(m.key);
            setExam(buildExam(m.key));
            setTimeLeft(MINTS[m.key]);
            setIdx(0);
            setPicked(null);
            setRevealed(false);
            setAnswered({});
            setCorrectIds({});
            setMarked({});
            setQTimes({});
            setTextAnswer("");
            setDone(false);
            setQStart(Date.now());
          }}>
            <span className="row-icon">{m.icon}</span>
            <span className="row-main">
              <span className="row-title">{m.label}</span>
              <span className="row-sub">{m.sub}</span>
            </span>
            <span className="row-chev">&#8250;</span>
          </button>
        ))}
      </div>
    );
  }

  const question = exam[idx];
  const total = exam.length;
  const correct = Object.keys(correctIds).length;
  const isLast = idx === total - 1;

  // ----- results screen -----
  if (done) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const score = correct * XP.perCorrect;
    const seconds = EXAM_SECONDS - timeLeft;

    // subject + topic breakouts
    const bySubject = {};
    const byTopic = {};
    SUBJECTS.forEach((s) => { bySubject[s.key] = { name: s.name, icon: s.icon, colorClass: s.colorClass, total: 0, correct: 0, secs: 0 }; });
    exam.forEach((q) => {
      const bs = bySubject[q.subjectKey];
      const subj = getSubject(q.subjectKey);
      const top = topicOf(subj, q);
      if (!byTopic[top]) byTopic[top] = { topic: top, subjectKey: q.subjectKey, total: 0, correct: 0 };
      byTopic[top].total++;
      bs.total++;
      if (correctIds[q.id]) { bs.correct++; byTopic[top].correct++; }
      bs.secs += qTimes[q.id] || 0;
    });

    const weakTopics = Object.values(byTopic)
      .filter((t) => t.total > 1)
      .map((t) => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3);

    return (
      <div className="mock-results">
        <div className="section-title">Mock Exam Results</div>
        <div className="mock-score-ring">
          <span className="mock-score-pct">{pct}%</span>
          <span className="mock-score-detail">{correct}/{total} correct</span>
        </div>
        <p className="muted">Time used: {formatTime(seconds)} &middot; +{score} XP earned</p>
        <p className="muted hint">{mode === "hard" ? "e-BECE 2026 mode" : "Standard BECE mode"}</p>

        {pct >= 80 && <p className="mock-verdict mock-great">Excellent! You're exam ready.</p>}
        {pct >= 60 && pct < 80 && <p className="mock-verdict mock-good">Good job! Keep practicing.</p>}
        {pct < 60 && <p className="mock-verdict mock-needs">Keep studying — you'll get there.</p>}

        <div className="section-title" style={{ marginTop: 18, fontSize: 18 }}>By Subject</div>
        {Object.values(bySubject).filter((s) => s.total > 0).map((s) => (
          <div key={s.name} className="mock-subject-row">
            <span className="mock-subject-name">{s.icon} {s.name}</span>
            <span className="mock-subject-score">{s.correct}/{s.total} &middot; {Math.round((s.correct / s.total) * 100)}%</span>
          </div>
        ))}

        {weakTopics.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: 18, fontSize: 18 }}>Weakest topics</div>
            {weakTopics.map((t) => (
              <div key={t.topic + t.subjectKey} className="mock-subject-row">
                <span className="mock-subject-name">{t.topic}</span>
                <span className="mock-subject-score">{t.correct}/{t.total} ({t.pct}%)</span>
              </div>
            ))}
            <div className="spacer" />
            <button className="btn btn-primary" onClick={() => (window.location.hash = "/drill")}>
              &#128218; Drill these topics
            </button>
          </>
        )}

        <div className="spacer" />
        <button className="btn btn-primary mt" onClick={() => onComplete && onComplete({ correct, total, pct, bySubject, weakTopics })}>
          Continue
        </button>
        <button className="btn btn-secondary mt" style={{ marginTop: 8 }} onClick={() => { setMode(null); }}>
          Retake (new paper)
        </button>
      </div>
    );
  }

  const subject = getSubject(question.subjectKey);
  const subjectName = subject ? subject.name : question.subjectKey;
  const avgSecs = total ? exam.reduce((a, q) => a + (qTimes[q.id] || 0), 0) / Math.max(1, Object.keys(qTimes).length) : 0;
  const paceOk = avgSecs > 0 && avgSecs <= 90;
  const unanswered = exam.filter((q) => !answered[q.id]).length;

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

      {/* bubble sheet: jump between questions */}
      <div className="mock-palette">
        {exam.map((q, i) => {
          const stateCls = marked[q.id] ? " marked" : answered[q.id] ? " answered" : "";
          return (
            <button
              key={q.id}
              className={"mock-bubble" + stateCls + (i === idx ? " current" : "")}
              onClick={() => jumpTo(i)}
              title={`#${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mock-palette-legend">
        <span>&#11036; To do</span><span>&#11039; Answered</span><span>M Marked</span>
        {unanswered > 0 && <span className="mock-rest">{unanswered} to go</span>}
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
              const isCorrect = revealed && isCorrectAnswer(question, opt);
              const isWrong = revealed && isSelected && !isCorrect;
              let cls = "mock-option";
              if (revealed && isCorrect) cls += " correct";
              if (isWrong) cls += " wrong";
              return (
                <button key={opt} className={cls} disabled={revealed} onClick={() => onPick(opt)}>
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

      <div className="mock-actions">
        {!revealed ? (
          <button className="btn btn-secondary" onClick={() => setMarked((m) => ({ ...m, [question.id]: !m[question.id] }))}>
            {marked[question.id] ? "Unmark" : "Mark for review"}
          </button>
        ) : (
          <>
            {!isLast && <button className="btn btn-primary" onClick={next}>Next Question</button>}
            <button className="btn btn-primary" onClick={next}>
              {isLast ? "Finish Exam" : "Next"}
            </button>
          </>
        )}
        {Object.keys(marked).length > 0 && (
          <button className="btn btn-secondary" onClick={goReviewMarked}>
            Review marked ({Object.keys(marked).length})
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => { snapTime(question.id); setMode(null); }}>
          Quit paper
        </button>
      </div>

      {revealed && (
        <div className={"mock-feedback " + (correctIds[question?.id] ? "fb-correct" : "fb-wrong")}>
          {correctIds[question?.id] ? "Correct!" : "Wrong"}
          {question?.explanation && <p className="mock-explanation">{question.explanation}</p>}
          {question?.explanation && <ReadButton text={question.explanation} className="read-inline" />}
        </div>
      )}

      {paceOk && (
        <p className="muted hint">Average pace so far: {formatTime(Math.round(avgSecs))} / question. Keep under 90 seconds.</p>
      )}
      {revealed && qTimes[question?.id] != null && qTimes[question.id] > 120 && (
        <p className="muted hint mock-slow">
          You used {formatTime(Math.round(qTimes[question.id]))} on this one. In the real exam, flag it and move on.
        </p>
      )}
    </div>
  );
}