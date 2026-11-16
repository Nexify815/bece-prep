import { useEffect } from "react";
import { todayPlan, weekPlan, quizRunCount, questionSets, QUIZ_SESSION } from "../lib/plan.js";
import { navigate } from "../lib/router.js";
import { todayKey, currentWeekKey, dateKey } from "../lib/dates.js";
import { LuCheck } from "react-icons/lu";

const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

import { LuPartyPopper } from "./icons.jsx";

// Emoji artwork, matching the reference Plan design (the rest of the app
// keeps its line-icon language; the Plan page is the friendly "today" view).
const PLAN_EMOJI = {
  learn: "📖",
  stairs: "🪜",
  glossary: "🔖",
  quiz: "🎯",
  mistakes: "📋",
  paper: "📄",
  mock: "🚩",
  reflect: "📊",
  review: "📋",
};

export default function Schedule({ state, home = false }) {
  const plan = todayPlan(state);
  const week = weekPlan(state);
  const light = !plan.focus;
  const sets = light ? null : questionSets(plan.focus.key);
  const quiz = light ? null : quizRunCount(state, plan.focus.key);

  // Which of today's steps are already done? Marked by App as activities
  // actually finish (learn a lesson, learn a term, finish a quiz, clear the
  // mistakes bank, complete a past paper / mock exam). "Reflect on the week"
  // also auto-completes once today's usage goal is met.
  const dayKey = todayKey();
  const planDone = (state.planDone || {})[dayKey] || {};
  const usageSecs = (state.usageSecs || {})[dayKey] || 0;
  const goalSecs = state.goalSecs || 60 * 60;
  const isDone = (step) =>
    step.id === "reflect" ? !!(planDone[step.id] || usageSecs >= goalSecs) : !!planDone[step.id];
  const remaining = plan.steps.filter((s) => !isDone(s));
  const nextStep = remaining[0];
  const allDone = plan.steps.length > 0 && remaining.length === 0;
  const doneCount = plan.steps.filter((s) => isDone(s)).length;

  // Current week (Mon-Sun) completion for the streak row
  const weekStart = new Date(currentWeekKey() + "T00:00:00");
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = dateKey(d);
    const secs = (state.usageSecs || {})[key] || 0;
    return {
      key,
      label: DAY_LABELS[["mon","tue","wed","thu","fri","sat","sun"][i]],
      done: secs >= goalSecs,
      partial: secs > 0 && secs < goalSecs,
      mins: Math.floor(secs / 60),
      today: key === dayKey,
    };
  });

  // Plan shares the reference shell's warm canvas (and dark palette).
  useEffect(() => {
    if (!home) return;
    document.documentElement.classList.add("plan-route");
    return () => document.documentElement.classList.remove("plan-route");
  }, [home]);

  if (home) {
    const todayMin = Math.floor(usageSecs / 60);
    const goalMin = Math.round(goalSecs / 60);
    const goalPct = goalMin ? Math.min(100, Math.round((todayMin / goalMin) * 100)) : 0;
    const totalMin = plan.steps.reduce((a, s) => a + s.min, 0);
    const activeDays = weekDays.filter((d) => d.mins > 0).length;
    const jumpKey = (plan.focus && plan.focus.key) || (state.planWeek && state.planWeek.core && state.planWeek.core[0]) || "english";
    const weekCaption =
      activeDays > 0
        ? `Your best week yet: ${activeDays} day${activeDays === 1 ? "" : "s"} so far`
        : "Study today to start your week!";

    const jumps = [
      { icon: "stairs", label: "Stairs", sub: "Climb your plan", route: `/subject/${jumpKey}/path` },
      { icon: "glossary", label: "Glossary", sub: "Look up terms", route: `/subject/${jumpKey}/glossary` },
      { icon: "quiz", label: "Quiz", sub: "Test yourself", route: `/subject/${jumpKey}/quiz` },
    ];

    return (
      <div className="pl-page">
        <div className="pl-grid">
          {/* ---- main: today's progress + the step timeline ---- */}
          <section className="pl-main">
            <div className="pl-hero" data-tour="banner">
              <div className="pl-hero-inner">
                <h1>Today&rsquo;s Plan</h1>
                <p className="pl-hero-sub">
                  {doneCount}/{plan.steps.length} done &middot; {totalMin} min of work
                </p>
                <div className="pl-hero-bar">
                  <span style={{ width: goalPct + "%" }} />
                </div>
                <p className="pl-hero-mins">
                  {todayMin} / {goalMin} min today: aim for {goalMin} minutes
                </p>
              </div>
            </div>

            <ol className="pl-steps" data-tour="tasks">
              {plan.steps.map((step, i) => {
                const done = isDone(step);
                const active = !done && nextStep && step.id === nextStep.id;
                return (
                  <li
                    key={i}
                    className={"pl-step" + (done ? " is-done" : "") + (active ? " is-active" : "")}
                  >
                    <span className="pl-node" aria-hidden="true">
                      {done || active ? (
                        <LuCheck size={18} strokeWidth={3} />
                      ) : (
                        <span className="pl-node-num">{i + 1}</span>
                      )}
                    </span>
                    <button type="button" className="pl-row" onClick={() => navigate(step.route)}>
                      <span className={"pl-art pl-art-" + step.icon}>
                        <span className="pl-emoji">{PLAN_EMOJI[step.icon] || "🎯"}</span>
                      </span>
                      <span className="pl-row-body">
                        <span className="pl-row-line">
                          <span className="pl-row-title">{step.title}</span>
                          {active && <span className="pl-row-flag">Up next</span>}
                        </span>
                        <span className="pl-row-sub">{step.detail}</span>
                      </span>
                      <span className="pl-row-min">{step.min} min</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {allDone && (
              <button className="pl-done" onClick={() => navigate("/progress")}>
                <LuPartyPopper size={22} />
                All done for today &mdash; check your progress
              </button>
            )}
          </section>

          {/* ---- side: week + shortcuts ---- */}
          <aside className="pl-side">
            <section className="pl-panel pl-week" data-tour="goal">
              <h2>This week</h2>
              <div className="pl-week-days">
                {weekDays.map((d) => (
                  <div
                    key={d.key}
                    className={"pl-day" + (d.mins > 0 ? " has-mins" : "") + (d.today ? " is-today" : "")}
                    title={`${d.label}: ${d.mins} min`}
                  >
                    <span className="pl-day-dot">{d.mins > 0 ? `${d.mins}m` : ""}</span>
                    <span className="pl-day-label">{d.label}</span>
                  </div>
                ))}
              </div>
              <p className="pl-week-caption">{weekCaption}</p>
            </section>

            <section className="pl-panel pl-jump" data-tour="shortcuts">
              <h2>Jump back in</h2>
              <div className="pl-jump-list">
                {jumps.map((j) => (
                  <button key={j.icon} type="button" className="pl-jump-row" onClick={() => navigate(j.route)}>
                    <span className={"pl-art pl-art-" + j.icon}>
                      <span className="pl-emoji">{PLAN_EMOJI[j.icon] || "🎯"}</span>
                    </span>
                    <span className="pl-jump-body">
                      <span className="pl-jump-title">{j.label}</span>
                      <span className="pl-jump-sub">{j.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  // /schedule is now the week calendar only — Today's Plan lives on "/".
  const today = todayKey();
  return (
    <div className="calendar-page">
      <div className="settings-hero">
        <h1>Your week</h1>
        <p>The plan StudyBuddy built from your progress, day by day.</p>
      </div>

      <div className="calendar-list">
        {week.map((d) => {
          const isToday = d.key === today;
          return (
            <div
              key={d.key}
              className={
                "calendar-day" + (isToday ? " today" : "") + (d.focus ? "" : " light")
              }
            >
              <div className="calendar-day-head">
                <span className="calendar-day-name">{DAY_LABELS[d.key]}</span>
                {isToday && <span className="calendar-today-pill">Today</span>}
              </div>
              <div className="calendar-day-focus">
                {d.focus ? d.focus.name : "Light day"}
              </div>
              <p className="calendar-day-note">{d.note}</p>
              {isToday && (
                <button className="focus-btn" onClick={() => navigate("/")}>
                  Open today&rsquo;s plan
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
