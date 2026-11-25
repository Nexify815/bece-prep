// Batch-gated stairs: a "stair" is a subStrand of a subject, and each stair is
// presented as a chain of batches (roughly 6 glossary terms each). For every
// stair we track: `learned` (batches already studied — glossary side) and
// `recalled` (batches already recalled in the Stairs section, i.e. rings
// filled). The user flow per stair, when open:
//
//   gate: "Learn batch k of N"  -> opens Learn player with just that batch
//         -> back to stairs (learned = k, rings still 0)
//   gate: "Recall batch k of N" -> opens Strict LessonPlayer with that batch
//         -> back to stairs (ring k filled, learned == recalled)
//
// Rows: one ring per batch of the stair (max MAX_RINGS, with a "+N" marker).

export const STAIR_BATCH_SIZE = 6;
export const MAX_RINGS = 12;

export function batchesOf(lesson, size = STAIR_BATCH_SIZE) {
  if (!lesson || !Array.isArray(lesson.terms) || lesson.terms.length === 0) return [];
  const out = [];
  for (let i = 0; i < lesson.terms.length; i += size) {
    out.push(lesson.terms.slice(i, i + size));
  }
  return out;
}

export function stairBatchesDoneKey(subjectKey, sub) {
  return `${subjectKey}:${sub}`;
}

// Progress for one stair: { total, learned, recalled, claimed }.
// claimed = rings shown = recalled when stair open (all total when stair done).
export function stairBatchProgress(lesson, subjectKey, stairBatchesDone, stairDone) {
  const batches = batchesOf(lesson);
  const total = batches.length;
  if (!total) return { total: 0, learned: 0, recalled: 0, claimed: 0 };
  const rec = stairBatchesDone?.[stairBatchesDoneKey(subjectKey, lesson.sub)] || {};
  const learned = stairDone ? total : Math.min(Math.max(Number(rec.learned) || 0, 0), total);
  const recalled = stairDone
    ? total
    : Math.min(Math.max(Number(rec.recalled) || 0, 0), total);
  return { total, learned, recalled, claimed: stairDone ? total : recalled };
}

export function stairBatchesClaimed(lesson, subjectKey, stairBatchesDone, stairDone) {
  return stairBatchProgress(lesson, subjectKey, stairBatchesDone, stairDone).claimed;
}

// The gate button state for the open stair.
// mode "learn": Learn player (free) | mode "recall": Strict recall.
export function stairBatchGate(lesson, subjectKey, stairBatchesDone, stairDone) {
  const { total, learned, recalled } = stairBatchProgress(lesson, subjectKey, stairBatchesDone, stairDone);
  if (total === 0) return null;
  if (stairDone || recalled >= total) return null;
  const index = recalled;
  if (learned <= recalled) {
    return { mode: "learn", index, text: `Learn batch ${index + 1} of ${total}` };
  }
  return { mode: "recall", index, text: `Recall batch ${index + 1} of ${total}` };
}
