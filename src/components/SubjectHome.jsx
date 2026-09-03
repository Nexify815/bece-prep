import { getSubject } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { useSnack } from "./Snackbar.jsx";

const OPTIONS = [
  { action: "path", icon: "\u{1F500}", title: "Path", sub: "Your learning plan" },
  { action: "glossary", icon: "\u{1F50D}", title: "Glossary", sub: "Look up terms" },
  { action: "quiz", icon: "\u{2705}", title: "Quiz", sub: "Test yourself" },
];

export default function SubjectHome({ subjectKey }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();

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
        const sub =
          o.action === "quiz"
            ? (quizScore ? quizScore + " questions" : "coming soon")
            : o.sub;
        return (
          <button
            key={o.action}
            className="row"
            onClick={() => navigate(`/subject/${subjectKey}/${o.action}`)}
          >
            <span className="row-icon">{o.icon}</span>
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
