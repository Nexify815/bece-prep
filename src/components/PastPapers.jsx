import { useState, useEffect } from "react";
import { PAST_PAPERS } from "../data/index.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { playRight, playWrong, playWin } from "../lib/sound.js";
import OutOfHearts from "./OutOfHearts.jsx";
import Mascot from "./Mascot.jsx";

export default function PastPapers({ onAddXp, onLoseHeart, hearts, onWrongAnswer, onRunActiveChange, onLivesRunChange, onComplete }) {
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

  const papers = PAST_PAPERS.map((p) => {
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
  if (!paper) {
    if (hearts === 0) return <OutOfHearts />;
    return (
      <div>
        <div className="section-title">Past Papers</div>
        <p className="muted">Real BECE objective questions, timed practice.</p>
        <div className="spacer" />
        {papers.map((p, pi) => (
          <div key={p.key} className="card mt">
            <div className="row-title">{p.icon} {p.name}</div>
            <div className="spacer" />
            {Object.keys(p.years)
              .sort((a, b) => b - a)
              .map((y) => (
                <button
                  key={y}
                  className="row"
                  onClick={() => start(pi, y)}
                >
                  <span className="row-main">
                    <span className="row-title">BECE {y}</span>
                    <span className="row-sub">{p.years[y].length} objective questions</span>
                  </span>
                  <span className="row-chev">&#8250;</span>
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
      const bonus = isLast && newCount === questions.length ? XP.perfectBonus : 0;
      onAddXp(XP.perCorrect + bonus);
      playRight();
    } else {
      if (onWrongAnswer) onWrongAnswer({ subject: paper.key, qid: question.id });
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
      playWrong();
    }
  };

  const next = () => {
    if (isLast) {
      setDone(true);
      if (onComplete) onComplete();
      if (correctCount === questions.length && questions.length > 0) playWin();
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
  };

  if (done) {
    return (
      <div className="center">
        <Mascot className="mascot-big" happy />
        <h2 className="results-title">Done! {correctCount}/{questions.length}</h2>
        <button className="btn btn-primary mt" onClick={() => setActive(null)}>
          Back to papers
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="pill pill-medium">BECE {selectedYear}</span>
        <span className="quiz-count">Q {idx + 1} / {questions.length}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <h3 className="quiz-question">{question.question}</h3>
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
      {revealed && (
        <div className="feedback">
          <p className={"feedback " + (pickedCorrect ? "correct" : "wrong")}>
            {pickedCorrect ? "Correct!" : "Not quite."}
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
