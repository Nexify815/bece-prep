// Monthly challenges + weekly recap helpers. All computed from existing state
// (xpLog / usageSecs) so nothing new needs authoring.

import { monthKeyOf, currentMonthKey, todayKey, pastDays, weekKeyOf } from "./dates.js";

const MONTH_CONFIG = {
  "01": { title: "New Year Starter", desc: "Practice on 3 different days this month.", type: "days", goal: 3, rewardXp: 40, badge: "jan" },
  "02": { title: "Love of Learning", desc: "Earn 200 XP this month.", type: "xp", goal: 200, rewardXp: 40, badge: "feb" },
  "03": { title: "Exam Season Sprint", desc: "Earn 300 XP this month.", type: "xp", goal: 300, rewardXp: 60, badge: "mar" },
  "04": { title: "April Showers", desc: "Practise on 6 different days this month.", type: "days", goal: 6, rewardXp: 60, badge: "apr" },
  "05": { title: "May Momentum", desc: "Earn 250 XP this month.", type: "xp", goal: 250, rewardXp: 50, badge: "may" },
  "06": { title: "Sunshine Scholar", desc: "Practise on 8 different days this month.", type: "days", goal: 8, rewardXp: 70, badge: "jun" },
  "07": { title: "July Jump-start", desc: "Earn 350 XP this month.", type: "xp", goal: 350, rewardXp: 70, badge: "jul" },
  "08": { title: "August Ambition", desc: "Practise on 8 different days this month.", type: "days", goal: 8, rewardXp: 70, badge: "aug" },
  "09": { title: "Back-to-School Boost", desc: "Earn 300 XP this month.", type: "xp", goal: 300, rewardXp: 60, badge: "sep" },
  "10": { title: "October Focus", desc: "Practise on 6 different days this month.", type: "days", goal: 6, rewardXp: 60, badge: "oct" },
  "11": { title: "November Grind", desc: "Earn 400 XP this month.", type: "xp", goal: 400, rewardXp: 80, badge: "nov" },
  "12": { title: "Year-End Champion", desc: "Practise on 10 different days this month.", type: "days", goal: 10, rewardXp: 100, badge: "dec" },
};

export function getMonthlyChallenge() {
  const m = todayKey().slice(5, 7);
  const month = currentMonthKey();
  const cfg = MONTH_CONFIG[m] || MONTH_CONFIG["01"];
  return { month, ...cfg };
}

// Progress for the active (calendar-month) challenge.
export function computeChallengeProgress(state) {
  const { type, goal } = getMonthlyChallenge();
  const month = currentMonthKey();
  if (type === "days") {
    const days = new Set(
      Object.keys(state.xpLog || {}).filter((d) => monthKeyOf(d) === month)
    );
    Object.keys(state.usageSecs || {})
      .filter((d) => monthKeyOf(d) === month && (state.usageSecs[d] || 0) >= 60)
      .forEach((d) => days.add(d));
    return { progress: days.size, goal, done: days.size >= goal };
  }
  const xp = sumByMonth(state.xpLog || {}, month);
  return { progress: Math.min(xp, goal), goal, done: xp >= goal, raw: xp };
}

export function sumByMonth(xpLog, month) {
  return Object.entries(xpLog).reduce(
    (sum, [d, v]) => (monthKeyOf(d) === month ? sum + (v || 0) : sum),
    0
  );
}

// XP earned in the trailing 7 days (includes today) for the weekly recap.
export function weeklyXp(xpLog) {
  const keys = new Set(pastDays(7));
  return Object.entries(xpLog).reduce(
    (sum, [d, v]) => (keys.has(d) ? sum + (v || 0) : sum),
    0
  );
}

export const WEEKLY_CATALOG = [
  { label: "Mon", field: "xp" },
  { label: "Tue", field: "xp" },
  { label: "Wed", field: "xp" },
  { label: "Thu", field: "xp" },
  { label: "Fri", field: "xp" },
  { label: "Sat", field: "xp" },
  { label: "Sun", field: "xp" },
];