import { useState, useEffect, useMemo } from "react";
import { LuClipboard } from "react-icons/lu";
import { getQuestion, getSubject } from "../data/index.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { playRight, playWrong } from "../lib/sound.js";
import ReadButton from "./ReadButton.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";
import Mascot from "./Mascot.jsx";
import FocusLayout from "./FocusLayout.jsx";
import { LuCircleCheck, LuX, LuTriangleAlert } from "./icons.jsx";

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
      <div className="prep-page">
        <div className="prep-head">
          <h1>Fix your mistakes</h1>
          <p>Answer it right and it clears from your list for good.</p>
        </div>
        {items.length === 0 ? (
          <div className="empty-card">
            <span className="empty-card-icon">
              <LuCircleCheck size={26} color="#22C55E" />
            </span>
            <h2>Nothing to review</h2>
            <p className="muted">
              No mistakes waiting. Keep answering questions — anything you get
              wrong lands here to practise again.
            </p>
            <button
              className="focus-btn"
              onClick={() => (window.location.hash = "/")}
            >
              Back to today&rsquo;s plan
            </button>
          </div>
        ) : (
          <div className="empty-card">
            <span className="empty-card-icon">
              <LuClipboard size={26} color="#F97316" />
            </span>
            <h2>
              {items.length} question{items.length === 1 ? "" : "s"} to re-test
            </h2>
            <p className="muted">
              A short run of just the questions you got wrong before.
            </p>
            <button className="focus-btn" onClick={start}>
              Start review
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
      <FocusLayout
        title="Fix your mistakes"
        count="Review complete"
        progress={100}
        actions={
          <>
            <button
              className="focus-btn"
              onClick={() => (window.location.hash = "/")}
            >
              Back to today&rsquo;s plan
            </button>
            <button className="focus-link" onClick={() => setStarted(false)}>
              Review again
            </button>
          </>
        }
      >
        <div className={"result-banner " + (perfect ? "ok" : "warn")}>
          <Mascot className="prompt-mascot" size={22} happy={perfect} />
          <div>
            <strong>{perfect ? "All clear!" : "Review done"}</strong>
            <span>
              {correctCount}/{total} answered correctly
              {perfect ? " — every mistake cleared." : " — the rest stay on your list."}
            </span>
          </div>
        </div>
      </FocusLayout>
    );
  }

  const current = queue[idx];
  const question = current.question;
  const subject = getSubject(current.subject);
  const isLast = idx === queue.length - 1;

  const isPickedCorrect = () => {
    return isCorrectAnswer(question, picked);
  };

  const onPick = (choice) => {
    if (revealed || queue.length === 0) return;
    setPicked(choice);
    setRevealed(true);
    if (isCorrectAnswer(question, choice)) {
      setCorrectCount(correctCount + 1);
      onAddXp(XP.perCorrect);
      onClearWrong(current.subject, question.id);
      playRight();
    } else {
      onLoseHeart();
      playWrong();
    }
  };

  const submitText = () => {
    if (revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    if (isCorrectAnswer(question, textAnswer.trim())) {
      setCorrectCount(correctCount + 1);
      onAddXp(XP.perCorrect);
      onClearWrong(current.subject, question.id);
      playRight();
    } else {
      onLoseHeart();
      playWrong();
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
    <FocusLayout
      title="Fix your mistakes"
      count={`Question ${idx + 1} of ${queue.length}`}
      progress={((idx + 1) / queue.length) * 100}
      panel={
        <div className="focus-panel-card">
          <div className="focus-panel-title">Review run</div>
          <div className="focus-panel-row">
            <span>Cleared</span>
            <strong>
              {correctCount}/{queue.length}
            </strong>
          </div>
          {subject && (
            <div className="focus-panel-row">
              <span>Subject</span>
              <strong>{subject.name}</strong>
            </div>
          )}
        </div>
      }
      actions={
        revealed ? (
          <button className="focus-btn" onClick={next}>
            {isLast ? "See results" : "Continue"}
          </button>
        ) : null
      }
    >
      <div className="prompt-card">
        <div className="prompt-head">
          <Mascot className="prompt-mascot" size={30} happy={revealed && isPickedCorrect()} />
          <h2 className="quiz-question-focus">
            {question.question}
            <ReadButton text={question.question} className="read-inline" />
          </h2>
        </div>

        {question.type === "fill-blank" ? (
          <>
            <div className="focus-input mic-wrap">
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
              const isWrong = revealed && !isRight && normalize(opt) === normalize(picked);
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
            <div className={"result-banner " + (isPickedCorrect() ? "ok" : "no")}>
              {isPickedCorrect() ? (
                <LuCircleCheck size={20} />
              ) : (
                <LuTriangleAlert size={20} />
              )}
              <div>
                <strong>{isPickedCorrect() ? "Cleared!" : "Not quite"}</strong>
                <span>
                  {isPickedCorrect()
                    ? `+${XP.perCorrect} XP — removed from your mistakes`
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
