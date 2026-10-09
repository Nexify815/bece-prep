import { navigate } from "../lib/router.js";
import Mascot from "./Mascot.jsx";
import { TAB_ICON, LuGraduationCap, LuCloud, LuCircleHelp } from "./icons.jsx";

const TABS = [
  { key: "home", hash: "/home", label: "Home", Icon: TAB_ICON.home, color: "#EF4444" },
  { key: "plan", hash: "/", label: "Plan", Icon: TAB_ICON.plan, color: "#3B82F6" },
  { key: "shop", hash: "/store", label: "Shop", Icon: TAB_ICON.shop, color: "#F59E0B" },
  { key: "progress", hash: "/progress", label: "Progress", Icon: TAB_ICON.progress, color: "#A855F7" },
  { key: "settings", hash: "/settings", label: "Settings", Icon: TAB_ICON.settings, color: "#6B7280" },
  { key: "more", hash: "/more", label: "More", Icon: TAB_ICON.more, color: "#EC4899" },
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
        <Mascot size={26} />
        <span>StudyBuddy</span>
      </button>

      <div className="rail-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"rail-tab" + (t.key === active ? " active" : "")}
            onClick={() => navigate(t.hash)}
          >
            <span className="rail-art" style={{ color: t.key === active ? "#0369A1" : t.color }}>
              <t.Icon size={20} />
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="rail-foot">
        <button className="rail-tab" onClick={() => navigate("/exam")}>
          <span className="rail-art" style={{ color: "#F97316" }}><LuGraduationCap size={20} /></span>
          <span>Exam Mode</span>
        </button>
        <button className="rail-tab" onClick={() => navigate("/backup")}>
          <span className="rail-art" style={{ color: "#0EA5E9" }}><LuCloud size={20} /></span>
          <span>Backup</span>
        </button>
        <button className="rail-tab" onClick={() => navigate("/help")}>
          <span className="rail-art" style={{ color: "#6B7280" }}><LuCircleHelp size={20} /></span>
          <span>Help</span>
        </button>
      </div>
    </nav>
  );
}