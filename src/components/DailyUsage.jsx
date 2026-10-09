import { LuClock } from "react-icons/lu";
import { todayKey } from "../lib/storage.js";

function fmtDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[date.getDay()];
}

export default function DailyUsage({ usageSecs, goalSecs, streak = 0 }) {
  const goalMinutes = Math.round((goalSecs || 60 * 60) / 60);
  const today = todayKey();
  const todayS = usageSecs[today] || 0;
  const todayMin = Math.floor(todayS / 60);
  const pct = Math.min(100, (todayMin / goalMinutes) * 100);
  const done = todayMin >= goalMinutes;

  // last 7 days (oldest -> newest) for a mini history
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ key, secs: usageSecs[key] || 0 });
  }

  return (
    <div className="card usage-card">
      <div className="usage-head">
        <span className="usage-title">
          <LuClock size={16} /> Daily goal
        </span>
        <span className={"usage-status" + (done ? " done" : "")}>
          {done ? "Goal reached!" : `${todayMin}/${goalMinutes} mins — keep going`}
        </span>
      </div>

      <p className="usage-streak-line">
        {streak > 0
          ? `${streak} day streak${done ? " — secured!" : " — finish your goal to keep it"}`
          : done
          ? "Goal met today — start a streak tomorrow!"
          : "Any lesson today starts your streak."}
      </p>

      <div className="usage-today">
        <span className="usage-today-num">{Math.floor(todayMin)}</span>
        <span className="usage-today-label">
          min / {goalMinutes} min ({pct.toFixed(0)}%)
        </span>
      </div>

      <div className="progress-bar usage-bar">
        <div className="progress-fill" style={{ width: pct + "%" }} />
      </div>

      <div className="usage-week">
        {days.map((day) => (
          <div key={day.key} className="usage-day">
            <div className="usage-day-label">{fmtDay(day.key)}</div>
            <div
              className={
                "usage-day-bar" +
                (day.secs / 60 >= goalMinutes ? " done" : "") +
                (day.key === today ? " today" : "")
              }
              style={{ height: Math.min(100, (day.secs / 60 / goalMinutes) * 100) + "%" }}
            />
            <div className="usage-day-min">{Math.floor(day.secs / 60)}m</div>
          </div>
        ))}
      </div>
    </div>
  );
}

