import { useState } from "react";
import { getSubject } from "../data/index.js";
import { useSnack } from "./Snackbar.jsx";

const DIFF = {
  easy: "pill-easy",
  medium: "pill-medium",
  hard: "pill-hard",
};

export default function Glossary({ subjectKey, onToggleLearned }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  if (!subject) return <p className="muted">No glossary yet.</p>;

  const terms = subject.data.glossary;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      )
    : terms;

  const hasData = terms.length > 0;

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

      <div className="spacer" />
      {filtered.map((t) => (
        <button key={t.id} className="row" onClick={() => setSelected(t)}>
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
      ))}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{selected.term}</div>
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
                onToggleLearned(key);
                snack("Marked as learned \u2713");
              }}
            >
              Learned it
            </button>
            <button className="btn btn-secondary mt" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
