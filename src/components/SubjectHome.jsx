import { LuBookOpen, LuTrendingUp, LuSearch, LuSquareCheckBig, LuLayers, LuLock, LuChevronRight } from "react-icons/lu";
import { SubjectIcon } from "./icons.jsx";
import { getSubject } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { useSnack } from "./Snackbar.jsx";

const OPTIONS = [
  { action: "learn", Icon: LuBookOpen, title: "Learn", sub: "Study any lesson freely" },
  { action: "path", Icon: LuTrendingUp, title: "Stairs", sub: "Climb your learning plan" },
  { action: "glossary", Icon: LuSearch, title: "Glossary", sub: "Look up terms" },
  { action: "quiz", Icon: LuSquareCheckBig, title: "Quiz", sub: "Test yourself" },
  { action: "flashcards", Icon: LuLayers, title: "Flashcards", sub: "Review terms" },
];

export default function SubjectHome({ subjectKey, passedSummit }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const summitDone = !!(passedSummit && passedSummit[subjectKey]);

  if (!subject) {
    return (
      <div className="center">
        <p className="muted">Subject not found.</p>
        <button className="btn btn-primary mt" onClick={() => navigate("")}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="subject-page">
      <div className="subject-head">
        <span className="subject-head-icon"><SubjectIcon subjectKey={subject.iconKey} size={30} /></span>
        <h1>{subject.name}</h1>
        <p className="muted">Choose what to do.</p>
      </div>

      <div className="subject-cards">
        {OPTIONS.map((o) => {
          const quizScore = subject.data.questions.length;
          const isFlash = o.action === "flashcards";
          const locked = isFlash && !summitDone;
          const sub = isFlash
            ? locked
              ? "Unlocks after you pass the Summit"
              : "Every term in this subject"
            : o.action === "quiz"
            ? (quizScore ? quizScore + " questions" : "coming soon")
            : o.sub;
          return (
            <button
              key={o.action}
              className={"act-card" + (locked ? " locked" : "")}
              onClick={() => {
                if (locked) {
                  snack("Unlocks after you pass the Summit.", LuLock);
                  return;
                }
                navigate(`/subject/${subjectKey}/${o.action}`);
              }}
            >
              <span className="act-card-icon">
                <o.Icon size={24} />
                {locked && <LuLock size={13} className="act-card-lock" />}
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