import { useState } from "react";
import { getSubject } from "../data/index.js";
import { useSnack } from "./Snackbar.jsx";
import { playWin } from "../lib/sound.js";
import ReadButton from "./ReadButton.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";
import FocusLayout from "./FocusLayout.jsx";
import { LuCircleCheck, SubjectIcon, LuChevronRight } from "./icons.jsx";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Significant words of a definition (drop tiny stopwords) used for the checklist.
function keywords(def) {
  const stops = new Set(["the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is", "are", "that", "this", "with", "when", "how", "what", "it", "its", "as", "by", "be"]);
  return (def || "").toLowerCase().match(/[a-z]+/g)?.filter((w) => !stops.has(w)) || [];
}

export default function SectionB({ onAward }) {
  const snack = useSnack();
  const [subjectKey, setSubjectKey] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [marked, setMarked] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const start = (key) => {
    const subject = getSubject(key);
    const terms = shuffle(subject.data.glossary).slice(0, 3);
    setSubjectKey(key);
    setPrompts(terms);
    setIdx(0);
    setAnswer("");
    setMarked({});
    setSubmitted(false);
    setDone(false);
  };

if (!subjectKey) {
    return (
      <div className="prep-page">
        <div className="prep-head">
          <h1>Section B &mdash; writing practice</h1>
          <p>
            The BECE paper has written answers too. Practise putting definitions
            into your own words and check yourself against the rubric.
          </p>
        </div>
        <div className="prep-group">
          <div className="prep-group-head">Pick a subject</div>
          {["math", "science", "english", "social"].map((k) => {
            const s = getSubject(k);
            return (
              <button key={k} className="prep-item" onClick={() => start(k)}>
                <span className="prep-item-icon"><SubjectIcon subjectKey={k} /></span>
                <span className="prep-item-body">
                  <span className={"prep-item-title " + s.colorClass}>{s.name}</span>
                  <span className="prep-item-sub">3 written prompts &middot; self-marked</span>
                </span>
                <span className="prep-item-chev"><LuChevronRight size={18} /></span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const subject = getSubject(subjectKey);
  const term = prompts[idx];
  const isLast = idx === prompts.length - 1;

  if (done) {
    return (
      <FocusLayout
        title="Writing practice"
        count="done"
        progress={100}
        actions={
          <>
            <button className="focus-btn" onClick={() => { setSubjectKey(null); setPrompts([]); }}>
              Pick another subject
            </button>
            <button className="focus-link" onClick={() => (window.location.hash = "/")}>
              Back home
            </button>
          </>
        }
      >
        <div className="done-hero">
          <span className="done-hero-icon">
            <SubjectIcon subjectKey={subject.iconKey} size={44} />
          </span>
          <h2>Writing practice done!</h2>
          <p className="muted">
            Describing ideas in your own words is exam practice worth its weight
            in gold.
          </p>
        </div>
      </FocusLayout>
    );
  }

const kw = keywords(term.definition).slice(0, 4);

  // auto-mark the rubric as the child writes (still lets them toggle)
  const autoMarked = (text) => {
    const t = text.trim();
    const lengthOk = t.length >= 40;
    const kwHit = kw.filter((w) => t.toLowerCase().includes(w)).length;
    const kwsOk = kwHit >= 2;
    const exampleLike = /example|e\.g\.|for example|such as|because|since/i.test(t) || (term.example || "").split(/\s+/).slice(0, 4).some((w) => t.toLowerCase().includes(w.toLowerCase()));
    setMarked({ lengthOk, kwsOk, exampleLike });
  };

  const submit = () => {
    const keys = ["lengthOk", "kwsOk", "exampleLike"].filter((k) => marked[k]);
    if (keys.length < 2) {
      snack("Tick at least two rubric points before handing in.");
      return;
    }
    setSubmitted(true);
  };

  const rubric = [
    { key: "lengthOk", label: "Two full sentences (40+ characters)" },
    { key: "kwsOk", label: "Key words like " + (kw.length ? kw.slice(0, 3).join(", ") : "the key ideas") },
    { key: "exampleLike", label: "An example (for example, such as&hellip;)" },
  ];
  const checkedCount = rubric.filter((r) => marked[r.key]).length;

  return (
    <FocusLayout
      title="Section B"
      count={"Q " + (idx + 1) + " / " + prompts.length}
      progress={submitted ? ((idx + 1) / prompts.length) * 100 : (idx / prompts.length) * 100}
      panel={
        <div className="focus-panel-card">
          <div className="focus-panel-title">{subject.name} writing</div>
          <p className="focus-panel-note">
            Section B marks four things: a clear definition in your own words,
            the right key words, one example, and tidy handwriting.
          </p>
          <div className="focus-panel-row">
            <span>Checklist</span>
            <strong>{checkedCount} / {rubric.length}</strong>
          </div>
          <div className="focus-panel-row">
            <span>Hand in</span>
            <strong>{checkedCount >= 2 ? "Ready" : "Tick 2 first"}</strong>
          </div>
        </div>
      }
      actions={
        submitted ? (
          <button
            className="focus-btn"
            onClick={() => {
              playWin();
              onAward(subjectKey, term.id);
              if (isLast) { setDone(true); }
              else { setIdx(idx + 1); setAnswer(""); setMarked({}); setSubmitted(false); }
            }}
          >
            {isLast ? "Finish writing practice" : "Next prompt"}
          </button>
        ) : (
          <button
            className="focus-btn"
            onClick={submit}
            disabled={answer.trim().length === 0 || checkedCount < 2}
          >
            Hand in
          </button>
        )
      }
    >
      <span className="focus-tag">{subject.name} &middot; written answer</span>

      <div className="card lesson-card">
        <p className="lesson-term">{term.term}</p>
        <p className="lesson-def">
          <strong>Prompt:</strong> Define &ldquo;{term.term}&rdquo; in your own
          words and give one example. Aim for at least two full sentences.
        </p>
      </div>

      <div className="mic-wrap">
        <textarea
          className="txt-input sectionb-input"
          rows={4}
          placeholder="Type your answer here..."
          value={answer}
          disabled={submitted}
          onChange={(e) => { setAnswer(e.target.value); autoMarked(e.target.value); }}
        />
        <MicButton
          disabled={submitted}
          onResult={(t) => {
            const merged = appendDictation(answer, t);
            setAnswer(merged);
            autoMarked(merged);
          }}
        />
      </div>

      {!submitted ? (
        <div className="rubric-box card">
          <div className="rubric-head">
            <span>Check your answer</span>
            <span className="rubric-score">{checkedCount} / {rubric.length}</span>
          </div>
          {rubric.map((r) => (
            <label key={r.key} className="check-row">
              <input
                type="checkbox"
                checked={!!marked[r.key]}
                onChange={(e) => setMarked((m) => ({ ...m, [r.key]: e.target.checked }))}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <>
          <div className="feedback correct">
            <LuCircleCheck size={18} /> Handed in &mdash; nicely done.
          </div>
          <div className="card reference-card">
            <div className="section-title" style={{ fontSize: 16 }}>Reference definition</div>
            <p>{term.definition}</p>
            <p className="muted mt"><strong>Example:</strong> {term.example}</p>
            <ReadButton text={"Reference: " + term.definition + ". Example: " + term.example} className="read-inline" />
          </div>
        </>
      )}
    </FocusLayout>
  );
}
