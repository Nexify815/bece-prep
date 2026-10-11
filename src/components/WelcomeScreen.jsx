import { useState } from "react";
import { LuArrowRight, LuCheck, LuMountain, LuSearch, LuListChecks, LuTarget } from "react-icons/lu";
import Mascot from "./Mascot.jsx";

const GOALS = [30, 60, 90, 120];

const METHOD = [
  { Icon: LuMountain, title: "Climb the Stairs", body: "Lessons, one unlocked step at a time." },
  { Icon: LuSearch, title: "Learn the words", body: "Five new terms a day beats fifty you forget." },
  { Icon: LuListChecks, title: "Then test yourself", body: "Short quiz sets per subject." },
  { Icon: LuTarget, title: "Fix what you missed", body: "Wrong answers come back until they're right." },
];

// First run. Deliberately not a stretched phone layout:
//   phone  — one thing per screen, thumb-reachable action pinned to the bottom
//   desktop— a brand panel beside a 560px task column, the Focus-shell shape
export default function WelcomeScreen({ initialName = "", initialGoalSecs = 3600, onStart, onSkip }) {
  const [name, setName] = useState(initialName || "");
  const [goal, setGoal] = useState(
    GOALS.reduce((best, g) =>
      Math.abs(g * 60 - (initialGoalSecs || 3600)) < Math.abs(best * 60 - (initialGoalSecs || 3600)) ? g : best
    , GOALS[1])
  );
  const [step, setStep] = useState(0);
  const last = step === METHOD.length;

  const finish = () => onStart(name.trim(), goal * 60);

  return (
    <div className="welcome-page">
      {/* --- brand panel: hidden on phones, where it would just push the form down --- */}
      <aside className="welcome-brand desktop-only">
        <div className="welcome-brand-inner">
          <span className="welcome-brand-mark">
            {/* white, not the green "happy" tint — it sits on the purple panel */}
            <Mascot size={54} happy color="#fff" />
          </span>
          <h2 className="welcome-brand-title">
            {name ? `Good to see you, ${name}.` : "Let\u2019s get you started."}
          </h2>
          <p className="welcome-brand-sub">
            StudyBuddy builds today&rsquo;s plan from your own progress &mdash;
            and rebuilds it every day you use it.
          </p>
          <ul className="welcome-method">
            {METHOD.map((m) => (
              <li key={m.title}>
                <span className="welcome-method-icon">
                  <m.Icon size={18} />
                </span>
                <span className="welcome-method-body">
                  <b>{m.title}</b>
                  <span>{m.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* --- task column: the Focus shape, 560px --- */}
      <section className="welcome-main">
        <div className="welcome-mobile-mark">
          <Mascot size={40} happy />
        </div>

        {!last ? (
          <>
            <span className="welcome-progress-dots">
              {METHOD.map((m, i) => (
                <span key={m.title} className={"welcome-dot" + (i <= step ? " on" : "")} />
              ))}
            </span>
            <h1 className="welcome-title">{METHOD[step].title}</h1>
            <p className="welcome-body">{METHOD[step].body}</p>

            <div className="welcome-nav">
              {step > 0 && (
                <button className="focus-link" onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}
              <button className="focus-btn" onClick={() => setStep(step + 1)}>
                Next <LuArrowRight size={18} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="welcome-title">Two quick things</h1>
            <p className="welcome-body">
              Both are optional &mdash; you can change them any time in Settings.
            </p>

            <div className="card welcome-card">
              <label className="field-label" htmlFor="welcome-name">
                What should we call you?
              </label>
              <input
                id="welcome-name"
                className="txt-input"
                type="text"
                placeholder="First name"
                maxLength={24}
                autoCapitalize="words"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && finish()}
              />

              <div className="field-label" style={{ marginTop: 18 }}>
                Daily study goal
              </div>
              <div className="welcome-goals">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    className={"welcome-goal" + (goal === g ? " selected" : "")}
                    onClick={() => setGoal(g)}
                    aria-pressed={goal === g}
                  >
                    {goal === g && <LuCheck size={14} />}
                    {g} min
                  </button>
                ))}
              </div>
              <p className="welcome-hint">
                You can study longer on weekends. This is the daily target your
                streak is measured against.
              </p>
            </div>

            <div className="welcome-actions">
              <button className="focus-btn" onClick={finish}>
                Start learning <LuArrowRight size={18} />
              </button>
              <button className="focus-link" onClick={onSkip}>
                Skip for now
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}