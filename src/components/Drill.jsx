import { useState, useEffect, useMemo } from "react";
import { LuTarget } from "react-icons/lu";
import { getQuestion, getSubject } from "../data/index.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { useSnack } from "./Snackbar.jsx";
import { playRight, playWrong } from "../lib/sound.js";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";
import { LuSparkles, LuChevronRight, LuCircleAlert, LuCircleCheck, LuX, LuTriangleAlert } from "./icons.jsx";
import FocusLayout from "./FocusLayout.jsx";

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
      snack("Not enough questions in this topic yet.", LuCircleAlert);
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
      snack("Perfect drill! +20 bonus XP", LuSparkles);
      playWin();
    }
  };

  if (!active) {
    return (
      <div className="prep-page">
        <div className="prep-head">
          <h1>Weak-spot drills</h1>
          <p>
            Fixing the exact topics you keep missing is the fastest way to raise
            your score.
          </p>
        </div>
        {groups.length === 0 ? (
          <div className="empty-card">
            <span className="empty-card-icon">
              <LuSparkles size={26} color="#14B8A6" />
            </span>
            <h2>No weak spots yet</h2>
            <p className="muted">
              Answer a question wrong anywhere in the app and it becomes a drill
              topic here automatically.
            </p>
            <button
              className="focus-btn"
              onClick={() => (window.location.hash = "/")}
            >
              Back to today&rsquo;s plan
            </button>
          </div>
        ) : (
          groups.map((g) => (
            <button
              key={g.subjectKey + g.topic}
              className="prep-item"
              onClick={() => startDrill(g)}
            >
              <span className="prep-item-icon" style={{ background: g.colorHex || "#14B8A6" }}>
                <LuTarget size={18} color="#fff" />
              </span>
              <span className="prep-item-body">
                <span className="prep-item-title">{g.topic}</span>
                <span className="prep-item-sub">
                  {g.subjectName} &middot; {g.qids.length} to retest
                </span>
              </span>
              <LuChevronRight size={18} className="prep-item-chev" />
            </button>
          ))
        )}
      </div>
    );
  }

  if (done) {
    const correct = Object.keys(correctIds).length;
    const total = queue.length;
    return (
      <FocusLayout
        title={active.topic}
        count="Drill complete"
        progress={100}
        actions={
          <button className="focus-btn" onClick={() => setActive(null)}>
            Back to topics
          </button>
        }
      >
        <div className={"result-banner " + (correct === total ? "ok" : "warn")}>
          <Mascot className="prompt-mascot" size={22} happy={correct === total} />
          <div>
            <strong>
              {correct}/{total} correct
            </strong>
            <span>
              {correct === total
                ? "Perfect — topic cleared!"
                : "Keep drilling to shrink this topic."}
            </span>
          </div>
        </div>
      </FocusLayout>
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
    <FocusLayout
      title={active.topic}
      count={`Question ${idx + 1} of ${queue.length}`}
      progress={((idx + 1) / queue.length) * 100}
      panel={
        <div className="focus-panel-card">
          <div className="focus-panel-title">Weak-spot drill</div>
          <div className="focus-panel-row">
            <span>Subject</span>
            <strong>{active.subjectName}</strong>
          </div>
          <div className="focus-panel-row">
            <span>Correct</span>
            <strong>
              {Object.keys(correctIds).length}/{queue.length}
            </strong>
          </div>
        </div>
      }
      actions={
        revealed ? (
          <button className="focus-btn" onClick={next}>
            {isLast ? "See result" : "Continue"}
          </button>
        ) : null
      }
    >
      <div className="prompt-card">
        <div className="prompt-head">
          <Mascot className="prompt-mascot" size={30} happy={revealed && pickedCorrect} />
          <h2 className="quiz-question-focus">
            {question.question}
            <ReadButton text={question.question} className="read-inline" />
          </h2>
        </div>

        {isTextQ ? (
          <>
            <div className="focus-input mic-wrap">
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
              <MicButton
                disabled={revealed}
                onResult={(t) => setTextAnswer((v) => appendDictation(v, t))}
              />
            </div>
            {!revealed && (
              <div className="focus-actions-inline">
                <button
                  className="focus-btn"
                  disabled={!textAnswer.trim()}
                  onClick={submitText}
                >
                  Check
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="focus-options">
            {question.options.map((opt, i) => {
              const isRight = revealed && isCorrectAnswer(question, opt);
              const isWrong = revealed && !isRight && opt === picked;
              return (
                <button
                  key={opt}
                  className={
                    "focus-option" + (isRight ? " right" : "") + (isWrong ? " wrong" : "")
                  }
                  onClick={() => onPick(opt)}
                  disabled={revealed}
                >
                  <span className="focus-option-key">
                    {isRight ? (
                      <LuCircleCheck size={16} />
                    ) : isWrong ? (
                      <LuX size={16} />
                    ) : (
                      "ABCD"[i] || i + 1
                    )}
                  </span>
                  <span className="focus-option-text">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {revealed && (
          <>
            <div className={"result-banner " + (pickedCorrect ? "ok" : "no")}>
              {pickedCorrect ? (
                <LuCircleCheck size={20} />
              ) : (
                <LuTriangleAlert size={20} />
              )}
              <div>
                <strong>{pickedCorrect ? "Correct!" : "Not quite"}</strong>
                <span>
                  {pickedCorrect
                    ? `+${XP.perCorrect} XP`
                    : `The answer was "${question.correctAnswer}"`}
                </span>
              </div>
            </div>

            <div className="explain-card">
              <p>{question.explanation}</p>
              <ReadButton text={question.explanation} className="read-inline" />
            </div>
          </>
        )}
      </div>
    </FocusLayout>
  );
}
