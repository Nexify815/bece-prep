import { useEffect, useState } from "react";

export default function OutOfHearts({ onBack }) {
  const [ms, setMs] = useState(() => {
    // recompute from localStorage heartsUpdatedAt each mount
    try {
      const raw = localStorage.getItem("studybuddy.v1");
      const state = raw ? JSON.parse(raw) : null;
      const updated = state && state.heartsUpdatedAt ? state.heartsUpdatedAt : Date.now();
      const restoreMs = 20 * 60 * 1000;
      const elapsed = Date.now() - updated;
      const remaining = restoreMs - (elapsed % restoreMs);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 20 * 60 * 1000;
    }
  });

  useEffect(() => {
    const id = setInterval(() => setMs((m) => (m <= 1000 ? 0 : m - 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const countdown = `${m}:${String(s).padStart(2, "0")}`;

  return (
    <div className="center">
      <span className="mascot-big">&#128557;</span>
      <h2 className="results-title">Out of hearts!</h2>
      <p className="muted">
        You have no hearts left. You'll get one back in{" "}
        <strong>{countdown}</strong> (one every 20 minutes).
      </p>
      {onBack && (
        <button className="btn btn-secondary mt" onClick={onBack}>
          Go back
        </button>
      )}
    </div>
  );
}