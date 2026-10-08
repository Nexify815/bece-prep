import { FiHome, FiCalendar, FiShoppingBag, FiBarChart2, FiSettings, FiHelpCircle } from "react-icons/fi";
import { LuGraduationCap, LuCloud } from "react-icons/lu";
import { navigate } from "../lib/router.js";
import Mascot from "./Mascot.jsx";

const TABS = [
  { key: "home", hash: "/home", label: "Home", Icon: FiHome },
  { key: "plan", hash: "/", label: "Plan", Icon: FiCalendar },
  { key: "shop", hash: "/store", label: "Shop", Icon: FiShoppingBag },
  { key: "progress", hash: "/progress", label: "Progress", Icon: FiBarChart2 },
  { key: "settings", hash: "/settings", label: "Settings", Icon: FiSettings },
];

function activeKey(parts) {
  const key = parts[0] || "";
  if (key === "") return "plan";
  if (["home", "store", "progress", "settings"].includes(key)) return key;
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
            <t.Icon size={20} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="rail-foot">
        <button className="rail-tab" onClick={() => navigate("/exam")}>
          <LuGraduationCap size={20} />
          <span>Exam Mode</span>
        </button>
        <button className="rail-tab" onClick={() => navigate("/backup")}>
          <LuCloud size={20} />
          <span>Backup</span>
        </button>
        <button className="rail-tab" onClick={() => navigate("/help")}>
          <FiHelpCircle size={20} />
          <span>Help</span>
        </button>
      </div>
    </nav>
  );
}