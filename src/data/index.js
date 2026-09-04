import math from "./math.json";
import science from "./science.json";
import english from "./english.json";
import social from "./social.json";
import french from "./french.json";
import ict from "./ict.json";
import ghanaian from "./ghanaian.json";
import sciencePast from "./science_past.json";
import mathPast from "./math_past.json";
import englishPast from "./english_past.json";
import socialPast from "./social_past.json";

const SUBJECTS = [
  {
    key: "math",
    name: "Mathematics",
    icon: "\u{1F4DA}",
    colorClass: "accent-math",
    colorHex: "#1CB0F6",
    data: math,
  },
  {
    key: "science",
    name: "Integrated Science",
    icon: "\u{1F4A1}",
    colorClass: "accent-science",
    colorHex: "#58CC02",
    data: science,
  },
  {
    key: "english",
    name: "English Language",
    icon: "\u{1F4D6}",
    colorClass: "accent-english",
    colorHex: "#FF9600",
    data: english,
  },
  {
    key: "social",
    name: "Social Studies",
    icon: "\u{1F30D}",
    colorClass: "accent-social",
    colorHex: "#CE82FF",
    data: social,
  },
  {
    key: "french",
    name: "French",
    icon: "\u{1F1EB}\u{1F1F7}",
    colorClass: "accent-french",
    colorHex: "#0072C6",
    data: french,
  },
  {
    key: "ict",
    name: "ICT",
    icon: "\u{1F4BB}",
    colorClass: "accent-ict",
    colorHex: "#2F3E9E",
    data: ict,
  },
  {
    key: "ghanaian",
    name: "Ghanaian Language (Akan)",
    icon: "\u{1F3C6}",
    colorClass: "accent-ghanaian",
    colorHex: "#C1272D",
    data: ghanaian,
  },
];

const PAST_PAPERS = [
  {
    key: "science",
    name: "Integrated Science (Past Papers)",
    icon: "\u{1F4A1}",
    colorClass: "accent-science",
    colorHex: "#58CC02",
    data: sciencePast,
  },
  {
    key: "math",
    name: "Mathematics (Past Papers)",
    icon: "\u{1F4DA}",
    colorClass: "accent-math",
    colorHex: "#1CB0F6",
    data: mathPast,
  },
  {
    key: "english",
    name: "English Language (Past Papers)",
    icon: "\u{1F4D6}",
    colorClass: "accent-english",
    colorHex: "#FF9600",
    data: englishPast,
  },
  {
    key: "social",
    name: "Social Studies (Past Papers)",
    icon: "\u{1F30D}",
    colorClass: "accent-social",
    colorHex: "#CE82FF",
    data: socialPast,
  },
];

export function getSubject(key) {
  return SUBJECTS.find((s) => s.key === key) || null;
}

// Look up a question by id within a subject. Returns null if not found.
export function getQuestion(subjectKey, qid) {
  const subj = getSubject(subjectKey);
  if (!subj || !subj.data || !Array.isArray(subj.data.questions)) return null;
  return subj.data.questions.find((q) => q.id === qid) || null;
}

// Build an ordered learning path from a subject's glossary.
// One lesson per subStrand (in strand order), teaching its terms, with the
// questions that belong to those terms attached for the end-of-lesson quiz.
export function buildPath(subject) {
  const terms = (subject.data.glossary || []).slice();
  const questions = subject.data.questions || [];

  const strands = [];
  const map = new Map(); // subStrandName -> lesson object
  terms.forEach((t) => {
    const strand = t.strand || "General";
    const sub = t.subStrand || "General";
    if (!map.has(sub)) {
      if (!strands.some((s) => s.strand === strand && s.sub === sub)) {
        strands.push({ strand, sub });
      }
      map.set(sub, { strand, sub, terms: [], questions: [] });
    }
    map.get(sub).terms.push(t);
  });

  // attach questions whose term belongs to this lesson
  terms.forEach((t) => {
    const sub = t.subStrand || "General";
    const lesson = map.get(sub);
    questions.forEach((q) => {
      if (q.termId === t.id) lesson.questions.push(q);
    });
  });

  // dedupe questions per lesson
  strands.forEach(({ sub }) => {
    const lesson = map.get(sub);
    lesson.questions = Array.from(new Map(lesson.questions.map((q) => [q.id, q])).values());
  });

  // Only keep lessons that have quiz questions, so every path lesson ends
  // with a real mini-quiz (no short lessons that just flip through terms).
  return strands
    .map(({ sub }) => map.get(sub))
    .filter((lesson) => lesson.questions.length > 0);
}

export function getSubjectsAvailable() {
  return SUBJECTS.filter((s) => s.data && s.data.glossary);
}

export { SUBJECTS, PAST_PAPERS };
