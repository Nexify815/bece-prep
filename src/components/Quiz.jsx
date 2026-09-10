import { useState, useMemo, useEffect } from "react";
import { getSubject } from "../data/index.js";
import { QUIZ_SESSION as SESSION_SIZE } from "../lib/plan.js";
import { navigate } from "../lib/router.js";
import { msUntilNextHeart } from "../lib/storage.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { playRight, playWrong } from "../lib/sound.js";
import { useSnack } from "./Snackbar.jsx";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";
import WorkedSolution from "./WorkedSolution.jsx";

const DIFFS = ["easy", "medium", "hard"];
const DIFF_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_PILL = { easy: "pill-easy", medium: "pill-medium", hard: "pill-hard" };
const HINT_COST = XP.hintCost;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({
  subjectKey,
  level,
  hearts,
  xp,
  onAddXp,
  onLoseHeart,
  onRecordResult,
  quizSolved,
  onSolved,
  onWrongAnswer,
  onRunActiveChange,
  onLivesRunChange,
  solutionsUnlocked,
  onUnlockSolution,
  onSpendXp,
}) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();

  const [difficulty, setDifficulty] = useState(null);
  const [queue, setQueue] = useState([]);       // order of question ids
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [matchOption, setMatchOption] = useState(null); // for match questions
  const [showHeartsBubble, setShowHeartsBubble] = useState(true);
  const [heartMs, setHeartMs] = useState(0);
  const [wrongInRun, setWrongInRun] = useState(0); // wrong answers in this quiz; lose a heart every 3
  const [usedHint, setUsedHint] = useState(false);
  const [hintText, setHintText] = useState("");
  const [removed, setRemoved] = useState({});

  // report to the shell whether a run is in progress (for leave confirmation + lives modal)
  useEffect(() => {
    const active = !!difficulty && !done;
    if (onRunActiveChange) onRunActiveChange(active);
    if (onLivesRunChange) onLivesRunChange(active);
  }, [difficulty, done, onRunActiveChange, onLivesRunChange]);

  // live countdown until the next heart restores (only when out of hearts)
  useEffect(() => {
    if (hearts > 0) {
      setHeartMs(0);
      return;
    }
    const compute = () => {
      try {
        const raw = localStorage.getItem("studybuddy.v1");
        const st = raw ? JSON.parse(raw) : null;
        setHeartMs(msUntilNextHeart(st || { hearts: 0, heartsUpdatedAt: Date.now() }));
      } catch {
        setHeartMs(0);
      }
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [hearts]);

  const heartCountdown =
    heartMs > 0
      ? `${Math.floor(heartMs / 60000)}:${String(Math.ceil((heartMs % 60000) / 1000)).padStart(2, "0")}`
      : "0:00";

  const questions = useMemo(() => {
    if (!subject) return [];
    return subject.data.questions || [];
  }, [subject]);

  if (!subject) {
    return (
      <div className="center">
        <p className="muted">Quiz coming soon.</p>
        <button className="btn btn-primary mt" onClick={() => navigate(`/subject/${subjectKey}`)}>
          Back
        </button>
      </div>
    );
  }

  const startQuiz = (d) => {
    const pool = questions.filter((q) => q.difficulty === d);
    const solved = quizSolved[`${subjectKey}.${d}`] || {};
    const unsolved = pool.filter((q) => !solved[q.id]);
    // draw a session from the not-yet-solved questions; if the set is fully
    // solved, replay a random slice of the whole set
    let source = unsolved;
    let complete = unsolved.length === 0;
    if (complete) source = pool;
    const order = shuffle(source.map((q) => q.id)).slice(0, SESSION_SIZE);
    setDifficulty(d);
    setQueue(order);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectCount(0);
    setDone(false);
    setMatchOption(null);
    setTextAnswer("");
    setWrongInRun(0);
    setUsedHint(false);
    setHintText("");
    setRemoved({});
  };

  // ---- difficulty picker ---- (always visible; buttons disabled when out of hearts)
  if (!difficulty) {
    return (
      <div>
        <div className="section-title">Quiz</div>
        {hearts === 0 && showHeartsBubble && (
          <div className="hearts-bubble-wrap">
            <div className="hearts-bubble">
              <span className="hearts-bubble-msg">
                &#10084;&#65039; Out of hearts &#183; new one in <strong>{heartCountdown}</strong>
              </span>
              <button
                className="hearts-bubble-close"
                aria-label="Dismiss"
                onClick={() => setShowHeartsBubble(false)}
              >
                &#10005;
              </button>
            </div>
          </div>
        )}
        <div className="spacer" />
        {DIFFS.map((d) => {
          const n = questions.filter((q) => q.difficulty === d).length;
          const solved = quizSolved[`${subjectKey}.${d}`] || {};
          const doneCount = Object.keys(solved).filter((qid) =>
            questions.some((q) => q.id === qid && q.difficulty === d)
          ).length;
          const setComplete = n > 0 && doneCount === n;
          return (
            <button
              key={d}
              className="row"
              disabled={n === 0 || hearts === 0}
              onClick={() => startQuiz(d)}
            >
              <span className="row-main">
                <span className="row-title">{DIFF_LABEL[d]}</span>
                <span className="row-sub">
                  {n === 0
                    ? "none yet"
                    : setComplete
                    ? "Set complete — replay any time"
                    : `${doneCount} / ${n} solved \u00B7 ${SESSION_SIZE} per run`}
                </span>
              </span>
              <span className={"pill " + DIFF_PILL[d]}>{setComplete ? "done" : d}</span>
              <span className="row-chev">&#8250;</span>
            </button>
          );
        })}
      </div>
    );
  }

  const question = questions.find((q) => q.id === queue[idx]);
  const isLast = idx === queue.length - 1;

  const onPick = (choice) => {
    if (revealed) return;
    setPicked(choice);
    setRevealed(true);
    const correct = isCorrectAnswer(question, choice);
    if (correct) {
      const newCount = correctCount + 1;
      setCorrectCount(newCount);
      const bonus = isLast && newCount === queue.length ? XP.perfectBonus : 0;
      onAddXp(XP.perCorrect + bonus);
      if (onSolved) onSolved(subjectKey, question.difficulty, question.id);
      playRight();
    } else {
      onWrongAnswer({ subject: subjectKey, qid: question.id });
      // Quiz rule: lose one heart for every 3 wrong answers (not each wrong one)
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
      playWrong();
    }
  };

  const submitText = () => {
    if (revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    const correct = isCorrectAnswer(question, textAnswer);
    if (correct) {
      const newCount = correctCount + 1;
      setCorrectCount(newCount);
      const bonus = isLast && newCount === queue.length ? XP.perfectBonus : 0;
      onAddXp(XP.perCorrect + bonus);
      if (onSolved) onSolved(subjectKey, question.difficulty, question.id);
      playRight();
    } else {
      onWrongAnswer({ subject: subjectKey, qid: question.id });
      // Quiz rule: lose one heart for every 3 wrong answers (not each wrong one)
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
      playWrong();
    }
  };

  const next = () => {
    if (isLast) {
      onRecordResult(subjectKey, question.difficulty, correctCount, queue.length);
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
    setMatchOption(null);
    setTextAnswer("");
    setUsedHint(false);
    setHintText("");
    setRemoved({});
  };

  // Spend XP for a hint: removes two wrong options (MC) or reveals the first
  // letter (typed answers). No hints during the last reveal or for match Qs.
  const useHint = () => {
    if (revealed || usedHint || question.type === "match") return;
    if (xp < HINT_COST) {
      snack(`Not enough XP. A hint costs ${HINT_COST} XP.`);
      return;
    }
    onSpendXp(HINT_COST);
    setUsedHint(true);
    if (question.type === "fill-blank") {
      const first = String(question.correctAnswer || "").trim().charAt(0);
      setHintText(first ? `Hint: the answer starts with "${first.toUpperCase()}".` : "Hint: think about the key term in this lesson.");
    } else {
      const wrongs = question.options.filter((o) => !isCorrectAnswer(question, o));
      const drop = shuffle(wrongs).slice(0, Math.min(2, wrongs.length));
      const nextRemoved = {};
      (drop || []).forEach((o) => (nextRemoved[o] = true));
      setRemoved(nextRemoved);
      setHintText("Hint: two wrong choices removed.");
    }
    snack("Hint used \u{1F914}");
  };

  function isPickedCorrect() {
    if (question.type === "fill-blank") return isTextCorrect(picked);
    return isCorrectAnswer(question, picked);
  }

  // Tolerant matching for typed answers: ignore punctuation, accept parts.
  function isTextCorrect(input) {
    return isCorrectAnswer(question, input);
  }

  function normalize(v) {
    if (v == null) return "";
    return String(v).toLowerCase().trim();
  }

  // ---- results screen ----
  if (done) {
    const total = queue.length;
    const perfect = correctCount === total;
    const setSize = questions.filter((q) => q.difficulty === difficulty).length;
    const solvedSet = quizSolved[`${subjectKey}.${difficulty}`] || {};
    const solvedCount = Object.keys(solvedSet).filter((qid) =>
      questions.some((q) => q.id === qid && q.difficulty === difficulty)
    ).length;
    const remaining = Math.max(0, setSize - solvedCount);
    return (
      <div className="center">
        <Mascot className="mascot-big" happy={perfect} />
        <h2 className="results-title">
          {perfect
            ? "Perfect!"
            : correctCount >= total / 2
            ? `Good job! You got ${correctCount}/${total}`
            : `You got ${correctCount}/${total}`}
        </h2>
        <p className="muted">
          {remaining > 0
            ? `${remaining} question${remaining === 1 ? "" : "s"} left in the ${DIFF_LABEL[difficulty]} set — come back for them.`
            : `${DIFF_LABEL[difficulty]} set complete. Great work!`}
        </p>
        <button className="btn btn-primary mt" onClick={() => setDifficulty(null)}>
          &#128214; Back to levels
        </button>
        <button className="btn btn-secondary mt" onClick={() => navigate(`/subject/${subjectKey}`)}>
          Back to subject
        </button>
      </div>
    );
  }

  // ---- match question rendering ----
  if (question.type === "match") {
    return (
      <MatchQuestion
        question={question}
        matchOption={matchOption}
        setMatchOption={setMatchOption}
      />
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className={"pill " + DIFF_PILL[difficulty]}>{DIFF_LABEL[difficulty]}</span>
        <span className="quiz-count">Question {idx + 1} / {queue.length}</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((idx + 1) / Math.max(1, queue.length)) * 100}%`, background: subject.colorHex }}
        />
      </div>

      <Mascot className="mascot-inline" happy={revealed && isPickedCorrect()} />

      <h3 className="quiz-question">
        {question.question}
        <ReadButton text={question.question} className="read-small" />
      </h3>

      {question.type === "fill-blank" && (
        <p className="muted hint">Type your answer below (one word).</p>
      )}

      {!revealed && question.type !== "match" && (
        <div className="quiz-hint-row">
          <button className="btn btn-secondary btn-sm" disabled={usedHint} onClick={useHint}>
            {usedHint ? "Hint used \u2713" : "\u{1F914} Hint (" + HINT_COST + " XP)"}
          </button>
          {hintText && <p className="muted hint quiz-hint-text">{hintText}</p>}
        </div>
      )}

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
              if (e.key === "Enter" && textAnswer.trim() && !revealed) {
                submitText();
              }
            }}
            autoComplete="off"
          />
          {!revealed && (
            <button
              className="btn btn-primary mt"
              disabled={!textAnswer.trim()}
              onClick={submitText}
            >
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
                (removed[opt] ? " hint-removed " : "") +
                (revealed
                  ? isCorrectAnswer(question, opt)
                    ? " correct"
                    : normalize(opt) === normalize(picked)
                    ? " wrong"
                    : ""
                  : "")
              }
              onClick={() => onPick(opt)}
              disabled={revealed || removed[opt]}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {revealed && (
        <div className="feedback">
          <p className={"feedback " + (isPickedCorrect() ? "correct" : "wrong")}>
            {isPickedCorrect() ? "Correct!" : "Not quite."}
          </p>
          <div className="card mt">
            <p>{question.explanation}</p>
            <ReadButton text={question.explanation} className="read-inline" />
          </div>
          <WorkedSolution
            question={question}
            subjectKey={subjectKey}
            unlocked={!!(solutionsUnlocked && solutionsUnlocked[question.id])}
            xp={xp}
            onUnlock={() => onUnlockSolution(question.id)}
          />
          <button className="btn btn-primary mt" onClick={next}>
            {isLast ? "See results" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

function MatchQuestion({ question, matchOption, setMatchOption }) {
  const pairs = matchOption || question.answerMap;
  const empty = !pairs || pairs.length === 0;
  return (
    <div>
      <h3 className="quiz-question">{question.question}</h3>
      {empty ? (
        <p className="muted">Match question coming soon.</p>
      ) : (
        <p className="muted">Tap matching pairs. (coming in V2)</p>
      )}
      <button className="btn btn-secondary mt" onClick={() => setMatchOption(null)}>
        Back to levels
      </button>
    </div>
  );
}
