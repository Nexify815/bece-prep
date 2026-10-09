import {
  LuBookOpen, LuTrendingUp, LuSearch, LuListChecks, LuLayers, LuLock, LuChevronRight,
  LuNotebookPen,
} from "react-icons/lu";
import { getSubject } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { useSnack } from "./Snackbar.jsx";
import { SubjectIcon } from "./icons.jsx";

const OPTIONS = [
  { action: "learn", Icon: LuBookOpen, title: "Learn", sub: "Study any lesson freely", tint: "#DBEAFE", color: "#2563EB" },
  { action: "path", Icon: LuTrendingUp, title: "Stairs", sub: "Climb your learning plan", tint: "#DCFCE7", color: "#16A34A" },
  { action: "glossary", Icon: LuSearch, title: "Glossary", sub: "Look up terms", tint: "#FCE7F3", color: "#DB2777" },
  { action: "quiz", Icon: LuListChecks, title: "Quiz", sub: "Test yourself", tint: "#EDE9FE", color: "#7C3AED" },
  { action: "flashcards", Icon: LuLayers, title: "Flashcards", sub: "Review terms", tint: "#FEF3C7", color: "#D97706" },
];

export default function SubjectHome({ subjectKey, passedSummit, learnedTerms, completedLessons }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const summitDone = !!(passedSummit && passedSummit[subjectKey]);
  const learned = Object.keys(learnedTerms || {}).filter((k) =>
    k.startsWith(`${subjectKey}:`)
  ).length;
  const total = subject ? subject.data.glossary.length : 0;
  const stepsDone = Object.keys(completedLessons || {}).filter((k) =>
    k.startsWith(`${subjectKey}:`)
  ).length;
  const pct = total ? Math.round((learned / total) * 100) : 0;

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

  return (
    <div className="subject-page">
      <div className="subject-hero">
        <span className="subject-hero-icon" style={{ background: subject.colorHex }}>
          <SubjectIcon subjectKey={subjectKey} size={34} color="#fff" />
        </span>
        <h1>{subject.name}</h1>
        <p className="muted">Choose what to do.</p>
        <div className="subject-hero-bar">
          <span style={{ width: pct + "%" }} />
        </div>
        <p className="subject-hero-sub">
          {learned}/{total} terms &middot; {stepsDone} lessons done
          {summitDone ? " · Summit passed" : ""}
        </p>
      </div>

      <div className="subject-cards">
        {OPTIONS.map((o) => {
          const locked = o.action === "flashcards" && !summitDone;
          const sub =
            o.action === "flashcards"
              ? locked
                ? "Unlocks after you pass the Summit"
                : "Every term in this subject"
              : o.action === "quiz"
              ? `${subject.data.questions.length} questions`
              : o.sub;
          return (
            <button
              key={o.action}
              className={"act-card" + (locked ? " locked" : "")}
              onClick={() => {
                if (locked) {
                  snack("Unlocks after you pass the Summit.");
                  return;
                }
                navigate(`/subject/${subjectKey}/${o.action}`);
              }}
            >
              <span className="act-card-icon" style={{ background: o.tint, color: o.color }}>
                <o.Icon size={22} />
                {locked && <LuLock size={12} className="act-card-lock" />}
              </span>
              <span className="act-card-body">
                <span className="act-card-title">{o.title}</span>
                <span className="act-card-sub">{sub}</span>
              </span>
              <LuChevronRight size={18} className="act-card-chev" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
