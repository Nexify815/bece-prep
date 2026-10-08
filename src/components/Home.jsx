import {
  FiBookOpen, FiClipboard, FiFileText, FiAward, FiTrendingUp, FiRefreshCw,
  FiLock, FiChevronRight, FiPlay,
} from "react-icons/fi";
import { LuTrophy, LuFlame, LuClock, LuSparkles } from "react-icons/lu";
import { getSubjectsAvailable } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { isLightDay } from "../lib/plan.js";
import { todayKey, lastNDays } from "../lib/dates.js";
import Mascot from "./Mascot.jsx";
import DailyUsage from "./DailyUsage.jsx";
import QuestionOfDay from "./QuestionOfDay.jsx";
import ChallengeCard from "./ChallengeCard.jsx";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  return DAY_SHORT[new Date(y, m - 1, d).getDay()];
}

export default function Home({ usageSecs, goalSecs, state, onQotdAnswer, onClaimChallenge }) {
  const subjects = getSubjectsAvailable();
  const badges = state.badges || {};
  const lightDay = isLightDay();
  const name = (state.nickname || "").trim();
  const streak = state.streak || 0;
  const goalMins = Math.round((goalSecs || 3600) / 60);
  const todayMin = Math.floor((usageSecs[todayKey()] || 0) / 60);

  const streakLine =
    streak > 0
      ? `You're on a ${streak}-day streak! Keep it going!`
      : "Start a streak today — one quick lesson does it!";

  const actions = [
    { key: "mock", Icon: FiClipboard, label: "Mock Exam", route: "/mock-exam", locked: !lightDay },
    { key: "papers", Icon: FiFileText, label: "Past Papers", route: "/past-papers", locked: !lightDay },
    { key: "sprint", Icon: FiAward, label: "Sprint", route: "/sprint", locked: !lightDay },
    { key: "board", Icon: LuTrophy, label: "Leaderboard", route: "/leaderboard", locked: false, accent: true },
    { key: "progress", Icon: FiTrendingUp, label: "Progress", route: "/progress", locked: false },
    { key: "review", Icon: FiRefreshCw, label: "Mistakes", route: "/review", locked: !lightDay },
  ];

  const week = lastNDays(7).map((key) => ({
    key,
    mins: Math.floor((usageSecs[key] || 0) / 60),
    today: key === todayKey(),
  }));

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
              className={"quick-card" + (a.accent ? " accent" : "") + (a.locked ? " locked" : "")}
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
                    {lightDay ? `${learned}/${total} terms` : "Locked till the weekend"}
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

        <div className="card home-streak-card">
          <div className="section-title" style={{ fontSize: 16, marginTop: 0 }}>
            <LuFlame size={16} /> Streak week
          </div>
          <div className="home-streak-row">
            {week.map((d) => (
              <div key={d.key} className={"home-streak-day" + (d.today ? " today" : "")}>
                <span className={"home-streak-dot" + (d.mins >= goalMins ? " done" : "")}>
                  {d.mins >= goalMins ? "\u2713" : ""}
                </span>
                <span className="home-streak-label">{dayLabel(d.key)}</span>
              </div>
            ))}
          </div>
          <p className="home-streak-caption">
            {streak > 0 ? `\u{1F525} ${streak} day streak \u2014 keep it going!` : "Study today to start your streak!"}
          </p>
        </div>

        <div className="card home-goal-card">
          <div className="section-title" style={{ fontSize: 16, marginTop: 0 }}>
            <LuClock size={16} /> Today&rsquo;s goal
          </div>
          <div className="home-goal-nums">
            <strong>{todayMin}</strong> / {goalMins} min
          </div>
          <div className="home-goal-bar">
            <span style={{ width: Math.min(100, (todayMin / goalMins) * 100) + "%" }} />
          </div>
          <div className="home-goal-xp">
            <LuSparkles size={14} /> {state.xp || 0} XP &middot; {Object.keys(badges).length} badges
          </div>
        </div>

        <button className="home-plan-link" onClick={() => navigate("/")}>
          <FiPlay size={16} /> Open Today&rsquo;s Plan <FiChevronRight size={16} />
        </button>
      </aside>
    </div>
  );
}