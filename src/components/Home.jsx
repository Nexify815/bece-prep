import { getSubjectsAvailable } from "../data/index.js";
import { navigate } from "../lib/router.js";
import Mascot from "./Mascot.jsx";
import DailyUsage from "./DailyUsage.jsx";
import QuestionOfDay from "./QuestionOfDay.jsx";
import ChallengeCard from "./ChallengeCard.jsx";
import InstallPrompt from "./InstallPrompt.jsx";

export default function Home({ usageSecs, goalSecs, state, onQotdAnswer, onClaimChallenge }) {
  const subjects = getSubjectsAvailable();
  const badges = state.badges || [];

  return (
    <div>
      <div className="hero">
        <Mascot className="hero-mascot" />
        <h1>StudyBuddy</h1>
        <p>Learn the words of your BECE exams, the easy way.</p>
      </div>

      <QuestionOfDay answeredToday={!!state.qotdAnswered} onCorrect={onQotdAnswer} />

      <ChallengeCard state={state} onClaim={onClaimChallenge} />

      <DailyUsage usageSecs={usageSecs} goalSecs={goalSecs} />

      {badges.length > 0 && (
        <div className="card mt">
          <div className="section-title" style={{ fontSize: 16, marginTop: 0 }}>Badges</div>
          <div className="badge-shelf">
            {badges.map((b) => (
              <span key={b} className="badge" title={b}>&#127941; {b}</span>
            ))}
          </div>
        </div>
      )}

      <InstallPrompt />

      <button className="btn btn-primary desktop-only" onClick={() => navigate("/schedule")}>
        &#128218; Today's Study Plan
      </button>

      <div className="home-actions">
        <button className="btn btn-primary" onClick={() => navigate("/mock-exam")}>
          Mock Exam
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/past-papers")}>
          Past Papers
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/sprint")}>
          &#127942; Sprint
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/leaderboard")}>
          &#127942; Leaderboard
        </button>
        <button className="btn btn-secondary desktop-only" onClick={() => navigate("/progress")}>
          Progress Report
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/review")}>
          Review Mistakes
        </button>
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
    </div>
  );
}