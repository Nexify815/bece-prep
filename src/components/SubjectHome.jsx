import { FiBookOpen, FiTrendingUp, FiSearch, FiCheckSquare, FiLayers } from "react-icons/fi";
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
    <div>
      <div className="hero">
        <span className="hero-mascot">{subject.icon}</span>
        <h1>{subject.name}</h1>
        <p>Choose what to do.</p>
      </div>

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
            className="row"
            onClick={() => {
              if (locked) {
                snack("Finish the Stairs Summit to unlock the full flashcards.");
                return;
              }
              navigate(`/subject/${subjectKey}/${o.action}`);
            }}
          >
            <span className="row-icon">
              <o.Icon size={20} />
            </span>
            <span className="row-main">
              <span className="row-title">{o.title}</span>
              <span className="row-sub">{sub}</span>
            </span>
            <span className="row-chev">&#8250;</span>
          </button>
        );
      })}
    </div>
  );
}