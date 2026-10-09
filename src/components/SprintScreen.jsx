import { useState, useEffect } from "react";
import { LuTimer } from "react-icons/lu";
import { XP } from "../lib/XP.js";
import { navigate } from "../lib/router.js";
import FocusLayout from "./FocusLayout.jsx";

const OPTIONS = [
  { mins: 10, xp: XP.sprint10, label: "10 min sprint" },
  { mins: 15, xp: XP.sprint15, label: "15 min power sprint" },
];

function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Sprint is now a Focus screen: one big timer and one clear action. The actual
// countdown also lives on the TopBar chip so it keeps running wherever you
// study â€” quiz, stairs, glossary, papers. React hands the timer to App
// (start/cancel), so it survives navigation and rewards the full block.
export default function SprintScreen({ sprint, onStart, onCancel }) {
  const [leftMs, setLeftMs] = useState(0);

  useEffect(() => {
    if (!sprint) {
      setLeftMs(0);
      return;
    }
    const tick = () => setLeftMs(Math.max(0, sprint.endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sprint?.endsAt]);

  if (sprint) {
    const totalSec = sprint.mins * 60;
    const leftSec = Math.ceil(leftMs / 1000);
    const pct = Math.max(0, Math.min(100, ((totalSec - leftSec) / totalSec) * 100));
    return (
      <FocusLayout
        title="Sprint running"
        count={sprint.mins + " min"}
        progress={pct}
        panel={
          <div className="focus-panel-card">
            <div className="focus-panel-title">Focus block</div>
            <div className="focus-panel-row">
              <span>Set for</span>
              <strong>{sprint.mins} min</strong>
            </div>
            <div className="focus-panel-row">
              <span>Earn</span>
              <strong>+{XP[sprint.mins === 15 ? "sprint15" : "sprint10"]} XP</strong>
            </div>
            <p className="focus-panel-note">
              The timer chip at the top keeps running on every screen. Ride out
              the full block to collect your XP.
            </p>
          </div>
        }
        actions={
          <>
            <button className="focus-btn" onClick={() => navigate("/")}>
              Go study
            </button>
            <button className="focus-link" onClick={onCancel}>
              Cancel sprint (no XP)
            </button>
          </>
        }
      >
        <div className="sprint-hero-timer">{fmt(leftSec)}</div>
        <p className="muted center">
          You&rsquo;re on a {sprint.mins}-minute focus block. Study anywhere &mdash;
          the timer chip at the top keeps running on every screen.
        </p>
      </FocusLayout>
    );
  }

  return (
    <FocusLayout
      title="Study sprint"
      count="pick a length"
      progress={0}
      panel={
        <div className="focus-panel-card">
          <div className="focus-panel-title">How sprints work</div>
          <p className="focus-panel-note">
            Set a focus block, then go study wherever you like. The timer keeps
            running in the top bar and you earn the XP only if you ride out the
            full block. Finish one a day for the sprint streak badge.
          </p>
        </div>
      }
      actions={null}
    >
      <p className="muted">
        Set a focus block, then go study &mdash; quiz, stairs, glossary, past
        papers. You&rsquo;ll earn the XP if you ride out the full block.
      </p>
      <div className="sprint-options">
        {OPTIONS.map((o) => (
          <button key={o.mins} className="sprint-pick" onClick={() => onStart(o.mins)}>
            <span className="sprint-pick-time">
              <LuTimer size={18} /> {o.mins} min
            </span>
            <span className="sprint-pick-label">{o.label}</span>
            <span className="sprint-pick-xp">+{o.xp} XP</span>
          </button>
        ))}
      </div>
    </FocusLayout>
  );
}
