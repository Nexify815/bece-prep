// Store catalog — single source of truth for what the Shop sells.
// Every item is bought with XP (kept consistent with buy-a-life = XP.heartCost).

export const THEMES = [
  { key: "day", name: "Daylight", desc: "Bright and clean default theme.", price: 0, free: true },
  { key: "night", name: "Night", desc: "Easy on the eyes at night.", price: 300 },
  { key: "berry", name: "Berry", desc: "A warm purple twist.", price: 300 },
  { key: "ocean", name: "Ocean", desc: "Cool calming blues.", price: 300 },
];

// `icon` is a key into BOOST_ICON (icons.jsx) — the catalog stays free of
// components so this module stays plain data.
export const BOOSTS = [
  { key: "xp2x", name: "2x XP boost", icon: "zap", desc: "Doubles XP earned for your next 10 correct answers.", price: 100, qty: 10 },
  { key: "streakFreeze", name: "Streak freeze", icon: "snowflake", desc: "Keeps your day streak safe for one missed day.", price: 300 },
];

export const HEARTS_PACK = {
  key: "hearts",
  name: "Hearts",
  icon: "heart",
  amount: 3,
  price: 60,
};

export const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.key, t]));
export const BOOST_MAP = Object.fromEntries(BOOSTS.map((b) => [b.key, b]));

export function getTheme(key) {
  return THEME_MAP[key] || THEME_MAP.day;
}
