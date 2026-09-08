import { useState, useEffect } from "react";
import { watchLeaderboard } from "../lib/firebase.js";
import { weeklyXp } from "../lib/challenges.js";

export default function Leaderboard({ state, account }) {
  const [rows, setRows] = useState(null); // null = loading / unavailable
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    const timer = setTimeout(() => {
      unsub = watchLeaderboard(
        (snap) => {
          const data = snap.val() || {};
          setRows(
            Object.values(data)
              .filter((e) => e && typeof e.xp === "number")
              .sort((a, b) => b.xp - a.xp)
              .slice(0, 20)
          );
        },
        () => setBlocked(true)
      );
    }, 0);
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const myWeek = weeklyXp(state.xpLog || {});
  const me = account ? { name: state.nickname || account.username, xp: state.xp } : null;
  const myRank = rows ? rows.findIndex((r) => r.uid === account?.uid) : -1;

  return (
    <div>
      <div className="section-title">Leaderboard</div>
      <p className="muted">
        Weekly pride of the class &mdash; the more XP you earn, the higher you climb.
      </p>

      {me && (
        <div className="card mt leaderboard-you">
          <span className="leader-you-name">{me.name}</span>
          <span className="leader-you-xp">{me.xp} XP</span>
          <span className="muted">
            {rows && rows.length > 0
              ? myRank >= 0 ? `Rank #${myRank + 1}` : "Not ranked this week yet"
              : "Your device: " + myWeek + " XP this week"}
          </span>
        </div>
      )}

      <div className="spacer" />

      {blocked && (
        <div className="card mt leaderboard-off">
          <p className="muted">
            The shared leaderboard isn&rsquo;t connected yet &mdash; ask your teacher
            or parent to switch it on in the Firebase rules.
          </p>
          <pre className="rules-snippet">{
`"leaderboard": {
  ".read": "auth != null",
  ".write": "auth != null"
}`
          }</pre>
        </div>
      )}

      {rows === null && !blocked && <p className="muted">Loading the leaderboard&hellip;</p>}
      {rows && rows.length === 0 && !blocked && (
        <p className="muted">
          No scores posted yet. Opt in from Settings and play a bit &mdash; your
          XP will appear here.
        </p>
      )}

      {rows && rows.length > 0 && (
        <div className="leader-list">
          {rows.map((r, i) => {
            const mine = me && r.uid === account?.uid;
            return (
              <div key={r.uid || i} className={"leader-row" + (mine ? " mine" : "")}>
                <span className="leader-rank">{i < 3 ? "\u{1F3C6}" : i + 1}</span>
                <span className="leader-name">{r.name}</span>
                <span className="leader-xp">{r.xp} XP</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="spacer" />
      <button className="btn btn-secondary" onClick={() => (window.location.hash = "/")}>
        Back home
      </button>
    </div>
  );
}