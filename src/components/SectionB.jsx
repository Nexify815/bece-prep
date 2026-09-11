import { useState } from "react";
import { getSubject } from "../data/index.js";
import { useSnack } from "./Snackbar.jsx";
import { playWin } from "../lib/sound.js";
import ReadButton from "./ReadButton.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";

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
      <div>
        <div className="section-title">Section B — Writing practice</div>
        <p className="muted">
          The BECE paper has written answers too. Practise putting definitions
          into your own words and check yourself against a rubric.
        </p>
        <div className="spacer" />
        {["math", "science", "english", "social"].map((k) => {
          const s = getSubject(k);
          return (
            <button key={k} className="row" onClick={() => start(k)}>
              <span className="row-icon">{s.icon}</span>
              <span className="row-main">
                <span className={"row-title " + s.colorClass}>{s.name}</span>
                <span className="row-sub">3 written prompts &middot; self-marked</span>
              </span>
              <span className="row-chev">&#8250;</span>
            </button>
          );
        })}
      </div>
    );
  }

  const subject = getSubject(subjectKey);
  const term = prompts[idx];
  const isLast = idx === prompts.length - 1;

  if (done) {
    return (
      <div className="center">
        <span className="mascot-big">{subject.icon}</span>
        <h2 className="results-title">Writing practice done!</h2>
        <p className="muted">Describing ideas in your own words is exam practice worth its weight in gold.</p>
        <button className="btn btn-primary mt" onClick={() => { setSubjectKey(null); setPrompts([]); }}>
          Pick another subject
        </button>
        <button className="btn btn-secondary mt" onClick={() => (window.location.hash = "/")}>
          Back home
        </button>
      </div>
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

  return (
    <div>
      <div className="quiz-top">
        <span className="pill pill-hard">Section B</span>
        <span className="quiz-count">Q {idx + 1} / {prompts.length}</span>
      </div>
      <p className="muted hint">{subject.name} &middot; written answer</p>

      <div className="card mt lesson-card">
        <p className="lesson-term">{term.term}</p>
        <p className="lesson-def">
          <strong>Prompt:</strong> Define “{term.term}” in your own words and give one example. Aim for at least two full sentences.
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

      {!submitted && answer.trim().length > 0 && (
        <div className="card mt rubric-box">
          <div className="section-title" style={{ fontSize: 16 }}>Check your answer</div>
          <label className="voice-toggle">
            <input type="checkbox" checked={!!marked.lengthOk} onChange={(e) => setMarked((m) => ({ ...m, lengthOk: e.target.checked }))} />
            <span>At least 2 full sentences (40 characters+)</span>
          </label>
          <label className="voice-toggle">
            <input type="checkbox" checked={!!marked.kwsOk} onChange={(e) => setMarked((m) => ({ ...m, kwsOk: e.target.checked }))} />
            <span>Mentions {kw.length ? "key words like " + kw.slice(0, 3).join(", ") : "key ideas"}</span>
          </label>
          <label className="voice-toggle">
            <input type="checkbox" checked={!!marked.exampleLike} onChange={(e) => setMarked((m) => ({ ...m, exampleLike: e.target.checked }))} />
            <span>Includes an example (“for example”, “such as”…)</span>
          </label>
          <div className="spacer" />
          <button className="btn btn-primary" onClick={submit}>Hand in</button>
        </div>
      )}

      {submitted && (
        <div className="feedback">
          <p className={"feedback " + (["lengthOk", "kwsOk", "exampleLike"].filter((k) => marked[k]).length > 1 ? "correct" : "wrong")}>
            {"Handed in \u2713"} — nicely done.
          </p>
          <div className="card mt">
            <div className="section-title" style={{ fontSize: 16 }}>Reference definition</div>
            <p>{term.definition}</p>
            <p className="muted mt"><strong>Example:</strong> {term.example}</p>
            <ReadButton text={"Reference: " + term.definition + ". Example: " + term.example} className="read-inline" />
          </div>
          <button
            className="btn btn-primary mt"
            onClick={() => {
              playWin();
              onAward(subjectKey, term.id);
              if (isLast) { setDone(true); }
              else { setIdx(idx + 1); setAnswer(""); setMarked({}); setSubmitted(false); }
            }}
          >
            {isLast ? "Finish writing practice" : "Next prompt"}
          </button>
        </div>
      )}
    </div>
  );
}