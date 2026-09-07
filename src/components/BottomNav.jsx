import { navigate } from "../lib/router.js";

const TABS = [
  { key: "home", hash: "/", label: "Home", icon: "\u{1F3E0}" },
  { key: "plan", hash: "/schedule", label: "Plan", icon: "\u{1F4C5}" },
  { key: "shop", hash: "/store", label: "Shop", icon: "\u{1F6D2}" },
  { key: "progress", hash: "/progress", label: "Progress", icon: "\u{1F4C8}" },
  { key: "settings", hash: "/settings", label: "Settings", icon: "\u2699\uFE0F" },
];

export default function BottomNav({ parts }) {
  const current = parts[0] || "home";
  const active = TABS.some((t) => t.hash === "/" + current) ? current : "home";

  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={"bottom-nav-item" + (t.key === active ? " active" : "")}
          onClick={() => navigate(t.hash)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}