import { useState, useMemo } from "react";
import { navigate } from "../lib/router.js";
import { XP } from "../lib/XP.js";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LessonPlayer({
  subjectKey,
  lesson,
  lessonKey,
  onAddXp,
  onLoseHeart,
  onComplete,
  onContinue,
  onExit,
  isLastLesson,
}) {
  const [phase, setPhase] = useState("teach"); // teach | quiz | done
  const [termIdx, setTermIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctIds, setCorrectIds] = useState({});
  const [earnedXp, setEarnedXp] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");

  const terms = lesson.terms;
  // Shuffle the question order ONCE per lesson, not on every render.
  const questions = useMemo(() => shuffle(lesson.questions), [lessonKey]);

  const nextTerm = () => {
    if (termIdx < terms.length - 1) {
      setTermIdx(termIdx + 1);
    } else {
      if (questions.length === 0) {
        setPhase("done");
      } else {
        setPhase("quiz");
        setQIdx(0);
        setPicked(null);
        setRevealed(false);
      }
    }
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
    if (normalize(opt) === normalize(question.correctAnswer)) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
      setEarnedXp((x) => x + XP.perCorrect);
      onAddXp(XP.perCorrect);
    } else {
      onLoseHeart();
    }
  };

  const submitText = () => {
    if (!question || revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    if (normalize(question.correctAnswer).split(/\s+/).some((w) => normalize(textAnswer).startsWith(w))) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
      setEarnedXp((x) => x + XP.perCorrect);
      onAddXp(XP.perCorrect);
    } else {
      onLoseHeart();
    }
  };

  const correct = Object.keys(correctIds).length;
  const perfect = questions.length > 0 && correct === questions.length;
  // pass mark: need at least 60% of the questions right to clear this step
  const PASS_RATE = 0.6;
  const passMark = Math.max(1, Math.ceil(questions.length * PASS_RATE));
  const passed = correct >= passMark && questions.length > 0;

  const npm_nextQ = () => {
    if (isLastQ) {
      // perfect bonus if every question in the lesson was answered correctly
      if (questions.length > 0 && Object.keys(correctIds).length === questions.length) {
        setEarnedXp((x) => x + XP.perfectBonus);
        onAddXp(XP.perfectBonus);
      }
      setPhase("done");
      if (passed) onComplete(lessonKey);
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
    setEarnedXp(0);
    setPhase("quiz");
  };
  // ---------- teach phase ----------
  if (phase === "teach") {
    const term = terms[termIdx];
    return (
      <div className="lesson-player">
        <div className="quiz-top">
          <span className="quiz-count">{lesson.sub}</span>
          <span className="quiz-count">Term {termIdx + 1} / {terms.length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(termIdx / terms.length) * 100}%` }} />
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
        </div>
        <button className="btn btn-primary mt" onClick={nextTerm}>
          {termIdx === terms.length - 1 && questions.length > 0
            ? "Go to quiz"
            : "Got it"}
        </button>
        <button className="btn btn-secondary mt" onClick={onExit}>Exit</button>
      </div>
    );
  }

  // ---------- done phase ----------
  if (phase === "done") {
    if (!passed) {
      return (
        <div className="center">
          <Mascot className="mascot-big" />
          <h2 className="results-title">Not quite!</h2>
          <p className="muted">
            You got {correct}/{questions.length}. You need {passMark} to pass this step.
          </p>
          <button className="btn btn-primary mt" onClick={retryQuiz}>
            &#8635; Try again
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
            ? "Perfect — every question right!"
            : `You got ${correct}/${questions.length} right.`}{" "}
          +{totalAwarded} XP
        </p>
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
  const pickedCorrect = isTextQ
    ? normalize(question.correctAnswer).split(/\s+/).some((w) => normalize(picked).startsWith(w))
    : normalize(picked) === normalize(question.correctAnswer);

  return (
    <div className="lesson-player">
      <div className="quiz-top">
        <span className="quiz-count">Quiz</span>
        <span className="quiz-count">Q {qIdx + 1} / {questions.length}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
      </div>
      <h3 className="quiz-question">
        {question.question}
        <ReadButton text={question.question} className="read-small" />
      </h3>

      {isTextQ ? (
        <div className="fillblank">
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
          <p className={"feedback " + (pickedCorrect ? "correct" : "wrong")}>
            {pickedCorrect ? "Correct!" : "Not quite."}
          </p>
          <div className="card mt">
            <p>{question.explanation}</p>
            <ReadButton text={question.explanation} className="read-inline" />
          </div>
          <button className="btn btn-primary mt" onClick={npm_nextQ}>
            {isLastQ ? "Finish" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
