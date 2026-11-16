import { navigate } from "../lib/router.js";

const TABS = [
  { key: "home", hash: "/home", label: "Home", art: "🏠" },
  { key: "plan", hash: "/", label: "Plan", art: "📅" },
  { key: "shop", hash: "/store", label: "Shop", art: "🛍️" },
  { key: "progress", hash: "/progress", label: "Progress", art: "📊" },
  { key: "settings", hash: "/settings", label: "Settings", art: "⚙️" },
  { key: "more", hash: "/more", label: "More", art: "⋯" },
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
        <span className="rail-brand-art" aria-hidden="true">🐰</span>
        <span>StudyBuddy</span>
      </button>

      <div className="rail-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={"rail-tab" + (t.key === active ? " active" : "")}
            onClick={() => navigate(t.hash)}
          >
            <span className="rail-emoji" aria-hidden="true">{t.art}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="rail-foot">
        <button className="rail-tab" onClick={() => navigate("/exam")}>
          <span className="rail-emoji" aria-hidden="true">🎓</span>
          <span>Exam mode</span>
        </button>
        <button className="rail-tab" onClick={() => navigate("/backup")}>
          <span className="rail-emoji" aria-hidden="true">☁️</span>
          <span>Backup</span>
        </button>
      </div>
    </nav>
  );
}
