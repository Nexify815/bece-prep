import { useEffect } from "react";
import { getSubjectsAvailable } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { todayKey } from "../lib/dates.js";
import QuestionOfDay from "./QuestionOfDay.jsx";

// White glyphs on a white tile — the subject colour comes from the card's
// gradient (--c3), matching the app-icon language used everywhere else.
const SUBJECT_GLYPH = {
  math: <span className="hm-glyph-pi">π</span>,
  science: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3h6v2h-1v4l5 9a2 2 0 01-2 3H7a2 2 0 01-2-3l5-9V5H9z"
      />
    </svg>
  ),
  english: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="currentColor" d="M3 5h8v14H3zM13 5h8v14h-8z" />
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="4.5" ry="10" fill="none" stroke="#fff" strokeWidth="1.8" />
      <path d="M2 12h20" stroke="#fff" strokeWidth="1.8" />
    </svg>
  ),
};

function GoalRing({ pct, label }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const dash = (circumference * Math.min(100, Math.max(0, pct))) / 100;
  return (
    <div className="hm-ring" aria-hidden="true">
      <svg viewBox="0 0 84 84">
        <circle className="hm-ring-track" cx="42" cy="42" r={r} strokeWidth="10" />
        <circle
          className="hm-ring-arc"
          cx="42"
          cy="42"
          r={r}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <span className="hm-ring-label">{label}</span>
    </div>
  );
}

export default function Home({ usageSecs, goalSecs, state, onQotdAnswer }) {
  const subjects = getSubjectsAvailable();
  const name = (state.nickname || "").trim();
  const streak = state.streak || 0;
  const goalMins = Math.round((goalSecs || 3600) / 60);
  const todayMin = Math.floor((usageSecs[todayKey()] || 0) / 60);
  const goalPct = goalMins ? Math.min(100, Math.round((todayMin / goalMins) * 100)) : 0;
  const goalDone = todayMin >= goalMins;
  const remaining = Math.max(0, goalMins - todayMin);

  // The reference home is a light canvas with a tinted sidebar; give the shell
  // a route flag so the page background (behind the fixed rail) can match.
  useEffect(() => {
    document.documentElement.classList.add("home-route");
    return () => document.documentElement.classList.remove("home-route");
  }, []);

  const streakLine = goalDone
    ? `Goal reached — ${todayMin} of ${goalMins} min done.`
    : `${todayMin} of ${goalMins} min done. ${
        streak > 0
          ? `Finish today to keep your ${streak}-day streak.`
          : "Finish today to start your streak."
      }`;

  return (
    <div className="hm-page">
      <section className="hm-hero">
        <span className="hm-bub hm-bub-a" aria-hidden="true" />
        <span className="hm-bub hm-bub-b" aria-hidden="true" />
        <span className="hm-bub hm-bub-c" aria-hidden="true" />
        <div className="hm-hero-text">
          <h1>{name ? `Welcome back, ${name}!` : "Welcome back!"}</h1>
          <p>{streakLine}</p>
        </div>
        <button className="hm-continue" onClick={() => navigate("/")}>
          <span className="hm-continue-cta">Continue learning</span>
          <span className="hm-continue-sub">Open today&rsquo;s plan</span>
        </button>
      </section>

      <div className="hm-columns">
        <section className="hm-left">
          <h2 className="hm-section-title">Pick a subject</h2>
          <div className="hm-subjects">
            {subjects.map((s) => {
              const total = s.data.glossary.length;
              const learned = Object.keys(state.learnedTerms || {}).filter((k) =>
                k.startsWith(`${s.key}:`)
              ).length;
              const pct = total ? (learned / total) * 100 : 0;
              return (
                <button
                  key={s.key}
                  className={"hm-subject hm-subject-" + s.key}
                  onClick={() => navigate(`/subject/${s.key}`)}
                >
                  <span className="hm-subject-tile" aria-hidden="true">
                    {SUBJECT_GLYPH[s.key] || null}
                  </span>
                  <span className="hm-subject-body">
                    <span className="hm-subject-name">{s.name}</span>
                    <span className="hm-subject-count">
                      {learned} / {total} terms
                    </span>
                  </span>
                  <span className="hm-subject-bar">
                    <span style={{ width: pct + "%" }} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="hm-side">
          <section className="hm-goal hm-card">
            <GoalRing pct={goalPct} label={`${todayMin}m`} />
            <div className="hm-goal-text">
              <h2>Daily goal</h2>
              <p>
                {goalDone
                  ? "Goal reached — anything else is a bonus."
                  : `${remaining} more minutes to go.`}
              </p>
            </div>
          </section>

          <section className="hm-qotd">
            <QuestionOfDay
              short
              answeredToday={!!(state.qotdAnswered && state.qotdAnswered[todayKey()])}
              onCorrect={onQotdAnswer}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
