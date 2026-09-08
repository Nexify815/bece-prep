import { useState, useEffect, useRef } from "react";
import { XP } from "../lib/XP.js";
import { todayKey } from "../lib/dates.js";
import { useSnack } from "./Snackbar.jsx";
import { playTick, playWin } from "../lib/sound.js";

const OPTIONS = [
  { mins: 10, xp: XP.sprint10, label: "10 min sprint" },
  { mins: 15, xp: XP.sprint15, label: "15 min power sprint" },
];

export default function SprintScreen({ onFinish }) {
  const snack = useSnack();
  const [selected, setSelected] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);

  const startSprint = (mins) => {
    setSelected(mins);
    setRemaining(mins * 60);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer.current);
          setRunning(false);
          snack("Sprint complete! \u{1F389}");
          playWin();
          onFinish(selected);
          return 0;
        }
        if (r <= 30) playTick();
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [running, selected]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="center sprint-screen">
      <div className="section-title">Study sprint</div>
      <p className="muted">
        Focus for one block of time. Any studying counts — quiz, stairs, papers, glossary.
      </p>

      {!running ? (
        <div className="sprint-options mt">
          {OPTIONS.map((o) => (
            <button key={o.mins} className="card sprint-card" onClick={() => startSprint(o.mins)}>
              <span className="sprint-time">&#9200; {o.mins} min</span>
              <span className="sprint-label">{o.label}</span>
              <span className="muted">+{o.xp} XP when you finish</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="sprint-running mt">
          <div className="sprint-countdown">{fmt(remaining)}</div>
          <p className="muted">Keep going — you&rsquo;ve got this!</p>
          <button
            className="btn btn-danger mt"
            onClick={() => {
              clearInterval(timer.current);
              setRunning(false);
              setSelected(null);
            }}
          >
            End early (no XP)
          </button>
        </div>
      )}
      {running && (
        <p className="muted hint mt center">Block out distractions and stay on this screen — the countdown keeps you on pace.</p>
      )}
      <p className="muted hint mt center">Today is {todayKey()}. Complete a sprint once a day for the streak badge.</p>
    </div>
  );
}