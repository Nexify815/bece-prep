import { FiBookOpen, FiTrendingUp, FiSearch, FiCheckSquare, FiLayers, FiLock, FiChevronRight } from "react-icons/fi";
import { getSubject } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { useSnack } from "./Snackbar.jsx";

const OPTIONS = [
  { action: "learn", Icon: FiBookOpen, title: "Learn", sub: "Study any lesson freely" },
  { action: "path", Icon: FiTrendingUp, title: "Stairs", sub: "Climb your learning plan" },
  { action: "glossary", Icon: FiSearch, title: "Glossary", sub: "Look up terms" },
  { action: "quiz", Icon: FiCheckSquare, title: "Quiz", sub: "Test yourself" },
  { action: "flashcards", Icon: FiLayers, title: "Flashcards", sub: "Review terms" },
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
        <span className="subject-head-icon">{subject.icon}</span>
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
                  snack("Unlocks after you pass the Summit.");
                  return;
                }
                navigate(`/subject/${subjectKey}/${o.action}`);
              }}
            >
              <span className="act-card-icon">
                <o.Icon size={24} />
                {locked && <FiLock size={13} className="act-card-lock" />}
              </span>
              <span className="act-card-body">
                <span className="act-card-title">{o.title}</span>
                <span className="act-card-sub">{sub}</span>
              </span>
              <FiChevronRight size={18} className="act-card-chev" />
            </button>
          );
        })}
      </div>
    </div>
  );
}