import { useEffect, useState } from "react";
import { LuTrophy, LuFlame } from "react-icons/lu";
import { getSubjectsAvailable } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { todayKey } from "../lib/dates.js";
import Mascot from "./Mascot.jsx";
import QuestionOfDay from "./QuestionOfDay.jsx";
import { SubjectIcon, LuBookOpen, LuTrendingUp, LuEllipsis, LuClock, LuMessageSquareText } from "./icons.jsx";

export default function Home({ usageSecs, goalSecs, state, onQotdAnswer }) {
  const subjects = getSubjectsAvailable();
  const name = (state.nickname || "").trim();
  const streak = state.streak || 0;
  const goalMins = Math.round((goalSecs || 3600) / 60);
  const todayMin = Math.floor((usageSecs[todayKey()] || 0) / 60);
  const goalPct = Math.min(100, Math.round((todayMin / goalMins) * 100));
  const goalDone = todayMin >= goalMins;

  // the mascot nudge greets for 3 seconds, then gets out of the way
  const [showBubble, setShowBubble] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setShowBubble(false), 3000);
    return () => clearTimeout(id);
  }, []);

  const streakLine = goalDone
    ? streak > 0
      ? `Goal reached! ${streak}-day streak alive.`
      : "Goal reached today â€” nice one!"
    : todayMin > 0
    ? `${todayMin}/${goalMins} mins in â€” finish to secure your streak!`
    : streak > 0
    ? `You're on a ${streak}-day streak. Don't break it!`
    : "Start a streak today â€” any lesson counts.";

  // only what is always available lives on Home; the rest is in More
  const quick = [
    { key: "board", Icon: LuTrophy, label: "Leaderboard", sub: "See friends", route: "/leaderboard" },
    { key: "progress", Icon: LuTrendingUp, label: "Progress", sub: "Your report", route: "/progress" },
  ];

  return (
    <div className="home-grid">
      {/* ---- hero + primary action ---- */}
      <section className="home-hero-col">
        <div className="home-hero">
          <Mascot className="home-hero-mascot" happy />
          <div className="home-hero-text">
            <h1>{name ? `Welcome back, ${name}!` : "Welcome back!"}</h1>
            <p className="home-hero-streak">
              <LuFlame size={15} /> {streakLine}
            </p>
          </div>
        </div>

        <div className="home-continue-wrap">
          <button className="home-continue" onClick={() => navigate("/")}>
            <span className="home-continue-cta">
              <LuBookOpen size={24} /> Continue Learning
            </span>
            <span className="home-continue-sub">Open today&rsquo;s plan</span>
          </button>
          {showBubble && <div className="mascot-bubble"><LuMessageSquareText size={16} /> {streakLine}</div>}
        </div>
      </section>

      {/* ---- subjects ---- */}
      <section className="home-subjects-col">
        <div className="section-title home-sub">Pick a subject</div>
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
                onClick={() => navigate(`/subject/${s.key}`)}
              >
                <span className="course-icon">
                  <SubjectIcon subjectKey={s.key} size={30} color="#fff" />
                </span>
                <span className="course-name">{s.name}</span>
                <span className="course-progress">
                  <span className="course-bar">
                    <span className="course-bar-fill" style={{ width: pct + "%" }} />
                  </span>
                  <span className="course-count">
                    {learned}/{total} terms
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- daily engagement ---- */}
      <section className="home-mid">
        <QuestionOfDay
          answeredToday={!!(state.qotdAnswered && state.qotdAnswered[todayKey()])}
          onCorrect={onQotdAnswer}
        />

        <div className="section-title home-sub quick-title">Quick actions</div>
        <div className="home-quick">
          {quick.map((a) => (
            <button key={a.key} className="quick-card" onClick={() => navigate(a.route)}>
              <span className="quick-icon">
                <a.Icon size={22} />
              </span>
              <span className="quick-label">{a.label}</span>
              <span className="quick-sub">{a.sub}</span>
            </button>
          ))}
          <button className="quick-card more-card-tile" onClick={() => navigate("/more")}>
            <span className="quick-icon">
              <LuEllipsis size={22} />
            </span>
            <span className="quick-label">More</span>
            <span className="quick-sub">Practice &amp; tools</span>
          </button>
        </div>
      </section>

      {/* ---- stats ---- */}
      <aside className="home-side">
        <div className="card home-goal-card">
          <div className="section-title home-goal-title">
            <LuClock size={16} /> Daily goal
          </div>
          <div className="home-goal-nums">
            <strong>{todayMin}</strong> / {goalMins} min
          </div>
          <div className="home-goal-bar">
            <span style={{ width: goalPct + "%" }} />
          </div>
          <p className="home-goal-note">
            {goalDone
              ? "Goal reached! Anything else today is a bonus."
              : `${goalMins - todayMin} more minutes to hit today's goal.`}
          </p>
        </div>

        <button className="home-plan-link" onClick={() => navigate("/progress")}>
          <LuTrendingUp size={18} /> See your progress
        </button>
      </aside>
    </div>
  );
}
