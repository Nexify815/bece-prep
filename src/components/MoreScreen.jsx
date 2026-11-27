import { useEffect } from "react";
import {
  LuClipboardCheck, LuFileText, LuAward, LuRefreshCw, LuLock, LuChevronRight,
  LuGraduationCap, LuTrophy, LuChartColumnIncreasing, LuCloud, LuCircleHelp, LuEye,
} from "react-icons/lu";
import { navigate } from "../lib/router.js";
import { isLightDay } from "../lib/plan.js";
import { previewAll } from "../lib/dev.js";

export default function MoreScreen() {
  // Temporary: the Settings "Preview locked screens" toggle opens the
  // day-gated practice screens on a weekday so they can be reviewed.
  const preview = previewAll();
  const lightDay = isLightDay() || preview;

  const practice = [
    { key: "mock", Icon: LuClipboardCheck, label: "Mock Exam", sub: "Full timed paper", route: "/mock-exam", locked: !lightDay },
    { key: "papers", Icon: LuFileText, label: "Past Papers", sub: "Real BECE questions", route: "/past-papers", locked: !lightDay },
    { key: "sprint", Icon: LuAward, label: "Study Sprint", sub: "10 minutes, full focus", route: "/sprint", locked: !lightDay },
    { key: "review", Icon: LuRefreshCw, label: "Review Mistakes", sub: "Fix what you got wrong", route: "/review", locked: !lightDay },
  ];

  const always = [
    { key: "exam", Icon: LuGraduationCap, label: "Exam Mode", sub: "Cram without hearts or XP", route: "/exam" },
    { key: "board", Icon: LuTrophy, label: "Leaderboard", sub: "See how you rank", route: "/leaderboard" },
    { key: "progress", Icon: LuChartColumnIncreasing, label: "Progress Report", sub: "Your full history", route: "/progress" },
    { key: "backup", Icon: LuCloud, label: "Backup", sub: "Keep a copy of progress", route: "/backup" },
    { key: "help", Icon: LuCircleHelp, label: "Help", sub: "How the app works", route: "/help" },
  ];

  useEffect(() => {
    document.documentElement.classList.add("more-route");
    return () => document.documentElement.classList.remove("more-route");
  }, []);

  return (
    <div className="mo-page">
      {preview && (
        <div className="mo-preview">
          <LuEye size={16} />
          <span>
            <strong>Preview on</strong> &mdash; day-locked items are open. Turn it
            off in Settings when you&rsquo;re done.
          </span>
        </div>
      )}

      <section className="mo-section">
        <h2>Practice</h2>
        <div className="mo-tiles">
          {practice.map((i) => (
            <button
              key={i.key}
              className={"mo-tile mo-tile-" + i.key + (i.locked ? " is-locked" : "")}
              onClick={() => {
                if (i.locked) return;
                navigate(i.route);
              }}
            >
              <span className="mo-tile-ico">
                <i.Icon size={28} strokeWidth={2.6} />
                {i.locked && (
                  <span className="mo-lock" aria-hidden="true"><LuLock size={14} /></span>
                )}
              </span>
              <b>{i.label}</b>
              <span className="mo-chip">
                {i.locked && <LuLock size={14} />}
                {i.locked ? "Opens Saturday" : i.sub}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mo-section">
        <h2>Everything else</h2>
        <button className="mo-feat" onClick={() => navigate("/exam")}>
          <span className="mo-bub mo-bub-a" aria-hidden="true" />
          <span className="mo-bub mo-bub-b" aria-hidden="true" />
          <span className="mo-feat-ico" aria-hidden="true"><LuGraduationCap size={30} /></span>
          <span className="mo-feat-body">
            <b>Exam Mode</b>
            <small>Cram without hearts or XP</small>
          </span>
          <span className="mo-go" aria-hidden="true"><LuChevronRight size={20} strokeWidth={3.5} /></span>
        </button>

        <div className="mo-rows">
          {always.slice(1).map((i) => (
            <button key={i.key} className={"mo-row mo-row-" + i.key} onClick={() => navigate(i.route)}>
              <span className="mo-row-ico" aria-hidden="true"><i.Icon size={26} /></span>
              <span className="mo-row-body">
                <b>{i.label}</b>
                <small>{i.sub}</small>
              </span>
              <LuChevronRight size={20} strokeWidth={3.5} className="mo-chev" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
