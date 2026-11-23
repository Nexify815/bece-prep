import { navigate } from "../lib/router.js";
import { TileIcon } from "./Tile.jsx";

// White glyphs drawn on the gradient tiles (same language as the plan page).
const TABS = [
  {
    key: "home",
    hash: "/home",
    label: "Home",
    tone: "orange",
    art: <path fill="#fff" d="M3 11l9-8 9 8v9H3z" />,
  },
  {
    key: "plan",
    hash: "/",
    label: "Plan",
    tone: "green",
    art: <rect x="3" y="5" width="18" height="16" rx="3" fill="#fff" />,
  },
  {
    key: "shop",
    hash: "/store",
    label: "Shop",
    tone: "red",
    art: <path fill="#fff" d="M5 8h14l-1 13H6z" />,
  },
  {
    key: "progress",
    hash: "/progress",
    label: "Progress",
    tone: "blue",
    art: (
      <g fill="#fff">
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="6" width="4" height="14" rx="1" />
        <rect x="16" y="9" width="4" height="11" rx="1" />
      </g>
    ),
  },
  {
    key: "settings",
    hash: "/settings",
    label: "Settings",
    tone: "purple",
    art: <circle cx="12" cy="12" r="6" fill="none" stroke="#fff" strokeWidth="4" />,
  },
  {
    key: "more",
    hash: "/more",
    label: "More",
    tone: "slate",
    art: (
      <g fill="#fff">
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
      </g>
    ),
  },
];

const FOOT_TABS = [
  {
    key: "exam",
    hash: "/exam",
    label: "Exam mode",
    tone: "indigo",
    art: <path fill="#fff" d="M12 4l10 5-10 5L2 9zM6 13v4c0 2 12 2 12 0v-4l-6 3z" />,
  },
  {
    key: "backup",
    hash: "/backup",
    label: "Backup",
    tone: "sky",
    art: <path fill="#fff" d="M7 18a4 4 0 010-8 5 5 0 019-1 4 4 0 011 9z" />,
  },
];

function activeKey(parts) {
  const key = parts[0] || "";
  if (key === "") return "plan";
  if (["home", "store", "progress", "settings", "more", "exam", "backup"].includes(key)) return key;
  return "";
}

function RailTab({ tab, active }) {
  return (
    <button
      className={"rail-tab" + (tab.key === active ? " active" : "")}
      aria-current={tab.key === active ? "page" : undefined}
      onClick={() => navigate(tab.hash)}
    >
      <TileIcon tone={tab.tone}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {tab.art}
        </svg>
      </TileIcon>
      <span className="rail-label">{tab.label}</span>
    </button>
  );
}

// Desktop-only persistent navigation rail. Mobile keeps the bottom tab bar;
// this is what makes the desktop layout a different shell rather than a
// stretched phone column.
export default function DesktopRail({ parts }) {
  const active = activeKey(parts);

  return (
    <nav className="desktop-rail">
      <button className="rail-brand" onClick={() => navigate("/")}>
        <TileIcon tone="green" className="rail-brand-tile">S</TileIcon>
        <span>StudyBuddy</span>
      </button>

      <div className="rail-tabs">
        {TABS.map((t) => (
          <RailTab key={t.key} tab={t} active={active} />
        ))}
      </div>

      <div className="rail-foot">
        {FOOT_TABS.map((t) => (
          <RailTab key={t.key} tab={t} active={active} />
        ))}
      </div>
    </nav>
  );
}
