import { SUBJECTS, getSubjectsAvailable } from "../data/index.js";
import { navigate } from "../lib/router.js";
import Mascot from "./Mascot.jsx";

export default function Home() {
  const subjects = getSubjectsAvailable();

  return (
    <div>
      <div className="hero">
        <Mascot className="hero-mascot" />
        <h1>StudyBuddy</h1>
        <p>Learn the words of your BECE exams, the easy way.</p>
      </div>

      <div className="section-title">Pick a subject</div>

      <div className="subject-grid">
        {subjects.map((s) => {
          const count = s.data.glossary.length;
          return (
            <button
              key={s.key}
              className={"subject-card " + s.colorClass}
              onClick={() => navigate(`/subject/${s.key}`)}
            >
              <span className="icon">{s.icon}</span>
              <span className="name">{s.name}</span>
              <span className="meta">{count ? count + " terms" : "coming soon"}</span>
            </button>
          );
        })}
      </div>

      <div className="spacer" />
      <button className="btn btn-primary" onClick={() => navigate("/mock-exam")}>
        &#128202; Mock Exam
      </button>
      <button className="btn btn-secondary mt" onClick={() => navigate("/past-papers")}>
        &#128203; Past Papers
      </button>
      <button className="btn btn-secondary mt" onClick={() => navigate("/progress")}>
        &#128200; Progress Report
      </button>
      <button className="btn btn-secondary mt" onClick={() => navigate("/review")}>
        &#128221; Review Mistakes
      </button>
    </div>
  );
}
