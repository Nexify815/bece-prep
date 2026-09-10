import { FiBookOpen, FiClipboard, FiFileText, FiAward, FiTrendingUp, FiRefreshCw } from "react-icons/fi";
import { LuTrophy } from "react-icons/lu";
import { getSubjectsAvailable } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { isLightDay } from "../lib/plan.js";
import { todayKey } from "../lib/dates.js";
import Mascot from "./Mascot.jsx";
import DailyUsage from "./DailyUsage.jsx";
import QuestionOfDay from "./QuestionOfDay.jsx";
import ChallengeCard from "./ChallengeCard.jsx";

export default function Home({ usageSecs, goalSecs, state, onQotdAnswer, onClaimChallenge }) {
  const subjects = getSubjectsAvailable();
  const badges = state.badges || [];
  const lightDay = isLightDay();

  return (
    <div>
      <div className="hero">
        <Mascot className="hero-mascot" />
        <h1>StudyBuddy</h1>
        <p>Learn the words of your BECE exams, the easy way.</p>
      </div>

      <QuestionOfDay answeredToday={!!(state.qotdAnswered && state.qotdAnswered[todayKey()])} onCorrect={onQotdAnswer} />

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

      <button className="btn btn-primary desktop-only" onClick={() => navigate("/")}>
        <FiBookOpen /> Today's Study Plan
      </button>

      <div className="home-actions">
        <button className="btn btn-primary" disabled={!lightDay} onClick={() => navigate("/mock-exam")}>
          <FiClipboard /> Mock Exam
        </button>
        <button className="btn btn-secondary" disabled={!lightDay} onClick={() => navigate("/past-papers")}>
          <FiFileText /> Past Papers
        </button>
        <button className="btn btn-secondary" disabled={!lightDay} onClick={() => navigate("/sprint")}>
          <FiAward /> Sprint
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/leaderboard")}>
          <LuTrophy /> Leaderboard
        </button>
        <button className="btn btn-secondary desktop-only" onClick={() => navigate("/progress")}>
          <FiTrendingUp /> Progress Report
        </button>
        <button className="btn btn-secondary" disabled={!lightDay} onClick={() => navigate("/review")}>
          <FiRefreshCw /> Review Mistakes
        </button>
      </div>

      {!lightDay && (
        <p className="locked-hint">
          Mock Exam, Past Papers, Sprint, Review Mistakes and Pick a subject open
          on light days &mdash; Saturday &amp; Sunday. Keep the week on your Plan.
        </p>
      )}

      <div className="section-title">Pick a subject</div>

      <div className="subject-grid">
        {subjects.map((s) => {
          const count = s.data.glossary.length;
          return (
            <button
              key={s.key}
              className={"subject-card " + s.colorClass}
              disabled={!lightDay}
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