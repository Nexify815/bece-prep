import { useState, useMemo } from "react";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { playRight, playWrong, playWin } from "../lib/sound.js";
import Mascot from "./Mascot.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";
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

export default function MegaQuiz({ subjectKey, questions, alreadyPassed, onAddXp, onLoseHeart, onWrongAnswer, onPass, onExit }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctIds, setCorrectIds] = useState({});
  const [wrongInRun, setWrongInRun] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [status, setStatus] = useState(null); // null | passed | failed

  const quiz = useMemo(() => shuffle(questions), [subjectKey]);
  const total = quiz.length;
  const question = quiz[idx];
  const isLast = idx === total - 1;
  const correct = Object.keys(correctIds).length;
  const passMark = Math.max(1, Math.ceil(total * 0.8)); // 80% to pass
  const failedCount = wrongInRun;

  function normalize(v) {
    if (v == null) return "";
    return String(v).toLowerCase().trim();
  }

  const finish = () => {
    const ok = correct >= passMark;
    setStatus(ok ? "passed" : "failed");
    if (ok) { onPass(); playWin(); }
  };

  const onPick = (opt) => {
    if (!question || revealed) return;
    setPicked(opt);
    setRevealed(true);
    if (isCorrectAnswer(question, opt)) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
      if (!alreadyPassed) onAddXp(XP.perCorrect);
      playRight();
    } else {
      if (onWrongAnswer) onWrongAnswer({ subject: subjectKey, qid: question.id });
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
      playWrong();
    }
  };

  const submitText = () => {
    if (!question || revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    if (isCorrectAnswer(question, textAnswer)) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
      if (!alreadyPassed) onAddXp(XP.perCorrect);
      playRight();
    } else {
      if (onWrongAnswer) onWrongAnswer({ subject: subjectKey, qid: question.id });
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
      playWrong();
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
        <Mascot className="mascot-big mascot-result" happy={passed} />
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
  const pickedCorrect = isCorrectAnswer(question, picked);

  return (
    <FocusLayout
      title="Summit mega quiz"
      count={`Question ${idx + 1} of ${total}`}
      progress={((idx + 1) / total) * 100}
      panel={
        <div className="focus-panel-card">
          <div className="focus-panel-title">Summit</div>
          <div className="focus-panel-row">
            <span>Correct</span>
            <strong>
              {correct}/{total}
            </strong>
          </div>
          <div className="focus-panel-row">
            <span>Needed to pass</span>
            <strong>{passMark}</strong>
          </div>
          <div className="focus-panel-row">
            <span>Wrong so far</span>
            <strong>{failedCount}</strong>
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
          <h2 className="quiz-question-focus">{question.question}</h2>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && textAnswer.trim() && !revealed) submitText();
                }}
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
            </div>
          </>
        )}
      </div>
    </FocusLayout>
  );
}
