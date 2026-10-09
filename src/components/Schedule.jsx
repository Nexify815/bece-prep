import { todayPlan, weekPlan, quizRunCount, questionSets, QUIZ_SESSION, DAILY_GOAL_MIN } from "../lib/plan.js";
import { navigate } from "../lib/router.js";
import { todayKey, currentWeekKey, dateKey } from "../lib/dates.js";
import {
  LuCheck,
  LuChevronDown, LuChevronsUp, LuBookmark, LuTarget, LuClipboard,
  LuFileText, LuFlag, LuChartNoAxesColumn,
} from "react-icons/lu";
import Mascot from "./Mascot.jsx";
import { LuClock, LuArrowRight } from "./icons.jsx";

const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const STEP_ICONS = {
  stairs: LuChevronsUp,
  glossary: LuBookmark,
  quiz: LuTarget,
  mistakes: LuClipboard,
  paper: LuFileText,
  mock: LuFlag,
  reflect: LuChartNoAxesColumn,
};

import { StepIcon, LuPartyPopper } from "./icons.jsx";

const STEP_TINT = {
  stairs: "#DBEAFE",
  glossary: "#FCE7F3",
  quiz: "#EDE9FE",
  mistakes: "#FEF3C7",
  paper: "#E0F2FE",
  mock: "#FFEDD5",
  reflect: "#CCFBF1",
};

const STEP_COLOR = {
  stairs: "#2563EB",
  glossary: "#DB2777",
  quiz: "#7C3AED",
  mistakes: "#D97706",
  paper: "#0284C7",
  mock: "#EA580C",
  reflect: "#0F766E",
};

const PlanIcon = ({ name, size = 26 }) => {
  const Icon = STEP_ICONS[name] || LuTarget;
  return <Icon size={size} />;
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

  if (home) {
    const todayMin = Math.floor(usageSecs / 60);
    const goalMin = Math.round(goalSecs / 60);
    const goalPct = Math.min(100, Math.round((todayMin / goalMin) * 100));
    const focusKey = light ? null : plan.focus.key;
    const totalMin = plan.steps.reduce((a, s) => a + s.min, 0);

    return (
      <div className="plan-grid">
        {/* ---- left: shortcuts into today's focus subject ---- */}
        <section className="plan-side-col">
          {focusKey && (
            <>
              <div className="section-title home-sub">Jump back in</div>
              <div className="plan-shortcuts">
                <button className="plan-shortcut" onClick={() => navigate(`/subject/${focusKey}/path`)}>
                  <span className="plan-shortcut-art" style={{ background: STEP_TINT.stairs }}>
                    <StepIcon name="stairs" size={20} color={STEP_COLOR.stairs} />
                  </span>
                  <span className="plan-shortcut-body">
                    <span className="plan-shortcut-label">Stairs</span>
                    <span className="plan-shortcut-sub">Climb your plan</span>
                  </span>
                </button>
                <button className="plan-shortcut" onClick={() => navigate(`/subject/${focusKey}/glossary`)}>
                  <span className="plan-shortcut-art" style={{ background: STEP_TINT.glossary }}>
                    <StepIcon name="glossary" size={20} color={STEP_COLOR.glossary} />
                  </span>
                  <span className="plan-shortcut-body">
                    <span className="plan-shortcut-label">Glossary</span>
                    <span className="plan-shortcut-sub">Look up terms</span>
                  </span>
                </button>
                <button className="plan-shortcut" onClick={() => navigate(`/subject/${focusKey}/quiz`)}>
                  <span className="plan-shortcut-art" style={{ background: STEP_TINT.quiz }}>
                    <StepIcon name="quiz" size={20} color={STEP_COLOR.quiz} />
                  </span>
                  <span className="plan-shortcut-body">
                    <span className="plan-shortcut-label">Quiz</span>
                    <span className="plan-shortcut-sub">Test yourself</span>
                  </span>
                </button>
              </div>
            </>
          )}
        </section>

        {/* ---- centre: banner, next step, task list ---- */}
        <section className="plan-mid">
          <div className="plan-banner">
            <div className="plan-banner-top">
              <Mascot className="plan-banner-mascot" happy />
              <div>
                <h1>Today&rsquo;s Plan</h1>
                <p>
                  {doneCount}/{plan.steps.length} done &middot; {totalMin} min of work
                </p>
              </div>
            </div>
            <div className="plan-banner-bar">
              <span style={{ width: (plan.steps.length ? Math.round((doneCount / plan.steps.length) * 100) : 0) + "%" }} />
            </div>
            <p className="plan-banner-mins">
              <LuClock size={14} /> {todayMin} / {goalMin} min today &mdash; aim for {DAILY_GOAL_MIN} minutes
            </p>
          </div>

          {allDone ? (
            <button className="plan-next plan-next-done" onClick={() => navigate("/progress")}>
              <span className="plan-next-art"><LuPartyPopper size={28} color="#CA8A04" /></span>
              <span className="plan-next-body">
                <span className="plan-next-title">All done for today!</span>
                <span className="plan-next-sub">Check your progress, then rest up.</span>
              </span>
              <span className="plan-next-btn">VIEW PROGRESS</span>
            </button>
          ) : nextStep ? (
            <button className="plan-next" onClick={() => navigate(nextStep.route)}>
              <span className="plan-next-over">NEXT UP</span>
              <span className="plan-next-main">
                <span className="plan-next-art" style={{ background: STEP_TINT[nextStep.icon] || STEP_TINT.quiz }}>
                  <StepIcon name={nextStep.icon} size={28} color={STEP_COLOR[nextStep.icon] || "#7C3AED"} />
                </span>
                <span className="plan-next-body">
                  <span className="plan-next-title">{nextStep.title}</span>
                  <span className="plan-next-sub">{nextStep.detail}</span>
                </span>
              </span>
              <span className="plan-next-foot">
                <span className="plan-next-min"><LuClock size={13} /> {nextStep.min} min</span>
                <span className="plan-next-btn">START</span>
              </span>
            </button>
          ) : null}

          <details className="plan-collapse">
            <summary className="plan-list-head">
              <span className="plan-list-title">Today&rsquo;s tasks</span>
              <span className="plan-list-count">
                {doneCount}/{plan.steps.length}
              </span>
              <LuChevronDown className="plan-chev" />
            </summary>
            <p className="plan-list-hint">Finish the next step to move this list along.</p>
            <div className="plan-steps">
              {plan.steps.map((step, i) => {
                const done = isDone(step);
                const active = !done && nextStep && step.id === nextStep.id;
                // plain checklist rows Ã¢â‚¬â€ "Next up" is the only place you start
                return (
                  <div
                    key={i}
                    className={"plan-task" + (done ? " done" : "") + (active ? " active" : "")}
                  >
                    <span className="plan-task-art" style={{ background: STEP_TINT[step.icon] || STEP_TINT.quiz }}>
                      <StepIcon name={step.icon} size={22} color={STEP_COLOR[step.icon] || "#7C3AED"} />
                    </span>
                    <span className="plan-task-body">
                      {active && <span className="plan-task-flag">UP NEXT</span>}
                      <span className="plan-task-title">{step.title}</span>
                      <span className="plan-task-sub">{step.detail}</span>
                    </span>
                    {done ? (
                      <span className="plan-task-done">
                        <LuCheck size={16} />
                      </span>
                    ) : (
                      // the "Next up" card owns the START action Ã¢â‚¬â€ rows stay plain
                      // so there is only one obvious "go" on the screen
                      <span className="plan-task-min">{step.min} min</span>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        </section>

        {/* ---- right: streak + goal ---- */}
        <aside className="plan-stats-col">
          <div className="card plan-streak-card">
            <div className="plan-streak-title">This week</div>
            <div className="streak-week">
              {weekDays.map((d) => (
                <div key={d.key} className="streak-day">
                  <span
                    className={"streak-dot" + (d.done ? " done" : d.partial ? " partial" : "") + (d.today ? " today" : "")}
                    title={`${d.label}: ${d.mins} min`}
                  >
                    {d.done ? <LuCheck size={14} /> : d.partial ? `${d.mins}m` : ""}
                  </span>
                  <span className="streak-day-label">{d.label}</span>
                </div>
              ))}
            </div>
            <p className="streak-caption">
              {state.streak > 0
                ? `${state.streak} day streak Ã¢â‚¬â€ keep it going!`
                : doneCount > 0
                ? `${todayMin} mins in Ã¢â‚¬â€ finish your goal to secure your streak!`
                : "Study today to start your streak!"}
            </p>
          </div>

          <div className="card plan-goal-card">
            <div className="plan-goal-head">
              <span>Today&rsquo;s goal</span>
              <strong>{goalPct}%</strong>
            </div>
            <div className="plan-goal-bar">
              <span style={{ width: goalPct + "%" }} />
            </div>
            <p className="plan-goal-note">
              {todayMin >= goalMin
                ? "Goal reached Ã¢â‚¬â€ the rest is a bonus!"
                : `${goalMin - todayMin} more minutes to go.`}
            </p>
          </div>
        </aside>
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
