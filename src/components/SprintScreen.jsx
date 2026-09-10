import { useState, useEffect } from "react";
import { LuTimer } from "react-icons/lu";
import { XP } from "../lib/XP.js";
import { navigate } from "../lib/router.js";

const OPTIONS = [
  { mins: 10, xp: XP.sprint10, label: "10 min sprint" },
  { mins: 15, xp: XP.sprint15, label: "15 min power sprint" },
];

function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Sprint is just a picker + status screen now. The actual countdown lives on
// the TopBar chip so it keeps running wherever you study — quiz, stairs,
// glossary, papers. React hands the timer to App (start/cancel), so it
// survives navigation and rewards the full block on completion.
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
    return (
      <div className="center sprint-screen">
        <div className="section-title">Sprint running</div>
        <div className="sprint-countdown">{fmt(Math.ceil(leftMs / 1000))}</div>
        <p className="muted">
          You&rsquo;re on a {sprint.mins}-minute focus block. Study anywhere —
          the timer chip at the top keeps running on every screen.
        </p>
        <button className="btn btn-primary mt" onClick={() => navigate("/")}>
          Go study
        </button>
        <button className="btn btn-danger mt" onClick={onCancel}>
          Cancel sprint (no XP)
        </button>
      </div>
    );
  }

  return (
    <div className="center sprint-screen">
      <div className="section-title">Study sprint</div>
      <p className="muted">
        Set a focus block, then go study wherever you like — quiz, stairs,
        glossary, past papers. The timer keeps running in the top bar, and you
        earn the XP only if you ride out the full block.
      </p>

      <div className="sprint-options mt">
        {OPTIONS.map((o) => (
          <button key={o.mins} className="card sprint-card" onClick={() => onStart(o.mins)}>
            <span className="sprint-time"><LuTimer size={16} /> {o.mins} min</span>
            <span className="sprint-label">{o.label}</span>
            <span className="muted">+{o.xp} XP when you finish</span>
          </button>
        ))}
      </div>
      <p className="muted hint mt center">Finish one a day for the sprint streak badge.</p>
    </div>
  );
}