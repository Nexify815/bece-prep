import { pastDays } from "../lib/dates.js";

// 30-day XP heatmap. Simple grid of day cells shaded by XP earned.
export default function Heatmap({ xpLog }) {
  const days = pastDays(30);
  const max = Math.max(1, ...days.map((d) => xpLog[d] || 0));

  const shade = (xp) => {
    if (!xp) return "0";
    const r = Math.min(1, xp / max);
    return r < 0.25 ? "1" : r < 0.5 ? "2" : r < 0.9 ? "3" : "4";
  };

  return (
    <div className="heatmap">
      {days.map((d) => {
        const xp = xpLog[d] || 0;
        return (
          <div
            key={d}
            className={"heatmap-cell heat-" + shade(xp)}
            title={d + (xp ? ` — ${xp} XP` : " — no study")}
          />
        );
      })}
      <span className="heatmap-label">
        <b>Last 30 days:</b> {days.reduce((a, d) => a + (xpLog[d] || 0), 0)} XP in{" "}
        {days.filter((d) => xpLog[d] > 0).length} active days
      </span>
    </div>
  );
}