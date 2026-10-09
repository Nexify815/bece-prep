import { useState, useEffect } from "react";
import { PAST_PAPERS } from "../data/index.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { playRight, playWrong, playWin } from "../lib/sound.js";
import OutOfHearts from "./OutOfHearts.jsx";
import Mascot from "./Mascot.jsx";
import { LuChevronRight, SubjectIcon, LuFileText, LuCircleCheck, LuX, LuTriangleAlert } from "./icons.jsx";
import FocusLayout from "./FocusLayout.jsx";

export default function PastPapers({ onAddXp, onLoseHeart, hearts, onWrongAnswer, onRunActiveChange, onLivesRunChange, onComplete, free = false, scope = null, onResult = null }) {
  const [active, setActive] = useState(null); // paper index
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongInRun, setWrongInRun] = useState(0);
  const [done, setDone] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);

  // report whether a test run is in progress (for leave confirmation + lives modal)
  useEffect(() => {
    const running = active != null && !done;
    if (onRunActiveChange) onRunActiveChange(running);
    if (onLivesRunChange) onLivesRunChange(running);
  }, [active, done, onRunActiveChange, onLivesRunChange]);

  const papers = PAST_PAPERS.filter((p) => (scope ? scope.includes(p.key) : true)).map((p) => {
    const years = {};
    (p.data.questions || []).forEach((q) => {
      if (!years[q.year]) years[q.year] = [];
      years[q.year].push(q);
    });
    return { ...p, years };
  });

  const paper = active != null ? papers[active] : null;

  const start = (paperIdx, year) => {
    const qs = papers[paperIdx].years[year];
    setActive(paperIdx);
    setSelectedYear(year);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setCorrectCount(0);
    setWrongInRun(0);
    setDone(false);
  };

  // picker
  // picker
  if (!paper) {
    if (!free && hearts === 0) return <OutOfHearts />;
    return (
      <div className="prep-page">
        <div className="prep-head">
          <h1>Past Papers</h1>
          <p>Real BECE objective questions. Pick a subject and a year.</p>
        </div>

        {papers.map((p) => (
          <div key={p.key} className="prep-group">
            <div className="prep-group-head">
              <SubjectIcon subjectKey={p.iconKey} size={18} />
              <span>{p.name.replace(" (Past Papers)", "")}</span>
            </div>
            {Object.keys(p.years)
              .sort((a, b) => b - a)
              .map((y) => (
                <button
                  key={y}
                  className="prep-item"
                  onClick={() => start(papers.indexOf(p), y)}
                >
                  <span className="prep-item-icon" style={{ background: p.colorHex }}>
                    <LuFileText size={18} color="#fff" />
                  </span>
                  <span className="prep-item-body">
                    <span className="prep-item-title">BECE {y}</span>
                    <span className="prep-item-sub">
                      {p.years[y].length} objective questions
                    </span>
                  </span>
                  <LuChevronRight size={18} className="prep-item-chev" />
                </button>
              ))}
          </div>
        ))}
      </div>
    );
  }

  const questions = paper.years[selectedYear];
  const question = questions[idx];
  const isLast = idx === questions.length - 1;
  const pickedCorrect = !!picked && isCorrectAnswer(question, picked);

  const onPick = (opt) => {
    if (revealed) return;
    setPicked(opt);
    setRevealed(true);
    const correct = isCorrectAnswer(question, opt);
    if (correct) {
      setCorrectCount(correctCount + 1);
      const newCount = correctCount + 1;
      const bonus = !free && isLast && newCount === questions.length ? XP.perfectBonus : 0;
      if (!free) onAddXp(XP.perCorrect + bonus);
      playRight();
    } else {
      if (onWrongAnswer) onWrongAnswer({ subject: paper.key, qid: question.id });
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (!free && nextWrong % 3 === 0) onLoseHeart();
      playWrong();
    }
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      if (onComplete) onComplete();
      if (onResult) onResult(correctCount, questions.length, paper.key, selectedYear);
      if (correctCount === questions.length && questions.length > 0) playWin();
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
  };

  if (done) {
    const pctScore = questions.length
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
    return (
      <FocusLayout
        title={"BECE " + selectedYear}
        count="Paper complete"
        progress={100}
        actions={
          <button className="focus-btn" onClick={() => setActive(null)}>
            Back to papers
          </button>
        }
      >
        <div className={"result-banner " + (pctScore >= 50 ? "ok" : "no")}>
          <Mascot className="prompt-mascot" size={22} happy={pctScore >= 50} />
          <div>
            <strong>
              {correctCount}/{questions.length} correct
            </strong>
            <span>{pctScore}% — nice work.</span>
          </div>
        </div>
      </FocusLayout>
    );
  }

  return (
    <FocusLayout
      title={"BECE " + selectedYear}
      count={`Question ${idx + 1} of ${questions.length}`}
      progress={((idx + 1) / questions.length) * 100}
      panel={
        <div className="focus-panel-card">
          <div className="focus-panel-title">This paper</div>
          <div className="focus-panel-row">
            <span>Subject</span>
            <strong>{paper.name.replace(" (Past Papers)", "")}</strong>
          </div>
          <div className="focus-panel-row">
            <span>Correct</span>
            <strong>
              {correctCount}/{questions.length}
            </strong>
          </div>
          {!free && (
            <div className="focus-panel-row">
              <span>Hearts left</span>
              <strong>{hearts}</strong>
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
          <Mascot className="prompt-mascot" size={30} happy={revealed && pickedCorrect} />
          <h2 className="quiz-question-focus">{question.question}</h2>
        </div>

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
                    ? free
                      ? "Correct"
                      : `+${XP.perCorrect} XP`
                    : `The answer was "${question.correctAnswer}"`}
                </span>
              </div>
            </div>

            {question.explanation && (
              <div className="explain-card">
                <p>{question.explanation}</p>
              </div>
            )}
          </>
        )}
      </div>
    </FocusLayout>
  );
}
