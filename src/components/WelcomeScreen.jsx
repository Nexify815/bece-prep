import { useState, useEffect } from "react";
import { LuArrowRight, LuArrowLeft, LuCheck, LuSun, LuMoon } from "react-icons/lu";
import { LEVEL_META, levelShares } from "../lib/plan.js";
import { StairsIcon, MagnifierIcon, ChecklistIcon, TargetIcon } from "./glyphs.jsx";

// The stairs levels. Names + hint minutes + what a day actually contains at
// each pace â€” the onboarding picks one; the rest of the app reads the same
// source of truth so nothing invents its own numbers.
const LEVELS = LEVEL_META.slice(1);

// First-run onboarding, built to the new split-panel design: one bright panel
// (green in Day, lime in Night) on the left, one quiet content panel on the
// right, and a persistent footer with Back / Set later / primary action.
const METHOD = [
  { art: "stairs", title: "Climb the Stairs", body: "Lessons, one unlocked step at a time." },
  { art: "learn", title: "Learn the words", body: "Five new terms a day beats fifty you forget." },
  { art: "checklist", title: "Then test yourself", body: "Short quiz sets per subject." },
  { art: "target", title: "Fix what you missed", body: "Wrong answers come back until they're right." },
];
export default function WelcomeScreen({ initialName = "", initialLevel = 1, onStart, onSkip, theme = "day", onToggleTheme }) {
  const [name, setName] = useState(initialName || "");
  const [level, setLevel] = useState(() => {
    const n = Number(initialLevel);
    return n >= 1 && n <= 5 ? Math.floor(n) : 1;
  });
  const [step, setStep] = useState(0); // 0 = how it works, 1 = make it yours, 2 = first plan
  const meta = LEVEL_META[level];
  const share = levelShares(meta.hint);
  const last = step === 2;

  const finish = () => onStart(name.trim(), level);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && step < 2) setStep(step + 1);
      else if (e.key === "Enter" && step === 2) finish();
      else if (e.key === "ArrowRight" && step < 2) setStep(step + 1);
      else if (e.key === "ArrowLeft" && step > 0) setStep(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, name, level]);

  return (
    <div className="ob-page" role="dialog" aria-modal="true" aria-label="Welcome to StudyBuddy">
      {/* TEMP: onboarding theme-peek â€” lets the user flip day/night right here. Remove once a real in-app theme picker ships. */}
      {onToggleTheme && (
        <button
          className="ob-theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === "night" ? "Switch to day mode" : "Switch to night mode"}
          title={theme === "night" ? "Day mode" : "Night mode"}
        >
          {theme === "night" ? <LuSun size={20} /> : <LuMoon size={20} />}
        </button>
      )}
      <div className="ob-shell">
        {/* ------- left panel: steps 1 & 3 share it; step 2 recolours via .ob-panel--lime ------- */}
        <div className={"ob-panel" + (step === 1 ? " ob-panel-center" : "") + (step === 2 ? " ob-panel-center" : "")}>
          {step === 0 && (
            <>
              <p className="ob-eyebrow">STEP 1 OF 3</p>
              <h1 className="ob-headline">Let&rsquo;s get you started.</h1>
              <p className="ob-sub">Four things make StudyBuddy work.</p>
              <ul className="ob-method">
                {METHOD.map((m) => (
                  <li key={m.title} className="ob-method-card">
                    <span className="ob-method-icon">
                      {m.art === "stairs" ? <StairsIcon size={30} /> : m.art === "learn" ? <MagnifierIcon size={30} /> : m.art === "checklist" ? <ChecklistIcon size={30} /> : m.art === "target" ? <TargetIcon size={30} /> : null}
                    </span>
                    <span className="ob-method-text">
                      <b>{m.title}</b>
                      <span>{m.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {step === 1 && (
            <>
              <p className="ob-eyebrow">STEP 2 OF 3</p>
              <h1 className="ob-headline">A quick setup.</h1>
              <p className="ob-sub">Make it fit your day.</p>
            </>
          )}
          {step === 2 && (
            <>
              <p className="ob-eyebrow">STEP 3 OF 3</p>
              <h1 className="ob-headline">Your first plan.</h1>
              <p className="ob-sub">This is where your first climb begins.</p>
            </>
          )}
        </div>

        {/* ------- right panel ------- */}
        <div className="ob-main">
          {step === 0 && (
            <div className="ob-main-inner">
              <h2 className="ob-title">How it works</h2>
              <p className="ob-lede">
                Learn something, practise it, then fix what you missed. Your plan adjusts each day.
              </p>
              <div className="ob-card ob-rows-card">
                <div className="ob-row">
                  <span className="ob-row-label">Lessons</span>
                  <span className="ob-chip">unlocked step by step</span>
                </div>
                <div className="ob-row">
                  <span className="ob-row-label">Terms</span>
                  <span className="ob-chip">5 a day</span>
                </div>
                <div className="ob-row">
                  <span className="ob-row-label">Quizzes</span>
                  <span className="ob-chip">short sets</span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="ob-main-inner">
              <h2 className="ob-title">Make it yours</h2>
              <p className="ob-field-label" htmlFor="ob-name">WHAT SHOULD WE CALL YOU?</p>
              <input
                id="ob-name"
                className="ob-input"
                type="text"
                placeholder="First name"
                maxLength={24}
                autoCapitalize="words"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="ob-field-label" style={{ marginTop: 26 }}>PICK YOUR PACE</p>
              <div className="ob-levels" role="group" aria-label="Study level">
                {LEVELS.map((lv) => (
                  <button
                    key={lv.key}
                    className={"ob-level" + (level === lv.key ? " selected" : "")}
                    aria-pressed={level === lv.key}
                    onClick={() => setLevel(lv.key)}
                  >
                    <span className="ob-level-badge">{lv.key}</span>
                    <span className="ob-level-body">
                      <span className="ob-level-name">
                        {lv.name}
                        {level === lv.key && <LuCheck size={16} strokeWidth={3} className="ob-goal-check" />}
                      </span>
                      <span className="ob-level-blurb">{lv.blurb}</span>
                    </span>
                    <span className="ob-level-hint">~{lv.hint}<small> min</small></span>
                  </button>
                ))}
              </div>
              <p className="ob-hint">
                Fixed steps every day, wider pace at higher levels. You can change this any time in Settings.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="ob-main-inner">
              <h2 className="ob-title">Ready when you are</h2>
              <div className="ob-today-card">
                <span className="ob-today-label">Today&rsquo;s plan &middot; Level {meta.key} {meta.name}</span>
                <span className="ob-today-mins">~{meta.hint} min</span>
                <span className="ob-today-sub">Learn &rarr; Stairs &rarr; {meta.glossaryTerms} terms &rarr; quiz &rarr; fix mistakes</span>
              </div>
              <div className="ob-card ob-rows-card ob-plan-rows">
                <div className="ob-row">
                  <span className="ob-row-label">Learn a lesson</span>
                  <span className="ob-chip">{share.learn} min</span>
                </div>
                <div className="ob-row">
                  <span className="ob-row-label">Climb the Stairs (same lesson)</span>
                  <span className="ob-chip">{share.stairs} min</span>
                </div>
                <div className="ob-row">
                  <span className="ob-row-label">Discover {meta.glossaryTerms} new terms</span>
                  <span className="ob-chip">{share.glossary} min</span>
                </div>
                <div className="ob-row">
                  <span className="ob-row-label">Practice quiz &mdash; {meta.quizSession} questions</span>
                  <span className="ob-chip">{share.quiz} min</span>
                </div>
                <div className="ob-row">
                  <span className="ob-row-label">{level >= 5 ? "Fix mistakes + mock exam" : level >= 4 ? "Fix mistakes + past paper" : "Fix your mistakes"}</span>
                  <span className="ob-chip">{share.final} min</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ------- footer ------- */}
        <div className="ob-footer">
          <div className="ob-footer-left">
            {step > 0 && (
              <button className="ob-back" onClick={() => setStep(step - 1)}>
                <LuArrowLeft size={18} strokeWidth={2.5} /> Back
              </button>
            )}
          </div>
          <div className="ob-footer-right">
            {step > 0 && <button className="ob-later" onClick={onSkip}>Set later</button>}
            {last ? (
              <button className="ob-cta" onClick={finish}>
                Start learning <LuArrowRight size={19} strokeWidth={2.75} />
              </button>
            ) : (
              <button className="ob-cta" onClick={() => setStep(step + 1)} autoFocus={step === 0}>
                Next <LuArrowRight size={19} strokeWidth={2.75} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
