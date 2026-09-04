// Store catalog — single source of truth for what the Shop sells.
// Every item is bought with XP (kept consistent with buy-a-life = 50 XP).

export const SKINS = [
  { key: "cat", name: "Cat", emoji: "\u{1F431}", happy: "\u{1F638}", desc: "Your friendly study cat.", price: 0, free: true },
  { key: "dog", name: "Dog", emoji: "\u{1F436}", happy: "\u{1F436}", desc: "A loyal study buddy.", price: 200 },
  { key: "fox", name: "Fox", emoji: "\u{1F98A}", happy: "\u{1F98A}", desc: "A clever little fox.", price: 250 },
  { key: "panda", name: "Panda", emoji: "\u{1F43C}", happy: "\u{1F43C}", desc: "Calm and cuddly.", price: 300 },
  { key: "owl", name: "Owl", emoji: "\u{1F989}", happy: "\u{1F989}", desc: "Wise study companion.", price: 350 },
  { key: "dino", name: "Dino", emoji: "\u{1F996}", happy: "\u{1F996}", desc: "Rawr! Study hard.", price: 400 },
  { key: "robot", name: "Robot", emoji: "\u{1F916}", happy: "\u{1F916}", desc: "Beep boop. Learn on.", price: 450 },
];

export const THEMES = [
  { key: "day", name: "Daylight", desc: "Bright and clean default theme.", price: 0, free: true },
  { key: "night", name: "Night", desc: "Easy on the eyes at night.", price: 300 },
  { key: "berry", name: "Berry", desc: "A warm purple twist.", price: 300 },
  { key: "ocean", name: "Ocean", desc: "Cool calming blues.", price: 300 },
];

export const BOOSTS = [
  { key: "xp2x", name: "2x XP boost", emoji: "\u{26A1}", desc: "Doubles XP earned for your next 10 correct answers.", price: 150, qty: 10 },
  { key: "streakFreeze", name: "Streak freeze", emoji: "\u{2744}\u{FE0F}", desc: "Keeps your day streak safe for one missed day.", price: 100 },
];

export const HEARTS_PACK = {
  key: "hearts",
  name: "Hearts",
  emoji: "\u{2764}\u{FE0F}",
  amount: 3,
  price: 60,
};

export const SKIN_MAP = Object.fromEntries(SKINS.map((s) => [s.key, s]));
export const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.key, t]));
export const BOOST_MAP = Object.fromEntries(BOOSTS.map((b) => [b.key, b]));

export function getSkin(key) {
  return SKIN_MAP[key] || SKIN_MAP.cat;
}

export function getTheme(key) {
  return THEME_MAP[key] || THEME_MAP.day;
}
