import math from "./math.json";
import science from "./science.json";
import english from "./english.json";
import social from "./social.json";
import sciencePast from "./science_past.json";

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
];

export function getSubject(key) {
  return SUBJECTS.find((s) => s.key === key) || null;
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
