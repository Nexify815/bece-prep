import { FiHome, FiCalendar, FiShoppingBag, FiBarChart2, FiSettings, FiMoreHorizontal } from "react-icons/fi";
import { navigate } from "../lib/router.js";
import Mascot from "./Mascot.jsx";

const TABS = [
  { key: "home", hash: "/home", label: "Home", Icon: FiHome, art: "\u{1F3E0}" },
  { key: "plan", hash: "/", label: "Plan", Icon: FiCalendar, art: "\u{1F4C5}" },
  { key: "shop", hash: "/store", label: "Shop", Icon: FiShoppingBag, art: "\u{1F6D2}" },
  { key: "progress", hash: "/progress", label: "Progress", Icon: FiBarChart2, art: "\u{1F4C8}" },
  { key: "settings", hash: "/settings", label: "Settings", Icon: FiSettings, art: "⚙️" },
  { key: "more", hash: "/more", label: "More", Icon: FiMoreHorizontal, art: "\u{1F4CE}" },
];

function activeKey(parts) {
  const key = parts[0] || "";
  if (key === "") return "plan";
  if (["home", "store", "progress", "settings", "more"].includes(key)) return key;
  return "";
}

// Desktop-only persistent navigation rail. Mobile keeps the bottom tab bar;
// this is what makes the desktop layout a different shell rather than a
// stretched phone column.
export default function DesktopRail({ parts }) {
  const active = activeKey(parts);

  return (
    <nav className="desktop-rail">
      <button className="rail-brand" onClick={() => navigate("/")}>
        <Mascot happy />
        <span>StudyBuddy</span>
      </button>

      <div className="rail-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"rail-tab" + (t.key === active ? " active" : "")}
            onClick={() => navigate(t.hash)}
          >
            <span className="rail-art" aria-hidden="true">{t.art}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="rail-foot">
        <button className="rail-tab" onClick={() => navigate("/exam")}>
          <span className="rail-art" aria-hidden="true">🎓</span>
          <span>Exam Mode</span>
        </button>
        <button className="rail-tab" onClick={() => navigate("/backup")}>
          <span className="rail-art" aria-hidden="true">☁️</span>
          <span>Backup</span>
        </button>
        <button className="rail-tab" onClick={() => navigate("/help")}>
          <span className="rail-art" aria-hidden="true">❓</span>
          <span>Help</span>
        </button>
      </div>
    </nav>
  );
}