import { useEffect } from "react";
import {
  LuBookOpen, LuSearch, LuListChecks, LuLayers, LuLock, LuChevronRight,
} from "react-icons/lu";
import { getSubject } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { stairsProgress } from "../lib/unlocks.js";
import { useSnack } from "./Snackbar.jsx";
import { SubjectIcon } from "./icons.jsx";

// The mock's staircase glyph — the lucide trend arrow reads too different at
// this tile size. UI only: the action and its route are unchanged.
function StairsIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <rect x="2" y="15" width="8" height="5" rx="2.5" />
      <rect x="8" y="10" width="8" height="5" rx="2.5" />
      <rect x="14" y="5" width="8" height="5" rx="2.5" />
    </svg>
  );
}

// The four secondary actions, in the reference's order (Learn is featured).
const CARDS = [
  { action: "path", Icon: StairsIcon, title: "Stairs", sub: "Climb your learning plan", tone: "green" },
  { action: "glossary", Icon: LuSearch, title: "Glossary", sub: "Look up terms", tone: "pink" },
  { action: "quiz", Icon: LuListChecks, title: "Quiz", sub: "Test yourself", tone: "purple" },
  { action: "flashcards", Icon: LuLayers, title: "Flashcards", sub: "Review terms", tone: "gold" },
];

export default function SubjectHome({ subjectKey, passedSummit, learnedTerms, completedLessons }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const summitDone = !!(passedSummit && passedSummit[subjectKey]);
  const learned = Object.keys(learnedTerms || {}).filter((k) =>
    k.startsWith(`${subjectKey}:`)
  ).length;
  const total = subject ? subject.data.glossary.length : 0;
  const stairs = stairsProgress(subjectKey, completedLessons);
  const stepsDone = stairs.done;
  const pct = total ? Math.round((learned / total) * 100) : 0;

  // Give the shell the subject palette (light-green canvas, white rail).
  useEffect(() => {
    document.documentElement.classList.add("subject-route");
    return () => document.documentElement.classList.remove("subject-route");
  }, []);

  if (!subject) {
    return (
      <div className="center">
        <p className="muted">Subject not found.</p>
        <button className="focus-btn mt" onClick={() => navigate("")}>
          Go Home
        </button>
      </div>
    );
  }

  const unlocked = stairs.unlocked || summitDone;

  return (
    <div className="sj-page">
      <section className="sj-hero">
        <span className="sj-bub sj-bub-a" aria-hidden="true" />
        <span className="sj-bub sj-bub-b" aria-hidden="true" />
        <span className="sj-bub sj-bub-c" aria-hidden="true" />
        <div className="sj-hero-top">
          <span className="sj-hero-tile" aria-hidden="true">
            <SubjectIcon subjectKey={subjectKey} size="clamp(34px,3.2vw,52px)" color={subject.colorHex} />
          </span>
          <div className="sj-hero-text">
            <h1>{subject.name}</h1>
            <p>Choose what to do.</p>
          </div>
        </div>
        <div className="sj-hero-progress">
          <div className="sj-bar" aria-hidden="true">
            <span style={{ width: pct + "%" }} />
          </div>
          <p className="sj-caption">
            {learned}/{total} terms &middot; {stepsDone} lesson{stepsDone === 1 ? "" : "s"} done
            {summitDone ? " · Summit passed" : ""}
          </p>
        </div>
      </section>

      <button
        className="sj-feat"
        onClick={() => navigate(`/subject/${subjectKey}/learn`)}
      >
        <span className="sj-bub sj-bub-feat" aria-hidden="true" />
        <span className="sj-feat-tile" aria-hidden="true">
          <LuBookOpen size="clamp(22px,2vw,30px)" strokeWidth={2.8} color="#1488C4" />
        </span>
        <span className="sj-feat-body">
          <b>Learn</b>
          <small>Study any lesson freely</small>
        </span>
        <span className="sj-go" aria-hidden="true">
          <LuChevronRight size={20} strokeWidth={3.5} />
        </span>
      </button>

      <div className="sj-grid">
        {CARDS.map((o) => {
          const locked = o.action === "flashcards" && !unlocked;
          const sub =
            o.action === "flashcards"
              ? locked
                ? `Finish ${stairs.needed} of ${stairs.total} Stairs steps`
                : "Every term in this subject"
              : o.action === "quiz"
              ? `${subject.data.questions.length} questions`
              : o.sub;
          return (
            <button
              key={o.action}
              className={"sj-card sj-card-" + o.tone + (locked ? " is-locked" : "")}
              onClick={() => {
                if (locked) {
                  snack(`Finish half the Stairs to unlock flashcards (${stairs.done}/${stairs.needed}).`);
                  return;
                }
                navigate(`/subject/${subjectKey}/${o.action}`);
              }}
            >
              <span className="sj-ic" aria-hidden="true">
                <o.Icon size="clamp(22px,2vw,28px)" strokeWidth={2.8} />
                {locked && <LuLock size={12} className="sj-lock" />}
              </span>
              <span className="sj-card-body">
                <b>{o.title}</b>
                <small>{sub}</small>
              </span>
              <LuChevronRight size={20} strokeWidth={3.5} className="sj-chev" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
