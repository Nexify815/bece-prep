import { useState, useMemo, useEffect } from "react";
import { getSubject } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { msUntilNextHeart } from "../lib/storage.js";
import { XP } from "../lib/XP.js";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";

const DIFFS = ["easy", "medium", "hard"];
const DIFF_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_PILL = { easy: "pill-easy", medium: "pill-medium", hard: "pill-hard" };

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
  onAddXp,
  onLoseHeart,
  onRecordResult,
  onWrongAnswer,
  onRunActiveChange,
  onLivesRunChange,
}) {
  const subject = getSubject(subjectKey);

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
    const order = shuffle(pool.map((q) => q.id));
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
          return (
            <button
              key={d}
              className="row"
              disabled={n === 0 || hearts === 0}
              onClick={() => startQuiz(d)}
            >
              <span className="row-main">
                <span className="row-title">{DIFF_LABEL[d]}</span>
                <span className="row-sub">{n ? n + " questions" : "none yet"}</span>
              </span>
              <span className={"pill " + DIFF_PILL[d]}>{d}</span>
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
    const correct = normalize(choice) === normalize(question.correctAnswer);
    if (correct) {
      const newCount = correctCount + 1;
      setCorrectCount(newCount);
      const bonus = isLast ? XP.perfectBonus : 0;
      onAddXp(XP.perCorrect + bonus);
    } else {
      onWrongAnswer({ subject: subjectKey, qid: question.id });
      // Quiz rule: lose one heart for every 3 wrong answers (not each wrong one)
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
    }
  };

  const submitText = () => {
    if (revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    const correct = isTextCorrect(textAnswer);
    if (correct) {
      const newCount = correctCount + 1;
      setCorrectCount(newCount);
      const bonus = isLast ? XP.perfectBonus : 0;
      onAddXp(XP.perCorrect + bonus);
    } else {
      onWrongAnswer({ subject: subjectKey, qid: question.id });
      // Quiz rule: lose one heart for every 3 wrong answers (not each wrong one)
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
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
  };

  function isPickedCorrect() {
    if (question.type === "fill-blank") return isTextCorrect(picked);
    return normalize(picked) === normalize(question.correctAnswer);
  }

  // Tolerant matching for typed answers: ignore punctuation, accept parts.
  function isTextCorrect(input) {
    const answer = normalize(question.correctAnswer);
    const given = normalize(input);
    if (!given) return false;
    if (given === answer) return true;
    const words = answer.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      // single-word answer: accept if the typed word starts with it
      return given.startsWith(words[0]);
    }
    return false;
  }

  function normalize(v) {
    if (v == null) return "";
    return String(v).toLowerCase().trim();
  }

  // ---- results screen ----
  if (done) {
    const total = queue.length;
    const perfect = correctCount === total;
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
        <p className="muted">{perfect ? "All correct. Amazing!" : "Keep practising to improve."}</p>
        <button className="btn btn-primary mt" onClick={() => setDifficulty(null)}>
          &#128214; Quiz again
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
          style={{ width: `${(idx / Math.max(1, queue.length)) * 100}%`, background: subject.colorHex }}
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
            {isPickedCorrect() ? "Correct!" : "Not quite."}
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

// ---- shared state helpers (imported by App) ----
