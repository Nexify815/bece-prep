// Store catalog — single source of truth for what the Shop sells.
// Every item is bought with XP (kept consistent with buy-a-life = 50 XP).

export const SKINS = [
  { key: "cat", name: "Cat", png: "normalcat", pngHappy: "happycat", desc: "Your friendly study cat.", price: 0, free: true },
  { key: "dog", name: "Dog", png: "dog", pngHappy: "dog", desc: "A loyal study buddy.", price: 200 },
  { key: "fox", name: "Fox", png: "fox", pngHappy: "fox", desc: "A clever little fox.", price: 250 },
  { key: "panda", name: "Panda", png: "panda", pngHappy: "panda", desc: "Calm and cuddly.", price: 300 },
  { key: "owl", name: "Owl", png: "owl", pngHappy: "owl", desc: "Wise study companion.", price: 350 },
  { key: "dino", name: "Dino", png: "dino", pngHappy: "dino", desc: "Rawr! Study hard.", price: 400 },
  { key: "robot", name: "Robot", png: "robot", pngHappy: "robot", desc: "Beep boop. Learn on.", price: 450 },
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
