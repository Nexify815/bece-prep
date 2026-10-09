import {
  LuClipboard, LuFileText, LuAward, LuRefreshCw, LuLock, LuChevronRight, LuCircleHelp,
} from "react-icons/lu";
import { LuGraduationCap, LuCloud, LuTrophy, LuTrendingUp } from "react-icons/lu";
import { navigate } from "../lib/router.js";
import { isLightDay } from "../lib/plan.js";
import { previewAll } from "../lib/dev.js";

export default function MoreScreen() {
  // Temporary: the Settings "Preview locked screens" toggle opens the
  // day-gated practice screens on a weekday so they can be reviewed.
  const preview = previewAll();
  const lightDay = isLightDay() || preview;

  const practice = [
    { key: "mock", Icon: LuClipboard, label: "Mock Exam", sub: "Full timed paper", route: "/mock-exam", locked: !lightDay },
    { key: "papers", Icon: LuFileText, label: "Past Papers", sub: "Real BECE questions", route: "/past-papers", locked: !lightDay },
    { key: "sprint", Icon: LuAward, label: "Study Sprint", sub: "10 minutes, full focus", route: "/sprint", locked: !lightDay },
    { key: "review", Icon: LuRefreshCw, label: "Review Mistakes", sub: "Fix what you got wrong", route: "/review", locked: !lightDay },
  ];

  const always = [
    { key: "exam", Icon: LuGraduationCap, label: "Exam Mode", sub: "Cram without hearts or XP", route: "/exam" },
    { key: "board", Icon: LuTrophy, label: "Leaderboard", sub: "See how you rank", route: "/leaderboard" },
    { key: "progress", Icon: LuTrendingUp, label: "Progress Report", sub: "Your full history", route: "/progress" },
    { key: "backup", Icon: LuCloud, label: "Backup", sub: "Keep a copy of progress", route: "/backup" },
    { key: "help", Icon: LuCircleHelp, label: "Help", sub: "How the app works", route: "/help" },
  ];

  const Row = ({ items }) =>
    items.map((i) => (
      <button
        key={i.key}
        className={"more-card" + (i.locked ? " locked" : "")}
        onClick={() => {
          if (i.locked) return;
          navigate(i.route);
        }}
      >
        <span className="more-icon">
          <i.Icon size={22} />
          {i.locked && <LuLock size={12} className="quick-lock" />}
        </span>
        <span className="more-body">
          <span className="more-label">{i.label}</span>
          <span className="more-sub">{i.locked ? "Opens Saturday" : i.sub}</span>
        </span>
        <LuChevronRight size={18} className="quick-card-chev" />
      </button>
    ));

  return (
    <div className="more-page">
      <div className="more-head">
        <h1 className="section-title" style={{ margin: 0 }}>More</h1>
        <p className="muted">Everything else in one place.</p>
      </div>

      <div className="more-group">
        <div className="more-group-title">Practice</div>
        {Row({ items: practice })}
      </div>

      <div className="more-group">
        <div className="more-group-title">Everything else</div>
        {Row({ items: always })}
      </div>
    </div>
  );
}