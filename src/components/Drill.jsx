import { useState, useEffect, useMemo } from "react";
import { FiTarget } from "react-icons/fi";
import { getQuestion, getSubject } from "../data/index.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { useSnack } from "./Snackbar.jsx";
import { playRight, playWrong } from "../lib/sound.js";
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

// Resolve the "topic" a question belongs to for grouping drills.
function topicOf(subject, q) {
  if (q.topic) return q.topic;
  if (q.termId) {
    const term = (subject.data.glossary || []).find((t) => t.id === q.termId);
    if (term) return term.strand || term.subStrand || "General";
  }
  return "General";
}

export default function Drill({
  state,
  onAddXp,
  onLoseHeart,
  onWrongAnswer,
  onClearWrong,
  onRunActiveChange,
  onLivesRunChange,
}) {
  const snack = useSnack();

  // Build weak-topic groups from wrong answers.
  const groups = useMemo(() => {
    const map = {};
    (state.wrongAnswers || []).forEach((w) => {
      const subject = getSubject(w.subject);
      if (!subject) return;
      const q = getQuestion(w.subject, w.qid);
      if (!q) return;
      const topic = topicOf(subject, q);
      const key = `${w.subject}|${topic}`;
      if (!map[key]) map[key] = { subjectKey: w.subject, subjectName: subject.name, colorClass: subject.colorClass, topic, qids: [] };
      if (!map[key].qids.includes(w.qid)) map[key].qids.push(w.qid);
    });
    return Object.values(map).sort((a, b) => b.qids.length - a.qids.length);
  }, [state.wrongAnswers]);

  const [active, setActive] = useState(null); // group
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [correctIds, setCorrectIds] = useState({});
  const [wrongInRun, setWrongInRun] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (onRunActiveChange) onRunActiveChange(!!active && !done);
    if (onLivesRunChange) onLivesRunChange(!!active && !done);
  }, [active, done, onRunActiveChange, onLivesRunChange]);

  const startDrill = (group) => {
    const subject = getSubject(group.subjectKey);
    const all = (subject.data.questions || []).filter((q) => topicOf(subject, q) === group.topic);
    const pool = all.length >= 4 ? all : group.qids.map((id) => getQuestion(group.subjectKey, id)).filter(Boolean);
    if (pool.length === 0) {
      snack("Not enough questions in this topic yet.");
      return;
    }
    setQueue(shuffle(pool).slice(0, 10));
    setActive(group);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectIds({});
    setWrongInRun(0);
    setDone(false);
  };

  const finish = () => {
    setDone(true);
    const correct = Object.keys(correctIds).length;
    const total = queue.length;
    const perfect = total > 0 && correct === total;
    if (perfect) {
      onAddXp(XP.perfectBonus);
      snack("Perfect drill! +20 bonus XP \u2728");
      playWin();
    }
  };

  if (!active) {
    return (
      <div>
        <div className="section-title">Weak-spot drills</div>
        <p className="muted">
          Fixing the exact topics you keep missing is the fastest way to raise your score.
        </p>
        {groups.length === 0 ? (
          <div className="center">
            <Mascot className="hero-mascot" />
            <p className="muted">
              Answer a question wrong anywhere in the app and it becomes a drill
              topic here automatically.
            </p>
            <button className="btn btn-primary mt" onClick={() => (window.location.hash = "/")}>
              Back home
            </button>
          </div>
        ) : (
          <>
            <div className="spacer" />
            {groups.map((g) => (
              <button key={g.subjectKey + g.topic} className="row" onClick={() => startDrill(g)}>
                <span className="row-icon"><FiTarget size={20} /></span>
                <span className="row-main">
                  <span className={"row-title " + g.colorClass}>{g.topic}</span>
                  <span className="row-sub">{g.subjectName} &middot; {g.qids.length} to retest</span>
                </span>
                <span className="row-chev">&#8250;</span>
              </button>
            ))}
          </>
        )}
      </div>
    );
  }

  if (done) {
    const correct = Object.keys(correctIds).length;
    const total = queue.length;
    return (
      <div className="center">
        <Mascot className="mascot-big" happy={correct === total} />
        <h2 className="results-title">{correct}/{total} correct</h2>
        <p className="muted">
          {correct === total
            ? "Perfect — topic cleared!"
            : "Keep drilling to shrink this topic."}
        </p>
        <button className="btn btn-primary mt" onClick={() => setActive(null)}>
          Back to topics
        </button>
      </div>
    );
  }

  const question = queue[idx];
  const isLast = idx === queue.length - 1;
  const isTextQ = question.type === "fill-blank";
  const pickedCorrect = isCorrectAnswer(question, picked);

  const grade = (chosen, correct) => {
    setPicked(chosen);
    setRevealed(true);
    if (correct) {
      const next = { ...correctIds, [question.id]: true };
      setCorrectIds(next);
      onAddXp(XP.perCorrect);
      onClearWrong(active.subjectKey, question.id);
      playRight();
    } else {
      if (onWrongAnswer) onWrongAnswer({ subject: active.subjectKey, qid: question.id });
      const nw = wrongInRun + 1;
      setWrongInRun(nw);
      if (nw % 3 === 0) onLoseHeart();
      playWrong();
    }
  };

  const onPick = (opt) => {
    if (revealed) return;
    grade(opt, isCorrectAnswer(question, opt));
  };

  const submitText = () => {
    if (revealed || !textAnswer.trim()) return;
    grade(textAnswer.trim(), isCorrectAnswer(question, textAnswer.trim()));
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

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="pill pill-medium">{active.topic}</span>
        <span className="quiz-count">Q {idx + 1} / {queue.length}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((idx + 1) / queue.length) * 100}%`, background: "var(--brand-primary)" }} />
      </div>
      <Mascot className="mascot-inline" happy={revealed && pickedCorrect} />
      <h3 className="quiz-question">
        {question.question}
        <ReadButton text={question.question} className="read-small" />
      </h3>

      {isTextQ ? (
        <div className="fillblank">
          <input
            className="txt-input"
            type="text"
            placeholder="Type your answer..."
            value={textAnswer}
            disabled={revealed}
            onChange={(e) => setTextAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
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
                  ? isCorrectAnswer(question, opt)
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
      )}

      {revealed && (
        <div className="feedback">
          <p className={"feedback " + (pickedCorrect ? "correct" : "wrong")}>
            {pickedCorrect ? "Correct!" : "Not quite."}
          </p>
          <div className="card mt">
            <p>{question.explanation}</p>
            <ReadButton text={question.explanation} className="read-inline" />
          </div>
          <button className="btn btn-primary mt" onClick={next}>
            {isLast ? "See result" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}