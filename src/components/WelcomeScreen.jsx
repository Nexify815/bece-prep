import { useState, useEffect } from "react";
import { LuArrowRight, LuArrowLeft, LuCheck, LuSun, LuMoon } from "react-icons/lu";
import { LEVEL_META, levelShares } from "../lib/plan.js";

// The stairs glyph as a bold, filled "chunky blocks" mark in the spirit of
// the reference apps: solid brand-green steps, rounded corners, no strokes.
// Themed via CSS (`currentColor`) and presented on a white squircle.
function StairsIcon({ size = 26 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="ob-stairs-glyph"
    >
      <rect x="2" y="17.1" width="8.6" height="4.5" rx="2.25" fill="currentColor" />
      <rect x="7.7" y="10.9" width="8.6" height="4.5" rx="2.25" fill="currentColor" />
      <rect x="13.4" y="4.7" width="8.6" height="4.5" rx="2.25" fill="currentColor" />
    </svg>
  );
}

// The stairs levels. Names + hint minutes + what a day actually contains at
// each pace — the onboarding picks one; the rest of the app reads the same
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

// Chunky filled magnifying glass for the "Learn the words" card, drawn in the
// same solid block language as the stairs glyph. No strokes — filled
// geometry only, a filled ring for the lens and a rotated rounded bar for
// the handle.
function LearnIcon({ size = 30 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="ob-stairs-glyph"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.3 2.8a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2Zm0 4.3a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Z"
        fill="currentColor"
      />
      <rect x="15.3" y="15.3" width="7.9" height="3.5" rx="1.75" transform="rotate(45 15.3 15.3)" fill="currentColor" />
    </svg>
  );
}

// Chunky filled checklist for the "Then test yourself" card — same solid,
// stroke-free geometry: two blocky checks, each followed by a rounded bar
// (top one longer), all in `currentColor`.
function ChecklistIcon({ size = 30 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="ob-stairs-glyph"
    >
      <path d="M2.3 8.4 L4.6 10.7 L9.6 5.7 L8.3 4.4 L4.6 8.1 L3.6 7.1 Z" fill="currentColor" />
      <path d="M2.3 15.9 L4.6 18.2 L9.6 13.2 L8.3 11.9 L4.6 15.6 L3.6 14.6 Z" fill="currentColor" />
      <rect x="12.1" y="6.2" width="9.4" height="2.9" rx="1.45" fill="currentColor" />
      <rect x="12.1" y="13.7" width="6.5" height="2.9" rx="1.45" fill="currentColor" />
    </svg>
  );
}

// Chunky filled bullseye for the "Fix what you missed" card — a solid
// annulus with a filled core dot, `currentColor`, no enclosure.
function TargetIcon({ size = 30 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="ob-stairs-glyph"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2Zm0 5.5a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

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
      {/* TEMP: onboarding theme-peek — lets the user flip day/night right here. Remove once a real in-app theme picker ships. */}
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
                      {m.art === "stairs" ? <StairsIcon size={30} /> : m.art === "learn" ? <LearnIcon size={30} /> : m.art === "checklist" ? <ChecklistIcon size={30} /> : m.art === "target" ? <TargetIcon size={30} /> : null}
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
