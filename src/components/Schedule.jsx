import { useEffect, useState } from "react";
import { todayPlan, weekPlan, nextLessonProgress } from "../lib/plan.js";
import { navigate } from "../lib/router.js";
import { todayKey, currentWeekKey, dateKey } from "../lib/dates.js";
import { LuHouse, LuFileText, LuShoppingBag, LuChartNoAxesColumn, LuSettings, LuGraduationCap, LuCloud, LuTimer, LuCheck } from "react-icons/lu";
import { LuPartyPopper } from "./icons.jsx";
import Pills from "./Pills.jsx";

const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const RAIL = [
  { key: "home", label: "Home", hash: "/home", Icon: LuHouse, tone: "orange" },
  { key: "plan", label: "Plan", hash: "/", Icon: LuFileText, tone: "green" },
  { key: "shop", label: "Shop", hash: "/store", Icon: LuShoppingBag, tone: "red" },
  { key: "progress", label: "Progress", hash: "/progress", Icon: LuChartNoAxesColumn, tone: "blue" },
  { key: "settings", label: "Settings", hash: "/settings", Icon: LuSettings, tone: "purple" },
];
const RAIL_BOTTOM = [
  { key: "exam", label: "Exam mode", hash: "/exam", Icon: LuGraduationCap, tone: "gold" },
  { key: "backup", label: "Backup", hash: "/backup", Icon: LuCloud, tone: "sage" },
];

// White single-color glyphs for the tile icons — white glyphs
// on gradient tiles matches the reference mock.
export const TILE_GLYPHS = {
  learn: BookGlyph,
  stairs: StairsGlyph,
  glossary: AaGlyph,
  quiz: ChecklistGlyph,
  mistakes: PencilGlyph,
  review: PencilGlyph,
  paper: ClockGlyph,
  clock: ClockGlyph,
  mock: CapGlyph,
  reflect: PieGlyph,
};

function Glyph({ children, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}
export function BookGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <path fill="#fff" d="M4 6.4C6.4 4.9 9.3 4.8 12 6.9c2.7-2.1 5.6-2.2 8-.5v12.2c-2.4-1.7-5.3-1.6-8 .5-2.7-2.1-5.6-2.2-8-.5V6.4Z" />
    </Glyph>
  );
}
export function StairsGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <rect x="2" y="15" width="8" height="5" rx="2.5" fill="#fff" />
      <rect x="8" y="10" width="8" height="5" rx="2.5" fill="#fff" />
      <rect x="14" y="5" width="8" height="5" rx="2.5" fill="#fff" />
    </Glyph>
  );
}
export function AaGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <text x="12" y="17.5" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="13" fill="#fff">Aa</text>
    </Glyph>
  );
}
export function ChecklistGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <path fill="#fff" d="M2.3 8.4 L4.6 10.7 L9.6 5.7 L8.3 4.4 L4.6 8.1 L3.6 7.1 Z" />
      <path fill="#fff" d="M2.3 15.9 L4.6 18.2 L9.6 13.2 L8.3 11.9 L4.6 15.6 L3.6 14.6 Z" />
      <rect x="12.1" y="6.2" width="9.4" height="2.9" rx="1.45" fill="#fff" />
      <rect x="12.1" y="13.7" width="6.5" height="2.9" rx="1.45" fill="#fff" />
    </Glyph>
  );
}
export function PencilGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <g transform="rotate(-45 12 12)" fill="#fff">
        <rect x="4.9" y="9.1" width="9" height="5.8" />
        <rect x="1.7" y="9.1" width="3" height="5.8" rx="1.9" />
        <path d="M13.9 8.6 21.6 12l-7.7 3.4Z" />
      </g>
    </Glyph>
  );
}
export function ClockGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <rect x="9.2" y="1.6" width="5.6" height="3" rx="1.5" fill="#fff" />
      <circle cx="12" cy="14.4" r="8.2" fill="#fff" />
      <rect x="10.9" y="10.4" width="2.1" height="4.6" rx="1.05" fill="rgba(20,64,8,0.5)" />
      <rect x="10.9" y="13.4" width="4.2" height="2.1" rx="1.05" fill="rgba(20,64,8,0.5)" />
    </Glyph>
  );
}
export function CapGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <path fill="#fff" d="M12 3.4 2.2 9.3 12 15.2l9.8-5.9Z" />
      <path fill="#fff" opacity="0.85" d="M6.9 12.2v4.2c0 1.35 2.3 2.9 5.1 2.9s5.1-1.55 5.1-2.9v-4.2L12 15.1Z" />
    </Glyph>
  );
}
export function PieGlyph({ size = 24 }) {
  return (
    <Glyph size={size}>
      <path fill="#fff" fillRule="evenodd" clipRule="evenodd" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 3h9v9h-9Z" />
      <rect x="13.7" y="2.3" width="7.6" height="7.6" rx="1.9" fill="#fff" opacity="0.82" />
    </Glyph>
  );
}

// Small circular house / plan / shop / chart / gear — white on gradient tiles
import { TileIcon } from "./Tile.jsx";

export default function Schedule({ state, home = false, pills }) {
  const [showAllTasks, setShowAllTasks] = useState(false);
  const plan = todayPlan(state);
  const week = weekPlan(state);

  const dayKey = todayKey();
  const planDone = (state.planDone || {})[dayKey] || {};
  const usageSecs = (state.usageSecs || {})[dayKey] || 0;
  const goalSecs = state.goalSecs || 60 * 60;
  const todayMin = Math.floor(usageSecs / 60);
  const goalMin = Math.round(goalSecs / 60);
  const goalPct = goalMin ? Math.min(100, Math.round((todayMin / goalMin) * 100)) : 0;

  const isDone = (step) =>
    step.id === "reflect" ? !!(planDone[step.id] || usageSecs >= goalSecs) : !!planDone[step.id];
  const remaining = plan.steps.filter((s) => !isDone(s));
  const nextStep = remaining[0];
  const allDone = plan.steps.length > 0 && remaining.length === 0;
  const doneCount = plan.steps.filter((s) => isDone(s)).length;

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
      mins: Math.floor(secs / 60),
      today: key === dayKey,
    };
  });

  useEffect(() => {
    if (!home) return;
    document.documentElement.classList.add("plan-route");
    return () => document.documentElement.classList.remove("plan-route");
  }, [home]);

  if (home) {
    const comingUp = plan.focus ? nextLessonProgress(state, plan.focus.key) : null;
    const streak = state.streak || 0;

    const thenSteps = plan.steps
      .filter((s) => s !== nextStep)
      .map((s) => ({ ...s, __isDone: isDone(s) }));
    const [firstTwo, hidden] = [thenSteps.slice(0, 2), thenSteps.slice(2)];
    const stairsPct = comingUp ? Math.round((comingUp.done / Math.max(1, comingUp.total)) * 100) : 100;
    const stairsCaption = comingUp
      ? `${comingUp.sub}, step ${comingUp.done + 1} of ${comingUp.total}.`
      : "All stairs cleared — nice work!";

    return (
      <div className="p-page" id="top">
        {/* ------- rail ------- */}
        <aside className="p-side">
          <button className="p-wordmark" onClick={() => navigate("/home")} aria-label="StudyBuddy home">
            <span className="p-logo">StudyBuddy</span>
          </button>
          <nav className="p-nav" aria-label="Primary">
            {RAIL.map((i) => (
              <button
                key={i.key}
                className={"p-nav-item" + (i.key === "plan" ? " is-active" : "")}
                aria-current={i.key === "plan" ? "page" : undefined}
                onClick={() => navigate(i.hash)}
              >
                <TileIcon tone={i.tone} size="sm">
                  <i.Icon size={19} strokeWidth={2.6} color="#fff" />
                </TileIcon>
                <span>{i.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-spacer" />
          <nav className="p-nav p-nav-bottom" aria-label="Secondary">
            {RAIL_BOTTOM.map((i) => (
              <button key={i.key} className="p-nav-item" onClick={() => navigate(i.hash)}>
                <TileIcon tone={i.tone} size="sm">
                  <i.Icon size={19} strokeWidth={2.6} color="#fff" />
                </TileIcon>
                <span>{i.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ------- main ------- */}
        <main className="p-main">
          <div className="p-top">
            <h1 className="p-h1">Today&rsquo;s plan</h1>
            <div className="p-pills-wrap"><Pills {...pills} /></div>
          </div>

          <div className="p-grid">
            <div className="p-col">
              {/* heads-up row + progress */}
              <div>
                <div className="p-row"><span>{todayMin} of {goalMin} min today</span><span>{doneCount} of {plan.steps.length} tasks</span></div>
                <div className="p-bar" aria-hidden="true"><i style={{ width: goalPct + "%" }} /></div>
              </div>

              {/* hero */}
              {nextStep ? (
                <section className="p-hero" data-tour="banner" aria-labelledby="p-upnext-title">
                  <span className="p-bub p-bub-a" aria-hidden="true" />
                  <span className="p-bub p-bub-b" aria-hidden="true" />
                  <span className="p-bub p-bub-c" aria-hidden="true" />
                  <div className="p-eyebrow">UP NEXT</div>
                  <h2 className="p-hero-h2" id="p-upnext-title">{nextStep.title}</h2>
                  <p className="p-hero-p">{nextStep.detail}</p>
                  <div className="p-act">
                    <button className="p-start" onClick={() => navigate(nextStep.route)}>Start</button>
                    <span className="p-min"><LuTimer size={18} strokeWidth={2.6} /> {nextStep.min} min</span>
                  </div>
                </section>
              ) : (
                <section className="p-hero is-done" data-tour="banner" aria-labelledby="p-done-title">
                  <span className="p-bub p-bub-a" aria-hidden="true" />
                  <span className="p-bub p-bub-b" aria-hidden="true" />
                  <span className="p-bub p-bub-c" aria-hidden="true" />
                  <div className="p-eyebrow">DONE FOR TODAY</div>
                  <h2 className="p-hero-h2" id="p-done-title">All done for today!</h2>
                  <p className="p-hero-p">You cleared every step. Head to Progress to see your week.</p>
                  <div className="p-act">
                    <button className="p-start" onClick={() => navigate("/progress")}>See my progress</button>
                  </div>
                </section>
              )}

              {/* then list */}
              {!allDone && (
                <section className="p-then">
                  <h2 className="p-then-head">Then</h2>
                  <ol className="p-list" data-tour="tasks" id="p-then-list">
                    {(showAllTasks ? thenSteps : firstTwo).map((step) => {
                      const Glyph = TILE_GLYPHS[step.icon] || TILE_GLYPHS.learn;
                      return (
                        <li key={step.id + step.title} className={"p-it" + (step.__isDone ? " is-done" : "")}>
                          <span className={"p-it-tile p-it-tile-" + step.icon} aria-hidden="true">
                            <Glyph size={28} />
                          </span>
                          <span className="p-it-body">
                            <span className="p-it-title">{step.title}{step.__isDone && <LuCheck size={15} strokeWidth={3.5} className="p-check" />}</span>
                            <span className="p-it-sub">{step.detail}</span>
                          </span>
                          <span className="p-it-min">{step.min} min</span>
                        </li>
                      );
                    })}
                  </ol>
                  {hidden.length > 0 && (
                    <button
                      type="button"
                      className={"p-more" + (showAllTasks ? " is-open" : "")}
                      onClick={() => setShowAllTasks((v) => !v)}
                      aria-expanded={showAllTasks}
                      aria-controls="p-then-list"
                    >
                      <span className="p-more-chevron" aria-hidden="true">›</span>
                      {showAllTasks
                        ? "Show less"
                        : `+ ${hidden.length} more task${hidden.length === 1 ? "" : "s"}`}
                    </button>
                  )}
                </section>
              )}

              {allDone && (
                <button className="p-done-all" onClick={() => navigate("/progress")}>
                  <LuPartyPopper size={22} /> Check your progress
                </button>
              )}
            </div>

            {/* right column */}
            <div className="p-side2">
              <section className="p-card" aria-label="This week">
                <h2 className="p-card-title">This week</h2>
                <div className="p-week">
                  {weekDays.map((d) => (
                    <div key={d.key} className={"p-week-day" + (d.done ? " is-done" : "") + (d.today && !d.done ? " is-today" : "")}>
                      <span className="p-circle" aria-hidden="true" />
                      <span className="p-week-label">{d.label}</span>
                    </div>
                  ))}
                </div>
                <p className="p-week-cap">{streak > 0 ? `${streak} day${streak === 1 ? "" : "s"} in a row. Keep going!` : "Study today to start your streak."}</p>
              </section>

              <section className="p-card" aria-label="Stairs progress">
                <h2 className="p-card-title">Stairs</h2>
                <div className="p-bar p-bar-sm" role="progressbar" aria-valuenow={stairsPct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: stairsPct + "%" }} /></div>
                <p className="p-card-cap">{stairsCaption}</p>
              </section>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // /schedule — week calendar (unchanged behavior)
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
            <div key={d.key} className={"calendar-day" + (isToday ? " today" : "") + (d.focus ? "" : " light")}>
              <div className="calendar-day-head">
                <span className="calendar-day-name">{DAY_LABELS[d.key]}</span>
                {isToday && <span className="calendar-today-pill">Today</span>}
              </div>
              <div className="calendar-day-focus">{d.focus ? d.focus.name : "Light day"}</div>
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
