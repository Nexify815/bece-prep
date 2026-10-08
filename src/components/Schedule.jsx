import { todayPlan, weekPlan, quizRunCount, questionSets, QUIZ_SESSION, DAILY_GOAL_MIN } from "../lib/plan.js";
import { navigate } from "../lib/router.js";
import { todayKey, currentWeekKey, dateKey } from "../lib/dates.js";
import {
  FiCheck,
  FiChevronDown, FiChevronsUp, FiBookmark, FiTarget, FiClipboard,
  FiFileText, FiFlag, FiBarChart2,
} from "react-icons/fi";
import Mascot from "./Mascot.jsx";

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
  stairs: FiChevronsUp,
  glossary: FiBookmark,
  quiz: FiTarget,
  mistakes: FiClipboard,
  paper: FiFileText,
  mock: FiFlag,
  reflect: FiBarChart2,
};

const STEP_ART = {
  stairs: "\u{1F6B7}",
  glossary: "\u{1F4D6}",
  quiz: "\u{1F3AF}",
  mistakes: "\u{1F4CB}",
  paper: "\u{1F4C4}",
  mock: "\u{1F6A9}",
  reflect: "\u{1F4CA}",
};

const STEP_TINT = {
  stairs: "#DBEAFE",
  glossary: "#FCE7F3",
  quiz: "#EDE9FE",
  mistakes: "#FEF3C7",
  paper: "#E0F2FE",
  mock: "#FFEDD5",
  reflect: "#CCFBF1",
};

const PlanIcon = ({ name, size = 26 }) => {
  const Icon = STEP_ICONS[name] || FiTarget;
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
                  <span className="plan-shortcut-art" style={{ background: STEP_TINT.stairs }}>{"\u{1F6B7}"}</span>
                  <span className="plan-shortcut-body">
                    <span className="plan-shortcut-label">Stairs</span>
                    <span className="plan-shortcut-sub">Climb your plan</span>
                  </span>
                </button>
                <button className="plan-shortcut" onClick={() => navigate(`/subject/${focusKey}/glossary`)}>
                  <span className="plan-shortcut-art" style={{ background: STEP_TINT.glossary }}>{"\u{1F4D6}"}</span>
                  <span className="plan-shortcut-body">
                    <span className="plan-shortcut-label">Glossary</span>
                    <span className="plan-shortcut-sub">Look up terms</span>
                  </span>
                </button>
                <button className="plan-shortcut" onClick={() => navigate(`/subject/${focusKey}/quiz`)}>
                  <span className="plan-shortcut-art" style={{ background: STEP_TINT.quiz }}>{"\u{1F3AF}"}</span>
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
              &#9202; {todayMin} / {goalMin} min today &mdash; aim for {DAILY_GOAL_MIN} minutes
            </p>
          </div>

          {allDone ? (
            <button className="plan-next plan-next-done" onClick={() => navigate("/progress")}>
              <span className="plan-next-art">{"\u{1F389}"}</span>
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
                  {STEP_ART[nextStep.icon] || "\u{1F3AF}"}
                </span>
                <span className="plan-next-body">
                  <span className="plan-next-title">{nextStep.title}</span>
                  <span className="plan-next-sub">{nextStep.detail}</span>
                </span>
              </span>
              <span className="plan-next-foot">
                <span className="plan-next-min">&#9202; {nextStep.min} min</span>
                <span className="plan-next-btn">START</span>
              </span>
            </button>
          ) : null}

          <details className="plan-collapse" open>
            <summary className="plan-list-head">
              <span className="plan-list-title">Today&rsquo;s tasks</span>
              <span className="plan-list-count">
                {doneCount}/{plan.steps.length}
              </span>
              <FiChevronDown className="plan-chev" />
            </summary>
            <div className="plan-steps">
              {plan.steps.map((step, i) => {
                const done = isDone(step);
                const active = !done && nextStep && step.id === nextStep.id;
                return (
                  <button
                    key={i}
                    className={"plan-task" + (done ? " done" : "") + (active ? " active" : "")}
                    onClick={() => navigate(step.route)}
                  >
                    <span className="plan-task-art" style={{ background: STEP_TINT[step.icon] || STEP_TINT.quiz }}>
                      {STEP_ART[step.icon] || "\u{1F3AF}"}
                    </span>
                    <span className="plan-task-body">
                      <span className="plan-task-title">{step.title}</span>
                      <span className="plan-task-sub">{step.detail}</span>
                    </span>
                    {done ? (
                      <span className="plan-task-done">
                        <FiCheck size={16} />
                      </span>
                    ) : active ? (
                      <span className="plan-task-start">START</span>
                    ) : (
                      <span className="plan-task-min">{step.min} min</span>
                    )}
                  </button>
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
                    {d.done ? <FiCheck size={14} /> : d.partial ? `${d.mins}m` : ""}
                  </span>
                  <span className="streak-day-label">{d.label}</span>
                </div>
              ))}
            </div>
            <p className="streak-caption">
              {state.streak > 0
                ? `\u{1F525} ${state.streak} day streak — keep it going!`
                : doneCount > 0
                ? `${todayMin} mins in — finish your goal to secure your streak!`
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
                ? "Goal reached — the rest is a bonus!"
                : `${goalMin - todayMin} more minutes to go.`}
            </p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div>
      {home ? (
        <div className="hero schedule-hero landing-hero">
          <Mascot className="hero-mascot" happy />
          <h1>Today&rsquo;s Plan</h1>
          <p>
            StudyBuddy built your next steps from your own progress. Aim for{" "}
            {DAILY_GOAL_MIN} minutes a day.
          </p>
        </div>
      ) : (
        <div className="hero schedule-hero">
          <Mascot className="hero-mascot" />
          <h1>Your Study Timetable</h1>
          <p>
            What to study and how, made from your own progress. Aim for{" "}
            {DAILY_GOAL_MIN} minutes a day.
          </p>
        </div>
      )}

      {home && allDone && (
        <button className="card next-step-card day-done-card" onClick={() => navigate("/progress")}>
          <span className="next-step-mini">Day complete</span>
          <span className="next-step-line">
            <span className="next-step-icon"><FiCheck size={30} /></span>
            <span className="next-step-body">
              <span className="next-step-title">All of today&rsquo;s steps done!</span>
              <span className="next-step-detail">Great work. See how far you&rsquo;ve come, then rest up.</span>
            </span>
            <span className="step-min">Done</span>
          </span>
          <span className="next-step-cta">Review progress &#8594;</span>
        </button>
      )}

      {home && !allDone && nextStep && (
        <button className="card next-step-card" onClick={() => navigate(nextStep.route)}>
          <span className="next-step-mini">Your next step</span>
          <span className="next-step-line">
            <span className="next-step-icon"><PlanIcon name={nextStep.icon} size={30} /></span>
            <span className="next-step-body">
              <span className="next-step-title">{nextStep.title}</span>
              <span className="next-step-detail">{nextStep.detail}</span>
            </span>
            <span className="step-min">{nextStep.min} min</span>
          </span>
          <span className="next-step-cta">Start now &#8594;</span>
        </button>
      )}

      <div className="card focus-card">
        <div className="focus-tag">{light ? "Light day" : "Today's focus"}</div>
        {light ? (
          <div className="focus-subject">Rest &amp; Review</div>
        ) : (
          <div className="focus-subject">{plan.focus.name}</div>
        )}
        <p className="muted">
          {light
            ? "A gentler day: clear mistakes, take a past paper and recharge for tomorrow."
            : "You're weakest here right now — this is how you fix it."}
        </p>
      </div>

      <details className="plan-collapse">
        <summary className="section-title">
          Today's plan ({doneCount}/{plan.steps.length} done) <FiChevronDown className="plan-chev" />
        </summary>
        <div className="plan-steps">
          {plan.steps.map((step, i) => {
            const done = isDone(step);
            return (
              <button key={i} className={"card step-card" + (done ? " step-done" : "")} onClick={() => navigate(step.route)}>
                <span className="step-num">{done ? <FiCheck size={16} /> : i + 1}</span>
                <span className="step-icon"><PlanIcon name={step.icon} /></span>
                <span className="step-body">
                  <span className="step-title">{step.title}</span>
                  <span className="step-detail">{step.detail}</span>
                </span>
                <span className="step-min">{done ? "Done" : `${step.min} min`}</span>
              </button>
            );
          })}
        </div>
      </details>

      {!light && (
        <div className="card sets-card">
          <div className="sets-title">How the practice questions work</div>
          <p className="sets-para">
            Every subject&rsquo;s questions are grouped into three fixed sets by
            difficulty. You don&rsquo;t face them all at once &mdash; each run is
            a <b>{QUIZ_SESSION}-question session</b>, and every session feeds you questions
            you haven&rsquo;t solved yet until the whole set is done.
          </p>
          <div className="sets-row">
            <span className="sets-chip">Easy &mdash; {sets.easy}</span>
            <span className="sets-chip">Medium &mdash; {sets.medium}</span>
            <span className="sets-chip">Hard &mdash; {sets.hard}</span>
          </div>
          <p className="sets-para muted">
            So today&rsquo;s {plan.focus.name} quiz step is a {QUIZ_SESSION}-question run of
            the {quiz.name} set &mdash; not a marathon. Finish a question and it
            stays solved. Solve all {sets[quiz.diff]}, and the set is complete.
          </p>
        </div>
      )}

      <details className="plan-collapse">
        <summary className="section-title">
          Your week <FiChevronDown className="plan-chev" />
        </summary>
        <div className="week-list">
          {week.map((day) => (
            <div key={day.key} className="card week-row">
              <div className="week-day">
                <span className="week-day-label">{DAY_LABELS[day.key]}</span>
                <span className="week-day-full">{day.label}</span>
              </div>
              <div className="week-info">
                {day.focus ? (
                  <span className="week-focus">{day.focus.name}</span>
                ) : (
                  <span className="week-focus light">Light day</span>
                )}
                <span className="week-note">{day.note}</span>
              </div>
            </div>
          ))}
        </div>
      </details>

      <div className="how-card card">
        <div className="section-title">How to study</div>
        <ol className="how-list">
          <li>
            <b>Stairs first.</b> Learn each lesson then answer its questions.
            One unlocked step at a time.
          </li>
          <li>
            <b>Glossary next.</b> Tap a term to learn it &mdash; 5 new words a
            day beats 50 you forget.
          </li>
          <li>
            <b>Quiz after.</b> One run = one full set. Each subject has Easy,
            Medium and Hard sets of questions &mdash; pick a level and answer
            every question of that set.
          </li>
          <li>
            <b>Fix mistakes.</b> Review brings wrong answers back until you get
            them right.
          </li>
        </ol>
      </div>
    </div>
  );
}