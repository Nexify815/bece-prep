// Unit tests for src/lib/stairBatches.js — batches, progress, gate, totals.
import assert from "assert";
import {
  batchesOf,
  stairBatchesDoneKey,
  stairBatchesClaimed,
  stairBatchProgress,
  stairBatchGate,
  STAIR_BATCH_SIZE,
  MAX_RINGS,
} from "../src/lib/stairBatches.js";
import { buildPath, SUBJECTS } from "../src/data/index.js";

assert.strictEqual(STAIR_BATCH_SIZE, 6);
assert.strictEqual(MAX_RINGS, 12);

const allLessons = SUBJECTS.flatMap((s) => buildPath(s));
assert.ok(allLessons.length > 0, "expected lessons");

// batchesOf: every lesson splits into batches of <=6 covering all terms.
for (const l of allLessons) {
  const bs = batchesOf(l);
  assert.strictEqual(bs.reduce((a, b) => a + b.length, 0), l.terms.length);
  assert.strictEqual(bs.length, Math.ceil(l.terms.length / 6));
  assert.ok(bs.every((b) => b.length <= 6), "batch > 6 terms");
  // terms stay in original order within the stair
  const flat = bs.flat();
  assert.deepStrictEqual(flat, l.terms);
}

// Known data point: science "Materials" is 31 terms.
const science = SUBJECTS.find((s) => s.key === "science");
const materials = buildPath(science).find((l) => l.sub === "Materials");
assert.strictEqual(materials.terms.length, 31);
assert.deepStrictEqual(batchesOf(materials).map((b) => b.length), [6, 6, 6, 6, 6, 1]);

// Fresh stair: gate = Learn batch 1.
const mkKey = (sub) => stairBatchesDoneKey(science.key, sub);
const fresh = { [mkKey("Materials")]: { learned: 0, recalled: 0 } };
assert.deepStrictEqual(stairBatchGate(materials, science.key, fresh), {
  mode: "learn",
  index: 0,
  text: "Learn batch 1 of 6",
});
assert.deepStrictEqual(stairBatchProgress(materials, science.key, {}, false), {
  total: 6,
  learned: 0,
  recalled: 0,
  claimed: 0,
});

// After learn (learned=1, recalled=0): gate = Recall batch 1.
const afterLearn = { [mkKey("Materials")]: { learned: 1, recalled: 0 } };
assert.deepStrictEqual(stairBatchGate(materials, science.key, afterLearn), {
  mode: "recall",
  index: 0,
  text: "Recall batch 1 of 6",
});
assert.strictEqual(stairBatchesClaimed(materials, science.key, afterLearn, false), 0);

// After recall (learned=1, recalled=1): 1 ring filled, gate = Learn batch 2.
const afterRecall = { [mkKey("Materials")]: { learned: 1, recalled: 1 } };
assert.strictEqual(stairBatchesClaimed(materials, science.key, afterRecall, false), 1);
assert.deepStrictEqual(stairBatchGate(materials, science.key, afterRecall), {
  mode: "learn",
  index: 1,
  text: "Learn batch 2 of 6",
});

// Done stair: gate null, claimed = total.
assert.strictEqual(stairBatchGate(materials, science.key, {}, true), null);
assert.strictEqual(stairBatchesClaimed(materials, science.key, {}, true), 6);

// Totals across subjects: math 29, science 46, english 24, social 21 = 120.
const perSubject = SUBJECTS.map((s) =>
  buildPath(s).reduce((a, l) => a + batchesOf(l).length, 0)
);
assert.deepStrictEqual(perSubject, [29, 46, 24, 21]);

// big-stairs split: largest stair in science is Materials (31 terms -> 6 batches).

console.log("stair-batches unit tests OK:", perSubject.join(", "), "total", perSubject.reduce((a, b) => a + b, 0));
