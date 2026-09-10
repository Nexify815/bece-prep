import { todayPlan, weekPlan, quizRunCount, questionSets, QUIZ_SESSION, DAILY_GOAL_MIN } from "../lib/plan.js";
import { navigate } from "../lib/router.js";
import { todayKey } from "../lib/dates.js";
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