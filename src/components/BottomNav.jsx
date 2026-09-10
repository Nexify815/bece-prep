import { FiHome, FiCalendar, FiShoppingBag, FiBarChart2, FiSettings } from "react-icons/fi";
import { navigate } from "../lib/router.js";

const TABS = [
  { key: "home", hash: "/home", label: "Home", Icon: FiHome },
  { key: "plan", hash: "/", label: "Plan", Icon: FiCalendar },
  { key: "shop", hash: "/store", label: "Shop", Icon: FiShoppingBag },
  { key: "progress", hash: "/progress", label: "Progress", Icon: FiBarChart2 },
  { key: "settings", hash: "/settings", label: "Settings", Icon: FiSettings },
];

export default function BottomNav({ parts }) {
  // "" (root route) is the Plan landing; anything not a tab keeps Home lit.
  const key = parts[0] || "";
  let active;
  if (key === "") active = "plan";
  else if (["home", "store", "progress", "settings"].includes(key)) active = key;
  else active = "home";

  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={"bottom-nav-item" + (t.key === active ? " active" : "")}
          onClick={() => navigate(t.hash)}
        >
          <span className="nav-icon">
            <t.Icon size={20} />
          </span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}