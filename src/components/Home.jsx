import {
  FiBookOpen, FiClipboard, FiFileText, FiTrendingUp, FiRefreshCw, FiLock,
} from "react-icons/fi";
import { LuTrophy, LuFlame, LuZap } from "react-icons/lu";
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
  const lightDay = isLightDay();
  const name = (state.nickname || "").trim();
  const streak = state.streak || 0;
  const goalMins = Math.round((goalSecs || 3600) / 60);
  const todayMin = Math.floor((usageSecs[todayKey()] || 0) / 60);

  const streakLine =
    todayMin >= goalMins
      ? streak > 0
        ? `Goal reached! ${streak}-day streak alive.`
        : "Goal reached today — nice one!"
      : todayMin > 0
      ? `${todayMin}/${goalMins} mins in — finish to secure your streak!`
      : streak > 0
      ? `You're on a ${streak}-day streak. Don't break it!`
      : "Start a streak today — any lesson counts.";

  const actions = [
    { key: "mock", Icon: FiClipboard, label: "Mock Exam", route: "/mock-exam", locked: !lightDay, sub: "Weekend" },
    { key: "papers", Icon: FiFileText, label: "Past Papers", route: "/past-papers", locked: !lightDay, sub: "Weekend" },
    { key: "sprint", Icon: LuZap, label: "Sprint", route: "/sprint", locked: !lightDay, sub: "Weekend" },
    { key: "board", Icon: LuTrophy, label: "Leaderboard", route: "/leaderboard", locked: false, sub: "See friends" },
    { key: "progress", Icon: FiTrendingUp, label: "Progress", route: "/progress", locked: false, sub: "Your report" },
    { key: "review", Icon: FiRefreshCw, label: "Mistakes", route: "/review", locked: !lightDay, sub: "Weekend" },
  ];

  return (
    <div className="home-grid">
      {/* ---- main column ---- */}
      <section className="home-main">
        <div className="home-hero">
          <Mascot className="home-hero-mascot" happy />
          <h1>{name ? `Welcome back, ${name}!` : "Welcome back!"}</h1>
          <p className="home-hero-streak">
            <LuFlame size={16} /> {streakLine}
          </p>
        </div>

        <div className="home-continue-wrap">
          <button className="home-continue" onClick={() => navigate("/")}>
            <span className="home-continue-cta">
              <FiBookOpen size={24} /> Continue Learning
            </span>
            <span className="home-continue-sub">Open today&rsquo;s plan</span>
          </button>
          <div className="mascot-bubble">&#128172; {streakLine}</div>
        </div>

        <div className="section-title home-sub quick-title">Quick actions</div>
        <div className="home-quick">
          {actions.map((a) => (
            <button
              key={a.key}
              className={"quick-card" + (a.locked ? " locked" : "")}
              onClick={() => {
                if (a.locked) return;
                navigate(a.route);
              }}
            >
              <span className="quick-icon">
                <a.Icon size={22} />
                {a.locked && <FiLock size={12} className="quick-lock" />}
              </span>
              <span className="quick-label">{a.label}</span>
              <span className="quick-sub">{a.sub}</span>
            </button>
          ))}
        </div>

        <div className="section-title home-sub subjects-title">Pick a subject</div>
        <div className="home-subjects">
          {subjects.map((s) => {
            const total = s.data.glossary.length;
            const learned = Object.keys(state.learnedTerms || {}).filter((k) =>
              k.startsWith(`${s.key}:`)
            ).length;
            const pct = total ? Math.round((learned / total) * 100) : 0;
            return (
              <button
                key={s.key}
                className={"course-card " + s.colorClass}
                disabled={!lightDay}
                onClick={() => navigate(`/subject/${s.key}`)}
              >
                <span className="course-icon">{s.icon}</span>
                <span className="course-name">{s.name}</span>
                <span className="course-progress">
                  <span className="course-bar">
                    <span className="course-bar-fill" style={{ width: pct + "%" }} />
                  </span>
                  <span className="course-count">
                    {lightDay ? `${learned}/${total} terms` : "Opens Saturday"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- sidebar ---- */}
      <aside className="home-side">
        <QuestionOfDay
          answeredToday={!!(state.qotdAnswered && state.qotdAnswered[todayKey()])}
          onCorrect={onQotdAnswer}
        />

        <DailyUsage usageSecs={usageSecs} goalSecs={goalSecs} />

        <ChallengeCard state={state} onClaim={onClaimChallenge} />
      </aside>
    </div>
  );
}