// Exam Mode ("Cram Mode") helpers — data-derived, no game mechanics.
// Coverage, high-yield topics, weak spots and the blitz pool all come from the
// shipped subject glossaries + past-paper banks, so nothing extra to maintain.

import { SUBJECTS, PAST_PAPERS, getQuestion } from "../data/index.js";

export const EXAM_STATUS = {
  KNOWN: "known",
  UNSURE: "unsure",
  NO: "no",
};

const COVERED = new Set([EXAM_STATUS.KNOWN, EXAM_STATUS.UNSURE]);

// All distinct topics for a subject: curriculum (glossary subStrands) plus the
// topic tags on its past-paper questions, so "syllabus coverage" reflects both
// what the curriculum teaches and what the exam actually asks.
export function subjectTopics(subjectKey) {
  const subj = SUBJECTS.find((s) => s.key === subjectKey);
  const paper = PAST_PAPERS.find((p) => p.key === subjectKey);
  const map = new Map();
  (subj && subj.data.glossary ? subj.data.glossary : []).forEach((t) => {
    const name = t.subStrand || "General";
    const e = map.get(name) || { name, terms: 0, questions: 0 };
    e.terms += 1;
    map.set(name, e);
  });
  (paper && paper.data.questions ? paper.data.questions : []).forEach((q) => {
    const name = q.topic || "General";
    const e = map.get(name) || { name, terms: 0, questions: 0 };
    e.questions += 1;
    map.set(name, e);
  });
  return Array.from(map.values());
}

// The topic a question belongs to (works for subject and past-paper questions).
export function questionTopic(subjectKey, qid) {
  const q = getQuestion(subjectKey, qid);
  if (!q) return null;
  if (q.topic) return q.topic;
  if (q.termId) {
    const subj = SUBJECTS.find((s) => s.key === subjectKey);
    const t = subj && subj.data.glossary ? subj.data.glossary.find((x) => x.id === q.termId) : null;
    if (t) return t.subStrand || "General";
  }
  return "General";
}

// Coverage: known + unsure count as "covered" (the student has engaged with
// the topic, even if they flagged it as shaky). Returns counts + percentage.
export function coverageFor(syllabus, topics) {
  const total = (topics || []).length;
  if (!total) return { covered: 0, total: 0, pct: 0 };
  let covered = 0;
  topics.forEach((t) => {
    const st = syllabus && syllabus[t.name];
    if (COVERED.has(st)) covered += 1;
  });
  return { covered, total, pct: Math.round((covered / total) * 100) };
}

// Topics a subject's past papers ask about the most — the "study these first"
// list for time-poor crammers.
export function highYieldTopics(subjectKey, limit = 5) {
  const paper = PAST_PAPERS.find((p) => p.key === subjectKey);
  const counts = {};
  (paper && paper.data.questions ? paper.data.questions : []).forEach((q) => {
    const name = q.topic || "General";
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

// Weakest topics from the shared mistakes bank, grouped and counted.
export function weakTopics(wrongAnswers, subjectKey) {
  const counts = {};
  (wrongAnswers || [])
    .filter((w) => !subjectKey || w.subject === subjectKey)
    .forEach((w) => {
      const name = questionTopic(w.subject, w.qid) || "General";
      counts[name] = (counts[name] || 0) + w.count;
    });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

// First high-yield topic the student hasn't "covered" yet — the recommended
// next thing to study.
export function recommendNext(subjectKey, syllabus, limit = 5) {
  for (const t of highYieldTopics(subjectKey, limit)) {
    const st = syllabus && syllabus[t.name];
    if (!COVERED.has(st)) return { ...t, status: st || EXAM_STATUS.NO };
  }
  return null;
}

// Full days from today until the exam date string ("YYYY-MM-DD"). 0 = today,
// negative = past.
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Blitz pool: this subject's tap-only questions (MC + true/false) plus its
// past-paper questions — everything answerable with a single tap.
export function blitzPool(subjectKey) {
  const subj = SUBJECTS.find((s) => s.key === subjectKey);
  const paper = PAST_PAPERS.find((p) => p.key === subjectKey);
  const pool = [];
  ((subj && subj.data.questions) || [])
    .filter((q) => q.type === "mc" || q.type === "true-false")
    .filter((q) => Array.isArray(q.options) && q.options.length >= 2 && !!q.correctAnswer)
    .forEach((q) => pool.push(q));
  ((paper && paper.data.questions) || [])
    .filter((q) => Array.isArray(q.options) && q.options.length >= 2 && !!q.correctAnswer)
    .forEach((q) => pool.push(q));
  return shuffle(pool);
}

// The subject Exam Mode is currently focused on: the one picked on the
// dashboard/setup, else the first of the chosen subjects, else the first subject.
export function activeSubject(examMode) {
  const keys =
    examMode && Array.isArray(examMode.subjects) && examMode.subjects.length > 0
      ? examMode.subjects
      : SUBJECTS.map((s) => s.key);
  return keys[0] || SUBJECTS[0].key;
}

export function subjectLabel(subjectKey) {
  const subj = SUBJECTS.find((s) => s.key === subjectKey);
  return subj ? subj.name : subjectKey;
}