import { useState, useMemo } from "react";
import { getSubject } from "../data/index.js";
import { navigate } from "../lib/router.js";

const DIFFS = ["easy", "medium", "hard"];
const DIFF_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_PILL = { easy: "pill-easy", medium: "pill-medium", hard: "pill-hard" };

const XP_PER_CORRECT = 10;
const XP_BONUS_PERFECT = 20;

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
  onAddXp,
  onRecordResult,
  onWrongAnswer,
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
  };

  // ---- difficulty picker ----
  if (!difficulty) {
    return (
      <div>
        <div className="section-title">Quiz</div>
        <p className="muted">Pick a difficulty level.</p>
        <div className="spacer" />
        {DIFFS.map((d) => {
          const n = questions.filter((q) => q.difficulty === d).length;
          return (
            <button
              key={d}
              className="row"
              disabled={n === 0}
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
      const bonus = isLast ? XP_BONUS_PERFECT : 0;
      onAddXp(XP_PER_CORRECT + bonus);
    } else {
      onWrongAnswer({ subject: subjectKey, qid: question.id });
    }
    onRecordResult(subjectKey, question.difficulty, correct);
  };

  const submitText = () => {
    if (revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    const correct = isTextCorrect(textAnswer);
    if (correct) {
      const newCount = correctCount + 1;
      setCorrectCount(newCount);
      const bonus = isLast ? XP_BONUS_PERFECT : 0;
      onAddXp(XP_PER_CORRECT + bonus);
    } else {
      onWrongAnswer({ subject: subjectKey, qid: question.id });
    }
    onRecordResult(subjectKey, question.difficulty, correct);
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
    setMatchOption(null);
    setTextAnswer("");
  };

  const mascot = revealed
    ? isPickedCorrect()
      ? "&#128568;"
      : "&#128049;"
    : "&#128049;";

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
        <span className="mascot-big" dangerouslySetInnerHTML={{ __html: perfect ? "&#128568;" : "&#128049;" }} />
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

      <span className="mascot-inline" role="img" dangerouslySetInnerHTML={{ __html: mascot }} />

      <h3 className="quiz-question">{question.question}</h3>

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
export { XP_PER_CORRECT, XP_BONUS_PERFECT };
