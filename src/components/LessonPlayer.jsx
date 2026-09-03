import { useState, useMemo } from "react";
import { navigate } from "../lib/router.js";

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
  const [textAnswer, setTextAnswer] = useState("");

  const terms = lesson.terms;
  // Shuffle the question order ONCE per lesson, not on every render.
  const questions = useMemo(() => shuffle(lesson.questions), [lessonKey]);

  const totalXP = terms.length * 5 + questions.length * 10;

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
    }
  };

  const submitText = () => {
    if (!question || revealed || !textAnswer.trim()) return;
    setPicked(textAnswer.trim());
    setRevealed(true);
    if (normalize(question.correctAnswer).split(/\s+/).some((w) => normalize(textAnswer).startsWith(w))) {
      setCorrectIds((c) => ({ ...c, [question.id]: true }));
    }
  };

  const correct = Object.keys(correctIds).length;

  const npm_nextQ = () => {
    if (isLastQ) {
      setPhase("done");
      onComplete(lessonKey);
    } else {
      setQIdx(qIdx + 1);
      setPicked(null);
      setRevealed(false);
      setTextAnswer("");
    }
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
        <span className="mascot-big">&#128049;</span>
        <div className="card lesson-card">
          <div className="lesson-term">{term.term}</div>
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
    const perfect = correct === questions.length;
    return (
      <div className="center">
        <span className="mascot-big" dangerouslySetInnerHTML={{ __html: perfect ? "&#128568;" : "&#128049;" }} />
        <h2 className="results-title">Lesson done!</h2>
        <p className="muted">
          {perfect
            ? "Perfect — every question right!"
            : `You got ${correct}/${questions.length} right.`}{" "}
          +{totalXP} XP
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
      <h3 className="quiz-question">{question.question}</h3>

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
          </div>
          <button className="btn btn-primary mt" onClick={npm_nextQ}>
            {isLastQ ? "Finish" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
