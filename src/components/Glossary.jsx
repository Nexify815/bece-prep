import { useState, useMemo } from "react";
import { getSubject } from "../data/index.js";
import { useSnack } from "./Snackbar.jsx";
import { XP } from "../lib/XP.js";
import { speak, stopSpeaking } from "../lib/tts.js";
import { termKey } from "../lib/srs.js";
import { todayKey } from "../lib/dates.js";
import { playRight, playWrong } from "../lib/sound.js";
import { definesMatch } from "../lib/answer.js";
import ReadButton from "./ReadButton.jsx";
import Mascot from "./Mascot.jsx";
import MicButton, { appendDictation } from "./MicButton.jsx";
import TermExtras from "./TermExtras.jsx";
import {
  GOOD, BAD, LuNotebookPen, LuSearch, LuLightbulb, LuCircle, LuCircleCheck,
  LuX, LuTriangleAlert,
} from "./icons.jsx";

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

export default function Glossary({ subjectKey, onToggleLearned, onAddXp, onLoseHeart, hearts, learnedTerms, srs, onSRS, customTerms, onAddCustom, onRemoveCustom }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("list"); // list | quiz | result
  const [result, setResult] = useState(null); // { correct, wrong }
  const [showAdd, setShowAdd] = useState(false);
  const [addTerm, setAddTerm] = useState("");
  const [addDef, setAddDef] = useState("");
  const [addExample, setAddExample] = useState("");
  // recall-gate: a term only becomes "learned" if the kid can type its
  // meaning in their own words (definesMatch) — self-reported mastery fails
  const [recallOpen, setRecallOpen] = useState(false);
  const [recallText, setRecallText] = useState("");
  const [recallMsg, setRecallMsg] = useState(null); // { ok, text }
  const [recallOk, setRecallOk] = useState(false);
  // list filter: everything | still to learn | already in my review set
  const [filter, setFilter] = useState("all");

  if (!subject) return <p className="muted">No glossary yet.</p>;

  const glossaryTerms = subject.data.glossary;
  const mine = (customTerms || []).filter((c) => c.subjectKey === subjectKey);
  // merge user-added words in with the syllabus words (marked isCustom)
  const terms = [...glossaryTerms, ...mine.map((c) => ({ ...c, isCustom: true }))];
  const learned = terms.filter((t) => !!learnedTerms[`${subjectKey}:${t.id}`]);
  const dueCount = learned.filter((t) => {
    const k = termKey(subjectKey, t.id);
    const s = (srs || {})[k];
    return !s || (s.due && s.due <= todayKey());
  }).length;
  const q = query.trim().toLowerCase();

  const hasData = terms.length > 0;

  // search + filter combined
  const searched = q
    ? terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      )
    : terms;
  const filtered = searched.filter((t) => {
    if (filter === "todo") return !learnedTerms[`${subjectKey}:${t.id}`];
    if (filter === "learned") return !!learnedTerms[`${subjectKey}:${t.id}`];
    return true;
  });
  const todoCount = terms.filter((t) => !learnedTerms[`${subjectKey}:${t.id}`]).length;

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
        onSRS={onSRS}
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
      <p className="muted glossary-hint">
        Marking a term adds it to your <b>review set</b> &mdash; it means
        "learn it today, I&rsquo;ll test you later". The test decides whether
        you&rsquo;ve really got it.
      </p>
      <input
        className="txt-input"
        type="text"
        placeholder="Search for a term..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        className="btn btn-secondary mt"
        onClick={() => setShowAdd((v) => !v)}
      >
        {showAdd ? "Cancel" : "Add my own word"}
      </button>

      {showAdd && (
        <div className="card mt add-term-card">
          <div className="section-title" style={{ fontSize: 16, marginTop: 0 }}>
            Add your own word
          </div>
          <p className="muted settings-hint">
            Your own words appear in this glossary (marked &#8220;mine&#8221;) and
            are stored on this device.
          </p>
          <label className="field-label">Word</label>
          <div className="mic-wrap">
            <input
              className="txt-input"
              type="text"
              placeholder="e.g. Respiration"
              value={addTerm}
              onChange={(e) => setAddTerm(e.target.value)}
              autoComplete="off"
            />
            <MicButton
              ariaLabel="Dictate the word"
              title="Dictate the word"
              onResult={(t) => setAddTerm((v) => appendDictation(v, t))}
            />
          </div>
          <label className="field-label">Meaning</label>
          <div className="mic-wrap">
            <textarea
              className="txt-input"
              rows={2}
              placeholder="What does it mean?"
              value={addDef}
              onChange={(e) => setAddDef(e.target.value)}
            />
            <MicButton onResult={(t) => setAddDef((v) => appendDictation(v, t))} />
          </div>
          <label className="field-label">Example (optional)</label>
          <div className="mic-wrap">
            <input
              className="txt-input"
              type="text"
              placeholder="A sentence using the word"
              value={addExample}
              onChange={(e) => setAddExample(e.target.value)}
              autoComplete="off"
            />
            <MicButton onResult={(t) => setAddExample((v) => appendDictation(v, t))} />
          </div>
          <button
            className="btn btn-primary mt"
            disabled={!addTerm.trim() || !addDef.trim()}
            onClick={() => {
              onAddCustom({ term: addTerm.trim(), definition: addDef.trim(), example: addExample.trim() });
              snack("Word added to your glossary", GOOD);
              setAddTerm("");
              setAddDef("");
              setAddExample("");
              setShowAdd(false);
            }}
          >
            Save word
          </button>
        </div>
      )}

      {!hasData && <p className="muted mt">Glossary coming soon.</p>}

      {hasData && learned.length > 0 && (
        <div className="spacer" />
      )}

      {hasData && learned.length > 0 && (
        <button
          className="gloss-test-btn"
          onClick={() => setView("quiz")}
        >
          <LuNotebookPen size={18} /> Test yourself
          <span className="gloss-test-sub">
            {dueCount > 0 ? `${dueCount} due now` : `${learned.length} in review`}
          </span>
        </button>
      )}

      <div className="gloss-filters">
        {[
          { key: "all", label: `All ${terms.length}` },
          { key: "todo", label: `To learn ${todoCount}` },
          { key: "learned", label: `In my set ${learned.length}` },
        ].map((f) => (
          <button
            key={f.key}
            className={"gloss-chip" + (filter === f.key ? " on" : "")}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.map((t) => {
        const isLearned = !!learnedTerms[`${subjectKey}:${t.id}`];
        return (
          <button
            key={t.id}
            className={"gloss-row" + (isLearned ? " learned" : "")}
            onClick={() => {
              setSelected(t);
              setRecallOpen(false);
              setRecallText("");
              setRecallMsg(null);
            }}
          >
            <span className="gloss-row-dot">
              {isLearned ? <LuCircleCheck size={16} /> : <LuCircle size={16} />}
            </span>
            <span className="gloss-row-body">
              <span className="gloss-row-term">
                {t.term}
                {t.isCustom && <span className="pill pill-easy">mine</span>}
              </span>
              <span className="gloss-row-sub">
                {t.isCustom ? "My word" : (t.subStrand || t.strand || "Term")}
              </span>
            </span>
            {!t.isCustom && (
              <span className={"pill " + (DIFF[t.difficulty] || "pill-easy")}>
                {t.difficulty}
              </span>
            )}
          </button>
        );
      })}
        );
      })}

      {hasData && q && filtered.length === 0 && (
        <div className="card search-empty">
          <p className="muted">
            <strong>&ldquo;{query}&rdquo;</strong> isn&rsquo;t in this subject&rsquo;s glossary yet.
          </p>
          <p className="muted settings-hint">
            We use kid-safe, filtered search so results stay appropriate for learners.
          </p>
          <a
            className="btn btn-primary mt"
            href={
              "https://www.kiddle.co/s.php?q=" +
              encodeURIComponent("meaning of " + query)
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <LuSearch size={18} /> Student-safe search
          </a>
          <a
            className="btn btn-secondary mt"
            href={
              "https://www.google.com/search?q=" +
              encodeURIComponent("meaning of " + query) +
              "&safe=active"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            More results (Google, filtered)
          </a>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => { stopSpeaking(); setSelected(null); }}>
          <div className="gloss-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gloss-modal-head">
              <div>
                <h2 className="gloss-modal-term">
                  {selected.term}
                  <ReadButton
                    text={selected.term + ". " + selected.definition + (selected.example ? ". Example: " + selected.example : "")}
                    className="read-inline"
                  />
                </h2>
                <div className="gloss-modal-tags">
                  {!selected.isCustom && (
                    <span className={"pill " + (DIFF[selected.difficulty] || "pill-easy")}>
                      {selected.difficulty}
                    </span>
                  )}
                  {selected.isCustom && <span className="pill pill-easy">mine</span>}
                  {learnedTerms[`${subjectKey}:${selected.id}`] && (
                    <span className="gloss-in-set">In your review set</span>
                  )}
                </div>
              </div>
              <button
                className="gloss-modal-close"
                aria-label="Close"
                onClick={() => { stopSpeaking(); setSelected(null); }}
              >
                <LuX size={18} />
              </button>
            </div>

            {!recallOpen && (
              <>
                <p className="gloss-def">{selected.definition}</p>
                {selected.example && (
                  <p className="gloss-example">
                    <strong>Example:</strong> {selected.example}
                  </p>
                )}
                <TermExtras term={selected} />
              </>
            )}

            {selected.isCustom ? (
              <button
                className="focus-btn focus-btn-danger mt"
                onClick={() => {
                  onRemoveCustom(selected.id);
                  snack("Removed your word", BAD);
                  setSelected(null);
                }}
              >
                Delete my word
              </button>
            ) : recallOpen ? (
              <>
                {!recallOk && (
                  <p className="prompt-sub">
                    The meaning is hidden — type it back in your own words.
                  </p>
                )}
                <div className="focus-input mic-wrap">
                  <input
                    className="txt-input"
                    type="text"
                    placeholder="Type the meaning..."
                    value={recallText}
                    onChange={(e) => setRecallText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && recallText.trim()) {
                        document.getElementById("recall-check")?.click();
                      }
                    }}
                    autoComplete="off"
                    autoFocus
                  />
                  <MicButton
                    onResult={(t) => setRecallText((v) => appendDictation(v, t))}
                  />
                </div>

                {recallMsg && !recallMsg.ok && (
                  <div className="result-banner no mt">
                    <LuTriangleAlert size={18} />
                    <div>
                      <strong>Almost</strong>
                      <span>That doesn't capture the meaning yet — try again.</span>
                    </div>
                  </div>
                )}
                {recallOk && (
                  <div className="result-banner ok mt">
                    <LuCircleCheck size={18} />
                    <div>
                      <strong>You got it!</strong>
                      <span>Added to your review set · +{XP.perCorrect} XP</span>
                    </div>
                  </div>
                )}

                <button
                  id="recall-check"
                  className="focus-btn mt"
                  disabled={!recallText.trim() || recallOk}
                  onClick={() => {
                    const pass = definesMatch(recallText, selected.definition);
                    if (pass) {
                      onToggleLearned(`${subjectKey}:${selected.id}`);
                      onAddXp(XP.perCorrect);
                      playRight();
                      setRecallOk(true);
                      setTimeout(() => setSelected(null), 900);
                    } else {
                      playWrong();
                      setRecallMsg({
                        ok: false,
                        text: "Almost — that doesn't capture the meaning yet.",
                      });
                    }
                  }}
                >
                  Check my answer
                </button>

                {!recallOk && (
                  <button
                    className="focus-link"
                    onClick={() => {
                      onToggleLearned(`${subjectKey}:${selected.id}`);
                      snack("Added to your review set (no test)", GOOD);
                      setSelected(null);
                    }}
                  >
                    Add without the test
                  </button>
                )}
              </>
            ) : (
              <button
                className="focus-btn mt"
                onClick={() => {
                  setRecallOpen(true);
                  setRecallMsg(null);
                  setRecallOk(false);
                  setRecallText("");
                }}
              >
                <LuLightbulb size={18} /> Learn it — type the meaning
              </button>
            )}

            {!selected.isCustom && !recallOpen && learnedTerms[`${subjectKey}:${selected.id}`] && (
              <button
                className="focus-link"
                onClick={() => {
                  onToggleLearned(`${subjectKey}:${selected.id}`);
                  snack("Removed from your review set", BAD);
                  setSelected(null);
                }}
              >
                In your set — tap to remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Review quiz: test the learned terms -----
function ReviewQuiz({ subjectKey, subject, learned, allTerms, onUnmark, onSRS, onAddXp, onLoseHeart, onFinish, onExit }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [wrong, setWrong] = useState([]);
  const [wrongInRun, setWrongInRun] = useState(0);

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
      if (onSRS) onSRS(`${subjectKey}:${term.id}`, false);
      const nextWrong = wrongInRun + 1;
      setWrongInRun(nextWrong);
      if (nextWrong % 3 === 0) onLoseHeart();
      playWrong();
    } else {
      if (onSRS) onSRS(`${subjectKey}:${term.id}`, true);
      onAddXp(XP.perCorrect);
      playRight();
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
        <div className="progress-fill" style={{ width: `${((idx + 1) / quizTerms.length) * 100}%` }} />
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
            ? "Every term in your set, understood."
            : "Terms you missed will come back sooner — get them right twice in a row to space them further apart."}
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
