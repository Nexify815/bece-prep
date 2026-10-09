import { useState, useMemo, useRef, useEffect } from "react";
import { XP } from "../lib/XP.js";
import { isCorrectAnswer, definesMatch } from "../lib/answer.js";
import { speak, stopSpeaking, speakWithVoice, getSavedVoice } from "../lib/tts.js";
import { playRight, playWrong } from "../lib/sound.js";
import { LuRotateCw, LuVolume2, LuCircleStop, LuCircleCheck, LuTriangleAlert, LuX } from "./icons.jsx";
import FocusLayout from "./FocusLayout.jsx";
import ReadButton from "./ReadButton.jsx";
import TermExtras from "./TermExtras.jsx";
import Mascot from "./Mascot.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";
import MatchingGame from "./MatchingGame.jsx";


function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 8 wrong answers in a lesson (typed-recall misses + quiz mistakes put
// together) lock its stair step Ã¢â‚¬â€ you can only restart it for 1 heart.
const MAX_WRONG = 8;

export default function LessonPlayer({
  subjectKey,
  lesson,
  lessonKey,
  onAddXp,
  onLoseHeart,
  onWrongAnswer,
  onComplete,
  onContinue,
  onExit,
  isLastLesson,
  // strict = running on the Stairs (has pass/fail, heart retry, match-it round).
  // Learn uses strict=false: no locks, free retries, no flashcard checkpoint.
  strict = false,
  hearts = 5,
  onFailLesson,
  onClearFailLesson,
  onSRS,
}) {
  const [phase, setPhase] = useState("teach"); // teach | quiz | flashcards | failed | done (flashcards = match-it round)
  const [termIdx, setTermIdx] = useState(0);
  const [showDef, setShowDef] = useState(false);
  // strict teach: typed "say it in your own words" attempt
  const [recallInput, setRecallInput] = useState("");
  const [recallChecked, setRecallChecked] = useState(false);
  const [recallOk, setRecallOk] = useState(false);
  const [remembered, setRemembered] = useState(0); // recalled before reveal
  const [forgot, setForgot] = useState(0); // quiz wrongs feed the lock rule
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctIds, setCorrectIds] = useState({});
  const [wrongInRun, setWrongInRun] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const listenTimer = useRef(null);

  // Never keep the audio running after this screen is gone Ã¢â‚¬â€ once the user
  // leaves (or the route changes) any queued lesson speech must stop, or it
  // keeps talking over the next screen or the next lesson.
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (listenTimer.current) clearTimeout(listenTimer.current);
    };
  }, []);

  // Reads the whole lesson aloud, term by term (audio-lesson mode using the
  // device's text-to-speech Ã¢â‚¬â€ no audio files needed, works offline).
  const playLessonAudio = () => {
    stopSpeaking();
    const queue = [].concat(
      "Lesson: " + lesson.sub,
      lesson.terms.map((t) => `${t.term}. ${t.definition}${t.example ? ". For example, " + t.example : "."}`)
    );
    let i = 0;
    setListening(true);
    const next = () => {
      if (i >= queue.length) {
        setListening(false);
        return;
      }
      speakWithVoice(getSavedVoice(), queue[i]);
      i += 1;
      listenTimer.current = setTimeout(next, 800 + queue[i - 1].length * 55);
    };
    next();
  };

  const stopLessonAudio = () => {
    stopSpeaking();
    setListening(false);
    if (listenTimer.current) clearTimeout(listenTimer.current);
  };

  const terms = lesson.terms;
  // Shuffle the question order ONCE per lesson, not on every render.
  const questions = useMemo(() => shuffle(lesson.questions), [lessonKey]);

  const nextAfterRecall = () => {
    if (termIdx < terms.length - 1) {
      setTermIdx(termIdx + 1);
      setShowDef(false);
      setRecallInput("");
      setRecallChecked(false);
      setRecallOk(false);
    } else {
      stopLessonAudio();
      // Learn has no quiz Ã¢â‚¬â€ review the terms, then you're done.
      if (strict && questions.length > 0) {
        setPhase("quiz");
        setQIdx(0);
        setPicked(null);
        setRevealed(false);
        setWrongInRun(0);
      } else {
        setPhase("done");
        onComplete(lessonKey);
      }
    }
  };

  const checkRecall = () => {
    if (!recallInput.trim() || recallChecked) return;
    const ok = strict
      ? definesMatch(recallInput, terms[termIdx].definition)
      : true;
    // Getting the meaning wrong from memory is practice, not a mistake Ã¢â‚¬â€
    // only the button-down quiz wrongs can lock the step.
    if (ok) setRemembered((n) => n + 1);
    setRecallChecked(true);
    setRecallOk(ok);
  };

  function normalize(v) {
    if (v == null) return "";
    return String(v).toLowerCase().trim();
  }

  const question = questions[qIdx];
  const isLastQ = qIdx === questions.length - 1;

  const onPick = (opt) => {
    if (!question || revealed) return;
    setPicked(opt);
    setRevealed(true);
    if (isCorrectAnswer(question, opt)) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
      setEarnedXp((x) => x + XP.perCorrect);
      onAddXp(XP.perCorrect);
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
      setEarnedXp((x) => x + XP.perCorrect);
      onAddXp(XP.perCorrect);
      playRight();
    } else {
      if (onWrongAnswer) onWrongAnswer({ subject: subjectKey, qid: question.id });
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
      playWrong();
    }
  };

  const correct = Object.keys(correctIds).length;
  const perfect = questions.length > 0 && correct === questions.length;
  // pass mark: need at least 60% of the questions right to clear this step
  const PASS_RATE = 0.6;
  const passMark = Math.max(1, Math.ceil(questions.length * PASS_RATE));
  const wrongTotal = forgot + wrongInRun;
  const passed = correct >= passMark && wrongTotal < MAX_WRONG && questions.length > 0;

  const finishQuiz = () => {
    if (perfect) {
      setEarnedXp((x) => x + XP.perfectBonus);
      onAddXp(XP.perfectBonus);
    }
    if (!passed) {
      // lock the step (also recorded on exit) Ã¢â‚¬â€ retry costs a heart
      if (onFailLesson) onFailLesson(lessonKey);
      setPhase("failed");
      return;
    }
    if (strict) {
      // strengthen what was just learnt: quick flashcard pass over this step's terms
      setPhase("flashcards");
      return;
    }
    setPhase("done");
    onComplete(lessonKey);
  };

  const nextQ = () => {
    if (isLastQ) {
      finishQuiz();
    } else {
      setQIdx(qIdx + 1);
      setPicked(null);
      setRevealed(false);
      setTextAnswer("");
    }
  };

  const retryQuiz = () => {
    setCorrectIds({});
    setQIdx(0);
    setPicked(null);
    setRevealed(false);
    setTextAnswer("");
    setWrongInRun(0);
    setForgot(0);
    setEarnedXp(0);
    setPhase("quiz");
  };

  const retryWithHeart = () => {
    if (hearts <= 0) return;
    if (onLoseHeart) onLoseHeart();
    if (onClearFailLesson) onClearFailLesson(lessonKey);
    retryQuiz();
  };

  // ---------- teach phase ----------
  if (phase === "teach") {
    const term = terms[termIdx];
    const pct = ((termIdx + 1) / terms.length) * 100;

    // Right-hand context panel: what this lesson covers and what is at stake.
    // Extra desktop width becomes context, never a wider card.
    const panel = (
      <>
        <div className="focus-panel-card">
          <div className="focus-panel-title">This lesson</div>
          <ul className="term-list">
            {terms.map((t, i) => (
              <li
                key={t.term}
                className={
                  "term-row" +
                  (i === termIdx ? " current" : "") +
                  (recallChecked && recallOk && i <= termIdx ? " ok" : "")
                }
              >
                <span className="term-row-dot">
                  {recallChecked && recallOk && i < termIdx ? <LuCircleCheck size={12} /> : i + 1}
                </span>
                <span className="term-row-name">{t.term}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="focus-panel-card">
          {strict && (
            <div className="focus-panel-row">
              <span>Hearts left</span>
              <strong>{hearts}</strong>
            </div>
          )}
          <div className="focus-panel-row">
            <span>XP in this step</span>
            <strong>{earnedXp}</strong>
          </div>
          <div className="focus-panel-row">
            <span>Terms done</span>
            <strong>
              {termIdx}/{terms.length}
            </strong>
          </div>
        </div>
      </>
    );

    // Free mode (Learn) still uses the plain header.
    const header = (
      <div className="quiz-top">
        <span className="quiz-count">{lesson.sub}</span>
        <span className="quiz-count">
          Term {termIdx + 1} / {terms.length}
        </span>
      </div>
    );

    // Strict (stairs): the learner types the meaning from memory FIRST (active
    // recall, >= 40% key-word match counts) before the definition is revealed.
    if (strict && !showDef && !recallChecked) {
      return (
        <FocusLayout
          title={lesson.sub}
          count={`Term ${termIdx + 1} of ${terms.length}`}
          progress={pct}
          panel={panel}
          actions={
            <>
              <button
                className="focus-btn"
                disabled={!recallInput.trim()}
                onClick={checkRecall}
              >
                Check
              </button>
              <p className="focus-hint">
                {recallInput.trim()
                  ? "Press Enter to check"
                  : "Type a meaning first"}
              </p>
              <button className="focus-link" onClick={onExit}>
                Leave lesson
              </button>
            </>
          }
        >
          <div className="prompt-card">
            <div className="prompt-head">
              <Mascot className="prompt-mascot" size={34} />
              <div className="prompt-text">
                <h2 className="prompt-term">
                  {term.term}
                  <ReadButton text={term.term} className="read-inline" />
                </h2>
                <p className="prompt-sub">Type the meaning in your own words. No peeking.</p>
              </div>
            </div>

            <div className="focus-input mic-wrap">
              <input
                className="txt-input"
                type="text"
                placeholder="It means..."
                value={recallInput}
                onChange={(e) => setRecallInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && recallInput.trim() && !recallChecked) checkRecall();
                }}
                autoComplete="off"
                autoFocus
              />
              <MicButton
                disabled={recallChecked}
                onResult={(t) => setRecallInput((v) => appendDictation(v, t))}
              />
            </div>
          </div>
        </FocusLayout>
      );
    }

    // Strict: after checking the typed attempt.
    if (strict && recallChecked) {
      const isLast = termIdx >= terms.length - 1;
      return (
        <FocusLayout
          title={lesson.sub}
          count={`Term ${termIdx + 1} of ${terms.length}`}
          progress={pct}
          panel={panel}
          actions={
            <>
              <button className="focus-btn" onClick={nextAfterRecall}>
                {isLast ? "Start the quiz" : "Next term"}
              </button>
              <button className="focus-link" onClick={onExit}>
                Leave lesson
              </button>
            </>
          }
        >
          <div className={"result-banner " + (recallOk ? "ok" : "no")}>
            {recallOk ? (
              <LuCircleCheck size={20} />
            ) : (
              <LuTriangleAlert size={20} />
            )}
            <div>
              <strong>{recallOk ? "That's right!" : "Not quite"}</strong>
              <span>
                {recallOk
                  ? `You matched the meaning. +${XP.perTermLearned} XP`
                  : "Compare your answer with the right one."}
              </span>
            </div>
          </div>

          <div className="prompt-card">
            <div className="prompt-head">
              <Mascot className="prompt-mascot" size={34} happy={recallOk} />
              <h2 className="prompt-term">
                {term.term}
                <ReadButton
                  text={
                    term.term +
                    ". " +
                    term.definition +
                    (term.example ? ". Example: " + term.example : "")
                  }
                  className="read-inline"
                />
              </h2>
            </div>

            <div className="recall-compare">
              <div className="recall-box recall-yours">
                <span className="recall-label">Your answer</span>
                <p className="recall-text">{recallInput || "â€”"}</p>
              </div>
              <div className="recall-box recall-right">
                <span className="recall-label">
                  <LuCircleCheck size={13} /> Correct meaning
                </span>
                <p className="recall-text">{term.definition}</p>
              </div>
            </div>
            {term.example && (
              <div className="lesson-example">
                <p>
                  <strong>Example:</strong> {term.example}
                </p>
              </div>
            )}
            <TermExtras term={term} />
          </div>
        </FocusLayout>
      );
    }

    // Free mode (Learn): the definition is shown straight away, self-mark.

    return (
      <div className="lesson-player">
        {header}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((termIdx + 1) / terms.length) * 100}%` }} />
        </div>
        <Mascot className="mascot-big" />
        <div className="card lesson-card">
          <div className="lesson-term">
            {term.term}
            <ReadButton
              text={term.term + ". " + term.definition + (term.example ? ". Example: " + term.example : "")}
              className="read-inline"
            />
          </div>
          <p className="lesson-def">{term.definition}</p>
          {term.example && (
            <div className="lesson-example">
              <p><strong>Example:</strong> {term.example}</p>
            </div>
          )}
          <TermExtras term={term} />
        </div>
        <p className="muted recall-prompt">Be honest with yourself &mdash; it shapes your quiz.</p>
<button className="btn btn-secondary mt" onClick={() => (listening ? stopLessonAudio() : playLessonAudio())}>
          {listening ? <LuCircleStop size={16} /> : <LuVolume2 size={16} />}{" "}
          {listening ? "Stop audio lesson" : "Listen to whole lesson"}
        </button>
        <button className="btn btn-primary mt" onClick={() => nextAfterRecall()}>
          <LuCircleCheck size={16} /> I remembered it
        </button>
        <button className="btn btn-secondary mt" onClick={() => nextAfterRecall()}>
          Didn&rsquo;t know it
        </button>
        <button className="btn btn-secondary mt" onClick={onExit}>Exit</button>
      </div>
    );
  }

  // ---------- matching-game checkpoint (strict, passed) ----------
  if (phase === "flashcards") {
    return (
      <MatchingGame
        subjectKey={subjectKey}
        deck={terms}
        title="Match It"
        compact
        onSRS={onSRS}
        onAddXp={onAddXp}
        onFinish={() => {
          setPhase("done");
          onComplete(lessonKey);
        }}
      />
    );
  }

  // ---------- failed (strict, too many wrong) ----------
  if (phase === "failed") {
    return (
      <div className="center">
        <Mascot className="mascot-big" />
        <h2 className="results-title">{wrongTotal >= MAX_WRONG ? "Step locked" : "Not quite!"}</h2>
        <p className="muted">
          {wrongTotal >= MAX_WRONG
            ? `${wrongTotal} wrong answers is too many (limit ${MAX_WRONG - 1}) to clear this step.`
            : `You got ${correct}/${questions.length}. You need ${passMark} to pass this step.`}
        </p>
        <p className="muted">
          Retrying costs 1 heart. Getting it right clears the lock.
        </p>
        <button
          className="btn btn-primary mt"
          disabled={hearts <= 0}
          onClick={retryWithHeart}
        >
          Try again &middot; 1 heart
        </button>
        {hearts <= 0 && <p className="muted hint mt">No hearts left Ã¢â‚¬â€ wait for a new one.</p>}
        <button className="btn btn-secondary mt" onClick={() => { if (onFailLesson) onFailLesson(lessonKey); if (onExit) onExit(); }}>
          Back to stairs
        </button>
      </div>
    );
  }

  // ---------- done phase ----------
  if (phase === "done") {
    if (!strict) {
      return (
        <div className="center">
          <Mascot className="mascot-big" />
          <h2 className="results-title">{lesson.sub} Ã¢â‚¬â€ done!</h2>
          <p className="muted">
            You reviewed all {terms.length} term{terms.length === 1 ? "" : "s"}. Keep going!
          </p>
          <button className="btn btn-primary mt" onClick={onContinue}>
            Continue
          </button>
        </div>
      );
    }
    if (!passed) {
      return (
        <div className="center">
          <Mascot className="mascot-big" />
          <h2 className="results-title">Not quite!</h2>
          <p className="muted">
            You got {correct}/{questions.length}. You need {passMark} to pass this step.
          </p>
          <button className="btn btn-primary mt" onClick={retryQuiz}>
            <LuRotateCw size={18} /> Try again
          </button>
          <button className="btn btn-secondary mt" onClick={onExit}>
            Back to stairs
          </button>
        </div>
      );
    }
    const totalAwarded = earnedXp + XP.lessonComplete;
    return (
      <div className="center">
        <Mascot className="mascot-big" happy={perfect} />
        <h2 className="results-title">Lesson done!</h2>
        <p className="muted">
          {perfect
            ? "Perfect Ã¢â‚¬â€ every question right!"
            : `You got ${correct}/${questions.length} right.`}{" "}
          +{totalAwarded} XP
        </p>
        {terms.length > 0 && (
          <p className="muted recall-summary">
            From memory: you recalled {remembered} of {terms.length} terms
            before seeing the definition.
          </p>
        )}
        <button className="btn btn-primary mt" onClick={onContinue}>
          Continue
        </button>
      </div>
    );
  }

  // ---------- quiz phase ----------
  if (!question) {
    return <p className="muted">No questions yet.</p>;
  }

  const isTextQ = question.type === "fill-blank";
  const pickedCorrect = isCorrectAnswer(question, picked);

  return (
    <div className="lesson-player">
      <div className="quiz-top">
        <span className="quiz-count">Quiz</span>
        <span className="quiz-count">Q {qIdx + 1} / {questions.length}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }} />
      </div>
      <h3 className="quiz-question">
        {question.question}
        <ReadButton text={question.question} className="read-small" />
      </h3>

      {isTextQ ? (
        <div className="fillblank">
          <div className="mic-wrap">
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
          <p className={"feedback " + (pickedCorrect ? "correct" : "wrong")}>
            {pickedCorrect ? "Correct!" : "Not quite."}
          </p>
          <div className="card mt">
            <p>{question.explanation}</p>
            <ReadButton text={question.explanation} className="read-inline" />
          </div>
          <button className="btn btn-primary mt" onClick={nextQ}>
            {isLastQ ? "Finish" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
