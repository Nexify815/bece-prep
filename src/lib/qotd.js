// "Question of the day" — a deterministic pick from all real content, seeded
// by the calendar day so every child on every device sees the same question.

import { SUBJECTS, PAST_PAPERS } from "../data/index.js";
import { todayKey, hashString } from "./dates.js";

let poolCache = null;

function buildPool() {
  if (poolCache) return poolCache;
  const pool = [];
  SUBJECTS.forEach((s) => {
    (s.data?.questions || []).forEach((q) =>
      pool.push({ ...q, subjectKey: s.key })
    );
  });
  PAST_PAPERS.forEach((p) => {
    (p.data?.questions || []).forEach((q) =>
      pool.push({ ...q, subjectKey: p.key, isPast: true })
    );
  });
  poolCache = pool;
  return pool;
}

export function getQuestionOfTheDay(dayKey = todayKey()) {
  const pool = buildPool();
  if (pool.length === 0) return null;
  const pick = hashString(dayKey) % pool.length;
  const q = pool[pick];
  return { ...q, dayKey };
}