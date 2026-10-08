import {
  FiClipboard, FiFileText, FiAward, FiRefreshCw, FiLock, FiChevronRight, FiHelpCircle,
} from "react-icons/fi";
import { LuGraduationCap, LuCloud, LuTrophy, LuTrendingUp } from "react-icons/lu";
import { navigate } from "../lib/router.js";
import { isLightDay } from "../lib/plan.js";

export default function MoreScreen() {
  const lightDay = isLightDay();

  const practice = [
    { key: "mock", Icon: FiClipboard, label: "Mock Exam", sub: "Full timed paper", route: "/mock-exam", locked: !lightDay },
    { key: "papers", Icon: FiFileText, label: "Past Papers", sub: "Real BECE questions", route: "/past-papers", locked: !lightDay },
    { key: "sprint", Icon: FiAward, label: "Study Sprint", sub: "10 minutes, full focus", route: "/sprint", locked: !lightDay },
    { key: "review", Icon: FiRefreshCw, label: "Review Mistakes", sub: "Fix what you got wrong", route: "/review", locked: !lightDay },
  ];

  const always = [
    { key: "exam", Icon: LuGraduationCap, label: "Exam Mode", sub: "Cram without hearts or XP", route: "/exam" },
    { key: "board", Icon: LuTrophy, label: "Leaderboard", sub: "See how you rank", route: "/leaderboard" },
    { key: "progress", Icon: LuTrendingUp, label: "Progress Report", sub: "Your full history", route: "/progress" },
    { key: "backup", Icon: LuCloud, label: "Backup", sub: "Keep a copy of progress", route: "/backup" },
    { key: "help", Icon: FiHelpCircle, label: "Help", sub: "How the app works", route: "/help" },
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
          {i.locked && <FiLock size={12} className="quick-lock" />}
        </span>
        <span className="more-body">
          <span className="more-label">{i.label}</span>
          <span className="more-sub">{i.locked ? "Opens Saturday" : i.sub}</span>
        </span>
        <FiChevronRight size={18} className="quick-card-chev" />
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