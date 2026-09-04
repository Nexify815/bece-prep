import { useState, useMemo } from "react";
import { getSubject } from "../data/index.js";
import { useSnack } from "./Snackbar.jsx";
import { XP } from "../lib/XP.js";
import { speak, stopSpeaking } from "../lib/tts.js";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";

const DIFF = {
  easy: "pill-easy",
  medium: "pill-medium",
  hard: "pill-hard",
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Glossary({ subjectKey, onToggleLearned, onAddXp, onLoseHeart, hearts, learnedTerms }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("list"); // list | quiz | result
  const [result, setResult] = useState(null); // { correct, wrong }

  if (!subject) return <p className="muted">No glossary yet.</p>;

  const terms = subject.data.glossary;
  const learned = terms.filter((t) => !!learnedTerms[`${subjectKey}:${t.id}`]);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      )
    : terms;

  const hasData = terms.length > 0;

  const backToList = () => {
    setView("list");
    setResult(null);
  };

  // ---- review quiz screen ----
  if (view === "quiz") {
    return (
      <ReviewQuiz
        subjectKey={subjectKey}
        subject={subject}
        learned={learned}
        allTerms={terms}
        onUnmark={(key) => onToggleLearned(key)}
        onAddXp={onAddXp}
        onLoseHeart={onLoseHeart}
        onFinish={(data) => {
          setResult(data);
          setView("result");
        }}
        onExit={backToList}
      />
    );
  }

  // ---- result screen ----
  if (view === "result" && result) {
    return (
      <ReviewResult
        result={result}
        subjectKey={subjectKey}
        onDone={backToList}
      />
    );
  }

  // ---- list screen ----
  return (
    <div>
      <div className="section-title">Glossary</div>
      <input
        className="txt-input"
        type="text"
        placeholder="Search for a term..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!hasData && <p className="muted mt">Glossary coming soon.</p>}

      {hasData && learned.length > 0 && (
        <div className="spacer" />
      )}

      {hasData && learned.length > 0 && (
        <button
          className="btn btn-primary"
          disabled={hearts === 0}
          onClick={() => setView("quiz")}
        >
          &#128221; Review ({learned.length} learned)
        </button>
      )}
      {hasData && learned.length > 0 && hearts === 0 && (
        <p className="muted mt center">Out of hearts — you'll get one back in 30 minutes.</p>
      )}

      <div className="spacer" />
      {filtered.map((t) => {
        const isLearned = !!learnedTerms[`${subjectKey}:${t.id}`];
        return (
          <button key={t.id} className="row" onClick={() => setSelected(t)}>
            <span className="row-icon" style={{ color: isLearned ? "var(--brand-primary)" : "var(--text-soft)" }}>
              {isLearned ? "\u2713" : "\u25CB"}
            </span>
            <span className="row-main">
              <span className={"row-title " + subject.colorClass}>{t.term}</span>
              <span className="row-sub">{t.subStrand || t.strand || ""}</span>
            </span>
            <span
              className={"pill " + (DIFF[t.difficulty] || "pill-easy")}
            >
              {t.difficulty}
            </span>
          </button>
        );
      })}

      {selected && (
        <div className="modal-backdrop" onClick={() => { stopSpeaking(); setSelected(null); }}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {selected.term}
              <ReadButton
                text={selected.term + ". " + selected.definition + (selected.example ? ". Example: " + selected.example : "")}
                className="read-inline"
              />
            </div>
            <div className={"pill " + (DIFF[selected.difficulty] || "pill-easy")}>
              {selected.difficulty}
            </div>
            <p className="modal-def">{selected.definition}</p>
            {selected.example && (
              <p className="modal-example">
                <strong>Example:</strong> {selected.example}
              </p>
            )}
            <button
              className="btn btn-primary mt"
              onClick={() => {
                const key = `${subjectKey}:${selected.id}`;
                const wasLearned = !!learnedTerms[key];
                onToggleLearned(key);
                snack(wasLearned ? "Unmarked \u2717" : "Marked as learned \u2713");
                setSelected(null);
              }}
            >
              {learnedTerms[`${subjectKey}:${selected.id}`] ? "Unmark" : "Learned it"}
            </button>
            <button className="btn btn-secondary mt" onClick={() => { stopSpeaking(); setSelected(null); }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Review quiz: test the learned terms -----
function ReviewQuiz({ subjectKey, subject, learned, allTerms, onUnmark, onAddXp, onLoseHeart, onFinish, onExit }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [wrong, setWrong] = useState([]);

  // Snapshot the terms ONCE so unmarking during the quiz doesn't shrink the
  // running quiz (otherwise `term` could disappear mid-quiz).
  const quizTerms = useMemo(() => shuffle(learned), [subjectKey]);

  const term = quizTerms[idx];
  const isLast = idx === quizTerms.length - 1;

  // distractors: OTHER terms (not this one), shuffled once per question
  const options = useMemo(() => {
    if (!term) return [];
    const others = allTerms.filter((t) => t.id !== term.id);
    const distractorPool = shuffle(others).slice(0, 3);
    return shuffle([term, ...distractorPool]);
  }, [term]);

  if (!term) {
    return (
      <div className="center">
        <p className="muted">No learned terms to review.</p>
        <button className="btn btn-secondary mt" onClick={onExit}>Back</button>
      </div>
    );
  }

  function normalize(v) {
    if (v == null) return "";
    return String(v).toLowerCase().trim();
  }

  const onPick = (opt) => {
    if (revealed) return;
    setPicked(opt);
    setRevealed(true);
    if (opt.id !== term.id) {
      setWrong((w) => [...w, term]);
      onUnmark(`${subjectKey}:${term.id}`);
      onLoseHeart();
    } else {
      onAddXp(XP.perCorrect);
    }
  };

  const next = () => {
    if (isLast) {
      onFinish({ correct: quizTerms.length - wrong.length, wrong });
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
  };

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="pill pill-easy">Review</span>
        <span className="quiz-count">Q {idx + 1} / {quizTerms.length}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(idx / quizTerms.length) * 100}%` }} />
      </div>
      <Mascot className="mascot-inline" />
      <h3 className="quiz-question">Which term matches this definition?</h3>
      <div className="card mt">
        <p>{term.definition}</p>
        {term.example && (
          <p className="muted mt">
            <strong>Example:</strong> {term.example}
          </p>
        )}
      </div>
      <div className="spacer" />
      <div className="quiz-options">
        {options.map((opt) => (
          <button
            key={opt.id}
            className={
              "btn-option" +
              (revealed
                ? opt.id === term.id
                  ? " correct"
                  : opt.id === (picked && picked.id)
                  ? " wrong"
                  : ""
                : "")
            }
            onClick={() => onPick(opt)}
            disabled={revealed}
          >
            {opt.term}
          </button>
        ))}
      </div>

      {revealed && (
        <div className="feedback">
          <p className={"feedback " + (picked && picked.id === term.id ? "correct" : "wrong")}>
            {picked && picked.id === term.id ? "Correct!" : "Not quite."}
          </p>
          <button className="btn btn-primary mt" onClick={next}>
            {isLast ? "See result" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

// ----- Result: show score + list terms to re-study (already unmarked) -----
function ReviewResult({ result, subjectKey, onDone }) {
  const total = result.correct + result.wrong.length;
  const perfect = result.wrong.length === 0;
  const accentClass = `accent-${subjectKey}`;

  return (
    <div>
      <div className="center">
        <Mascot className="mascot-big" happy={perfect} />
        <h2 className="results-title">
          {perfect ? "Perfect!" : `You got ${result.correct}/${total}`}
        </h2>
        <p className="muted">
          {perfect
            ? "Every learned term, understood!"
            : "Terms you missed have been unmarked so you can study them again."}
        </p>
      </div>

      {result.wrong.length > 0 && (
        <div className="mt">
          <div className="section-title">Re-study these</div>
          {result.wrong.map((t) => (
            <div key={t.id} className="card mt">
              <div className={"row-title " + accentClass}>{t.term}</div>
              <p className="muted mt">{t.definition}</p>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary mt" onClick={onDone}>
        Back to glossary
      </button>
    </div>
  );
}
