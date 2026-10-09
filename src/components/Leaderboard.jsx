import { useState, useEffect } from "react";
import { LuTrophy, LuCrown } from "react-icons/lu";
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

  const top = rows ? rows.slice(0, 3) : [];
  const rest = rows ? rows.slice(3) : [];

  return (
    <div className="board-page">
      <div className="board-hero">
        <LuTrophy size={30} color="#fff" />
        <div>
          <h1>Leaderboard</h1>
          <p>The more XP you earn, the higher you climb.</p>
        </div>
        {me && (
          <div className="board-hero-me">
            <span>{me.xp}</span>
            <small>
              {rows && rows.length > 0
                ? myRank >= 0
                  ? `Rank #${myRank + 1}`
                  : "Unranked"
                : `${myWeek} XP this week`}
            </small>
          </div>
        )}
      </div>

      {blocked && (
        <div className="empty-card">
          <span className="empty-card-icon">
            <LuTrophy size={26} color="#F97316" />
          </span>
          <h2>Leaderboard isn&rsquo;t connected yet</h2>
          <p className="muted">
            Ask your teacher or parent to switch it on in the Firebase rules.
          </p>
        </div>
      )}

      {rows === null && !blocked && <p className="muted center">Loading the leaderboardâ€¦</p>}

      {rows && rows.length === 0 && !blocked && (
        <div className="empty-card">
          <span className="empty-card-icon">
            <LuTrophy size={26} color="#14B8A6" />
          </span>
          <h2>No scores posted yet</h2>
          <p className="muted">
            Opt in from Settings and play a bit â€” your XP will appear here.
          </p>
          <button
            className="focus-btn"
            onClick={() => (window.location.hash = "/settings")}
          >
            Open settings
          </button>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="board-podium">
            {[1, 0, 2].map((idx) => {
              const r = top[idx];
              if (!r) return <div key={idx} className="board-podium-slot" />;
              const place = idx + 1;
              const mine = me && r.uid === account?.uid;
              return (
                <div
                  key={r.uid || idx}
                  className={"board-podium-slot place-" + place + (mine ? " mine" : "")}
                >
                  <div className="board-medal">
                    {place === 1 ? <LuCrown size={22} color="#CA8A04" /> : place}
                  </div>
                  <div className="board-podium-name">{r.name}</div>
                  <div className="board-podium-xp">{r.xp} XP</div>
                </div>
              );
            })}
          </div>

          <div className="leader-list">
            {rest.map((r, i) => {
              const mine = me && r.uid === account?.uid;
              return (
                <div key={r.uid || i} className={"leader-row" + (mine ? " mine" : "")}>
                  <span className="leader-rank">{i + 4}</span>
                  <span className="leader-name">{r.name}</span>
                  <span className="leader-xp">{r.xp} XP</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
