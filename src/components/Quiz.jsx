import { useState, useMemo, useEffect, useRef } from "react";
import { getSubject } from "../data/index.js";
import { QUIZ_SESSION as SESSION_SIZE } from "../lib/plan.js";
import { navigate } from "../lib/router.js";
import { msUntilNextHeart } from "../lib/storage.js";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { playRight, playWrong } from "../lib/sound.js";
import { useSnack } from "./Snackbar.jsx";
import { LuCircleCheck, LuX, LuLightbulb, LuBell, LuChevronRight, LuTriangleAlert } from "./icons.jsx";
import FocusLayout from "./FocusLayout.jsx";
import ReadButton from "./ReadButton.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";
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
  const [showHeartsBubble, setShowHeartsBubble] = useState(true);
  const [heartMs, setHeartMs] = useState(0);
  const [wrongInRun, setWrongInRun] = useState(0); // wrong answers in this quiz; lose a heart every 3
  const [usedHint, setUsedHint] = useState(false);
  const [hintText, setHintText] = useState("");
  const [removed, setRemoved] = useState({});
  // hooks must stay above every early return, or React sees a changing hook
  // count between renders (error #310)
  const topRef = useRef(null);

  // each new question starts at the top of the task column — never mid-scroll.
  // Depend on queue[idx], not `question`: this hook sits above the early
  // returns, and `question` is not initialised until after them.
  useEffect(() => {
    if (topRef.current) topRef.current.scrollIntoView({ block: "start" });
  }, [idx, queue[idx]]);

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
                Out of hearts &#183; new one in <strong>{heartCountdown}</strong>
              </span>
              <button
                className="hearts-bubble-close"
                aria-label="Dismiss"
                onClick={() => setShowHeartsBubble(false)}
              >
<LuX size={15} />
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
<span className="row-chev"><LuChevronRight size={18} /></span>
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
      snack(`Not enough XP. A hint costs ${HINT_COST} XP.`, LuTriangleAlert);
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
    snack("Hint used", LuLightbulb);
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
          <LuBell size={18} /> Back to levels
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
        onCorrect={() => {
          const newCount = correctCount + 1;
          setCorrectCount(newCount);
          const bonus = isLast && newCount === queue.length ? XP.perfectBonus : 0;
          onAddXp(XP.perCorrect + bonus);
          if (onSolved) onSolved(subjectKey, question.difficulty, question.id);
        }}
        onWrong={() => {
          onWrongAnswer({ subject: subjectKey, qid: question.id });
          const nextWrong = wrongInRun + 1;
          setWrongInRun(nextWrong);
          if (nextWrong % 3 === 0) onLoseHeart();
        }}
        onNext={next}
      />
    );
  }

  const totalQ = queue.length;
  const scorePct = totalQ ? Math.round((correctCount / totalQ) * 100) : 0;

  const panel = (
    <>
      <div className="focus-panel-card">
        <div className="focus-panel-title">This set</div>
        <div className="focus-panel-row">
          <span>Difficulty</span>
          <strong>{DIFF_LABEL[difficulty]}</strong>
        </div>
        <div className="focus-panel-row">
          <span>Correct</span>
          <strong>
            {correctCount}/{totalQ}
          </strong>
        </div>
        <div className="focus-panel-row">
          <span>Hearts left</span>
          <strong>{hearts}</strong>
        </div>
        <div className="focus-panel-row">
          <span>XP</span>
          <strong>{xp}</strong>
        </div>
      </div>
      <div className="focus-panel-card">
        <div className="focus-panel-title">Score</div>
        <div className="focus-bar" style={{ height: 10 }}>
          <span style={{ width: scorePct + "%" }} />
        </div>
        <p className="focus-panel-note">{scorePct}% correct so far</p>
      </div>
    </>
  );

  return (
    <FocusLayout
      title={subject.name}
      count={`Question ${idx + 1} of ${totalQ}`}
      progress={((idx + 1) / Math.max(1, totalQ)) * 100}
      panel={panel}
      actions={
        revealed ? (
          <button className="focus-btn" onClick={next}>
            {isLast ? "See results" : "Continue"}
          </button>
        ) : null
      }
    >
      <div className="prompt-card" ref={topRef}>
        <div className="prompt-head">
          <Mascot className="prompt-mascot" size={30} happy={revealed && isPickedCorrect()} />
          <h2 className="quiz-question-focus">
            {question.question}
            <ReadButton text={question.question} className="read-inline" />
          </h2>
        </div>

        {question.type === "fill-blank" && (
          <p className="prompt-sub">Type your answer below (one word).</p>
        )}

        {question.type === "fill-blank" ? (
          <div className="focus-input mic-wrap mt">
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
            <MicButton
              disabled={revealed}
              onResult={(t) => setTextAnswer((v) => appendDictation(v, t))}
            />
          </div>
        ) : (
          <div className="focus-options">
            {question.options.map((opt, i) => {
              const isRight = revealed && isCorrectAnswer(question, opt);
              const isWrong = revealed && !isRight && normalize(opt) === normalize(picked);
              return (
                <button
                  key={opt}
                  className={
                    "focus-option" +
                    (removed[opt] ? " hint-removed" : "") +
                    (isRight ? " right" : "") +
                    (isWrong ? " wrong" : "")
                  }
                  onClick={() => onPick(opt)}
                  disabled={revealed || removed[opt]}
                >
                  <span className="focus-option-key">
                    {isRight ? (
                      <LuCircleCheck size={18} />
                    ) : isWrong ? (
                      <LuX size={18} />
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

        {!revealed && question.type !== "match" && (
          <div className="quiz-hint-row">
            <button className="hint-btn" disabled={usedHint} onClick={useHint}>
              <LuLightbulb size={15} /> {usedHint ? "Hint used" : `Hint (${HINT_COST} XP)`}
            </button>
            {hintText && <p className="prompt-sub">{hintText}</p>}
          </div>
        )}

        {/* result sits inside the question card so the answer and the primary
            action are never separated by a scroll */}
        {revealed && (
          <>
            <div className={"result-banner " + (isPickedCorrect() ? "ok" : "no")}>
              {isPickedCorrect() ? (
                <LuCircleCheck size={20} />
              ) : (
                <LuTriangleAlert size={20} />
              )}
              <div>
                <strong>{isPickedCorrect() ? "Correct!" : "Not quite"}</strong>
                <span>
                  {isPickedCorrect()
                    ? `+${XP.perCorrect} XP`
                    : `The answer was "${question.correctAnswer}"`}
                </span>
              </div>
            </div>

            <div className="explain-card">
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
          </>
        )}
      </div>
    </FocusLayout>
  );
}

// Real matching interaction: tap one card from the left column, then its
// partner on the right. Correct pairs lock in green; a wrong tap turns the
// left card red until a correct partner is found. The question counts as
// correct only if every pair was matched without a single wrong tap.
function MatchQuestion({ question, onCorrect, onWrong, onNext }) {
  const [leftPicked, setLeftPicked] = useState(null);
  const [rightPicked, setRightPicked] = useState(null);
  const [collect, setCollect] = useState([]);   // matched pairs [[leftIdx, rightIdx]]
  const [failed, setFailed] = useState({});     // leftIdx -> true (had a wrong tap)
  const [hadWrong, setHadWrong] = useState(false);
  const [result, setResult] = useState(null);   // "correct" | "wrong"
  const [allDone, setAllDone] = useState(false);

  const pairs = useMemo(() => {
    const raw = question.answerMap || question.pairs || [];
    const out = [];
    raw.forEach((p) => {
      if (p && typeof p === "object" && !Array.isArray(p)) {
        out.push({ left: p.left ?? p.term ?? p[0], right: p.right ?? p.def ?? p[1] });
      } else if (Array.isArray(p) && p.length >= 2) {
        out.push({ left: p[0], right: p[1] });
      }
    });
    return out;
  }, [question]);

  const rightOrder = useMemo(() => shuffle(pairs.map((p, i) => i)), [pairs]);
  const matchedLeft = new Set(collect.map((c) => c[0]));
  const matchedRight = new Set(collect.map((c) => c[1]));

  if (!pairs.length) {
    return (
      <div>
        <h3 className="quiz-question">{question.question}</h3>
        <p className="muted">This match question needs its pairs.</p>
        <button className="btn btn-secondary mt" onClick={onNext}>Continue</button>
      </div>
    );
  }

  const tapLeft = (li) => {
    if (allDone || matchedLeft.has(li)) return;
    setLeftPicked(li);
    setRightPicked(li === leftPicked ? null : rightPicked); // retapping deselects
  };

  const tapRight = (ri) => {
    if (allDone || matchedRight.has(ri)) return;
    setRightPicked(ri === rightPicked ? null : ri);
  };

  const resolvePick = () => {
    if (leftPicked == null || rightPicked == null) return;
    if (leftPicked === rightPicked) {
      // correct pair!
      const nextCollect = [...collect, [leftPicked, rightPicked]];
      setCollect(nextCollect);
      setLeftPicked(null);
      setRightPicked(null);
      if (nextCollect.length === pairs.length) {
        setAllDone(true);
        if (hadWrong) {
          setResult("wrong");
          onWrong();
          playWrong();
        } else {
          setResult("correct");
          onCorrect();
          playRight();
        }
        return;
      }
      playRight();
      return;
    }
    // wrong pair: leave it red, let the kid try again
    setHadWrong(true);
    setFailed((f) => ({ ...f, [leftPicked]: true }));
    setLeftPicked(null);
    setRightPicked(null);
    playWrong();
  };

  // pressing "Check" resolves the current selection, if any
  const canResolve = leftPicked != null && rightPicked != null;

  return (
    <div className="match-wrap">
      <div className="quiz-top">
        <span className="pill pill-easy">Match</span>
        <span className="quiz-count">Tap the card on the left, then its partner</span>
      </div>

      <h3 className="quiz-question">
        {question.question}
        <ReadButton text={question.question} className="read-small" />
      </h3>

      <p className="muted hint">Tap one card on the left, then the card it matches on the right.</p>

      <div className="match-grid">
        <div className="match-col">
          {pairs.map((p, i) => {
            const locked = matchedLeft.has(i);
            return (
              <button
                key={i}
                className={
                  "match-card left" +
                  (leftPicked === i ? " picked" : "") +
                  (locked ? " matched" : "") +
                  (failed[i] && !locked ? " failed" : "")
                }
                onClick={() => tapLeft(i)}
                disabled={allDone || locked}
              >
                {p.left}
                {locked && (
                  <span className="match-mark">
                    <LuCircleCheck size={16} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="match-col right">
          {rightOrder.map((ri) => {
            const locked = matchedRight.has(ri);
            return (
              <button
                key={ri}
                className={
                  "match-card right" +
                  (rightPicked === ri ? " picked" : "") +
                  (locked ? " matched" : "")
                }
                onClick={() => tapRight(ri)}
                disabled={allDone || locked}
              >
                {pairs[ri].right}
                {locked && (
                  <span className="match-mark">
                    <LuCircleCheck size={16} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!allDone ? (
        <button
          className="btn btn-primary mt"
          disabled={!canResolve}
          onClick={resolvePick}
        >
          Match
        </button>
      ) : (
        <div className="feedback">
          <p className={"feedback " + (result === "correct" ? "correct" : "wrong")}>
            {result === "correct"
              ? "All matched \u2014 no mistakes!"
              : "All matched, but with some wrong taps. Review the cards above, then retry."}
          </p>
          <div className="card mt">
            <p>{question.explanation}</p>
            <ReadButton text={question.explanation} className="read-inline" />
          </div>
          <button className="btn btn-primary mt" onClick={onNext}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}



