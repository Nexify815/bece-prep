import { useRef, useState, useEffect } from "react";
import { getSubject, buildPath } from "../data/index.js";
import {
  batchesOf,
  stairBatchesDoneKey,
  stairBatchesClaimed,
  stairBatchProgress,
  stairBatchGate,
} from "../lib/stairBatches.js";
import {
  LuCircleCheck, LuLock, LuLayers, LuX, LuFlag, LuMountain, LuTarget,
  LuHeart, LuStar, GOOD,
} from "./icons.jsx";
import { useSnack } from "./Snackbar.jsx";
import { msUntilNextHeart } from "../lib/storage.js";
import LessonPlayer from "./LessonPlayer.jsx";
import MatchingGame from "./MatchingGame.jsx";
import MegaQuiz from "./MegaQuiz.jsx";
import { previewAll } from "../lib/dev.js";
import { loadRun, saveRun, clearRun } from "../lib/runSnapshot.js";
export default function Staircase({
  subjectKey,
  completed,
  passedSummit,
  failedLessons,
  hearts,
  onAddXp,
  onLoseHeart,
  onWrongAnswer,
  onCompleteLesson,
  onPassSummit,
  onFailLesson,
  onClearFailLesson,
  onSRS,
  onRunActiveChange,
  onLivesRunChange,
  stairBatchesDone = {},
  setStairBatchesDone,
}) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const lessons = buildPath(subject);
  const totalLessons = lessons.length;
  // Restore the open run (lesson / flashcard round / summit) after a refresh,
  // so the user lands back where they were instead of at the stairs start.
  const runKey = `sb_stairs_run_${subjectKey}`;
  const [playing, setPlaying] = useState(() => {
    const snap = loadRun(runKey);
    if (!snap) return null;
    // summit is subject-wide and carries no lesson index
    if (snap.type === "summit") return { type: "summit", index: 0 };
    const i = snap.index | 0;
    if (!lessons[i]) return null;
    if (["lesson", "flashcards"].includes(snap.type)) return { type: snap.type, index: i };
    if (["learn-batch", "recall-batch"].includes(snap.type)) {
      return { type: snap.type, index: i, batchIndex: snap.batchIndex ?? 0 };
    }
    return null;
  });
  const [showHeartsBubble, setShowHeartsBubble] = useState(true);
  const [heartMs, setHeartMs] = useState(0);
  const currentRef = useRef(null);
  const lastRunRef = useRef(null);

  useEffect(() => {
    if (onRunActiveChange) onRunActiveChange(!!playing);
    if (onLivesRunChange) onLivesRunChange(!!playing);
  }, [playing, onRunActiveChange, onLivesRunChange]);

  useEffect(() => {
    saveRun(runKey, playing);
    if (playing) {
      lastRunRef.current = playing;
    } else if (lastRunRef.current) {
      // Intentional exit from the open run — drop its saved in-lesson state too,
      // so re-entering starts fresh. (A refresh never runs this: it survives.)
      clearRun(`sb_lesson_run_${subjectKey}_stairs`);
      lastRunRef.current = null;
    }
  }, [playing, runKey, subjectKey]);

  // Same rule as Learn: navigating away (back arrow, rail, any link) ends the
  // run. A refresh never runs this cleanup, so the run still resumes there.
  useEffect(
    () => () => {
      clearRun(runKey);
      clearRun(`sb_lesson_run_${subjectKey}_stairs`);
    },
    [runKey, subjectKey]
  );

const isDone = (i) => !!completed[`${subjectKey}:${lessons[i].sub}`];
  // Temporary: preview opens every step so the whole staircase can be checked
  // without grinding it from the bottom first.
  const preview = previewAll();
  const isUnlocked = (i) => preview || i === 0 || isDone(i - 1);
  const stepsDone = lessons.filter((_, i) => isDone(i)).length;
  const allLessonsDone = preview || (totalLessons > 0 && stepsDone === totalLessons);
  const summitDone = !!passedSummit[subjectKey];
  // current step = the first un-done unlocked lesson
  const currentIndex = lessons.findIndex((_, i) => isUnlocked(i) && !isDone(i));
  const current = currentIndex === -1 ? totalLessons - 1 : currentIndex;

  // land on the current step instead of the top of the stairs
  useEffect(() => {
    if (currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  }, [current]);

  if (!subject || totalLessons === 0) {
    return (
      <div className="center">
        <p className="muted">Lessons coming soon.</p>
      </div>
    );
  }

  // stairs are always visible; when out of hearts the lesson buttons are still
  // clickable so Hero can start learning, but we show an out-of-hearts bubble
  const outOfHearts = hearts === 0 && !playing;

  // live countdown until the next heart restores (only when out of hearts)
  useEffect(() => {
    if (!outOfHearts) {
      setHeartMs(0);
      return;
    }
    const compute = () => {
      try {
        const raw = localStorage.getItem("studybuddy.v1");
        const st = raw ? JSON.parse(raw) : null;
        setHeartMs(msUntilNextHeart(st || { hearts: 0, heartsUpdatedAt: Date.now() }));
      } catch {
        setHeartMs(0);
      }
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [outOfHearts]);

  const heartCountdown =
    heartMs > 0
      ? `${Math.floor(heartMs / 60000)}:${String(Math.ceil((heartMs % 60000) / 1000)).padStart(2, "0")}`
      : "0:00";

  const retryIfFailed = (i) => {
    const key = `${subjectKey}:${lessons[i].sub}`;
    if (failedLessons && failedLessons[key]) {
      if (onLoseHeart) onLoseHeart();
      if (onClearFailLesson) onClearFailLesson(key);
      snack("One heart spent to retry this step — make it count!", LuHeart);
    }
  };

  const openLesson = (i) => {
    if (hearts === 0) {
      return; // no hearts — cannot start
    }
    if (!isUnlocked(i)) {
      snack("Finish the step below first.", LuLock);
      return;
    }
    // Stairs come in batches — open the learn/recall gate of the first batch.
    const s = { lesson: lessons[i], i, done: isDone(i) };
    const gate = stairBatchGate(s.lesson, subjectKey, stairBatchesDone, s.done);
    if (gate) {
      openBatch(s, gate); // openBatch handles the failed-step retry
      return;
    }
    // A failed step is locked: reopening it costs a heart (cleared on retry).
    retryIfFailed(i);
    setPlaying({ type: "lesson", index: i });
  };

  // ---- batch (ring) progress per stair ----
  const stairTotal = (sLesson) => batchesOf(sLesson).length;
  const stairClaimed = (sLesson, stairDone) =>
    stairBatchesClaimed(sLesson, subjectKey, stairBatchesDone, stairDone);

  const setBatchCounts = (sLesson, { learned, recalled }) => {
    if (!setStairBatchesDone) return;
    setStairBatchesDone({
      ...(stairBatchesDone || {}),
      [stairBatchesDoneKey(subjectKey, sLesson.sub)]: { learned, recalled },
    });
  };

  // Learn side of a batch: glossary already seen, rings stay put.
  const markLearned = (sLesson) => {
    const p = stairBatchProgress(sLesson, subjectKey, stairBatchesDone, !!completed[`${subjectKey}:${sLesson.sub}`]);
    setBatchCounts(sLesson, { learned: p.learned + 1, recalled: p.recalled });
  };

  // Recall side of a batch: one ring fills per recalled batch.
  const claimRecalled = (sLesson) => {
    const p = stairBatchProgress(sLesson, subjectKey, stairBatchesDone, !!completed[`${subjectKey}:${sLesson.sub}`]);
    const recalled = Math.min(p.total, p.recalled + 1);
    setBatchCounts(sLesson, { learned: p.learned, recalled });
    return recalled;
  };

  // openBatch(s, gate) — opens the Learn (free) or Recall (strict) player
  // for the batch the gate describes. Falls back to the whole lesson when
  // the stair has no batches or nothing deckable remains.
  const openBatch = (s, gate) => {
    if (gate.mode === "recall" && hearts === 0) {
      return;
    }
    if (!isUnlocked(s.i)) {
      snack("Finish the step below first.", LuLock);
      return;
    }
    // A failed step is locked: reopening it costs a heart (cleared on retry).
    retryIfFailed(s.i);
    const deck = batchesOf(s.lesson)[gate.index];
    if (!deck) {
      setPlaying({ type: "lesson", index: s.i });
      return;
    }
    setPlaying({
      type: gate.mode === "learn" ? "learn-batch" : "recall-batch",
      index: s.i,
      batchIndex: gate.index,
    });
  };

  const openSummit = () => {
    if (hearts === 0) {
      return;
    }
    if (!allLessonsDone) {
      snack("Complete every step first to reach the summit.", LuMountain);
      return;
    }
    setPlaying({ type: "summit" });
  };

  // ---- lesson player / mega quiz screen ----
  if (playing && playing.type === "lesson") {
    const i = playing.index;
    const key = `${subjectKey}:${lessons[i].sub}`;
    return (
      <LessonPlayer
        key={lessons[i].sub}
        subjectKey={subjectKey}
        lesson={lessons[i]}
        lessonKey={key}
        isLastLesson={i === totalLessons - 1}
        strict
        hearts={hearts}
        onAddXp={onAddXp}
        onLoseHeart={onLoseHeart}
        onWrongAnswer={onWrongAnswer}
        onFailLesson={onFailLesson}
        onClearFailLesson={onClearFailLesson}
        onSRS={onSRS}
        onComplete={(lessonKey) => {
          const wasAlreadyDone = !!completed[lessonKey];
          onCompleteLesson(lessonKey);
          if (wasAlreadyDone) {
            onAddXp(2);
            snack("+2 XP review bonus", LuStar);
          } else {
            snack("Step cleared! Click the cards icon to replay the matching game.", GOOD);
          }
        }}
        onContinue={() => setPlaying(null)}
        onExit={() => setPlaying(null)}
      />
    );
  }

  if (playing && playing.type === "flashcards") {
    const i = playing.index;
    return (
      <MatchingGame
        subjectKey={subjectKey}
        deck={lessons[i].terms}
        title="Match It"
        onSRS={onSRS}
        onAddXp={onAddXp}
        onFinish={() => setPlaying(null)}
      />
    );
  }

  if (playing && playing.type === "summit") {
    // mega quiz draws from every lesson's questions
    const pool = lessons.flatMap((l) => l.questions.slice());
    return (
      <MegaQuiz
        key="summit"
        subjectKey={subjectKey}
        questions={pool}
        alreadyPassed={summitDone}
        onAddXp={onAddXp}
        onLoseHeart={onLoseHeart}
        onWrongAnswer={onWrongAnswer}
        onPass={() => {
          onPassSummit(subjectKey);
          setPlaying(null);
        }}
        onExit={() => setPlaying(null)}
      />
    );
  }

  // ---- batch learn / recall players ----
  // The batch deck: the stair's lesson with only its `batchIndex` chunk of
  // terms (+ the questions attached to those terms), like a mini-lesson.
  const batchDeck = (sLesson) => {
    const deck = batchesOf(sLesson)[playing.batchIndex];
    if (!deck) return sLesson;
    const ids = new Set(deck.map((t) => t.id));
    return {
      ...sLesson,
      terms: deck,
      questions: (sLesson.questions || []).filter((q) => ids.has(q.termId)),
    };
  };

  // Learn-batch is a modal over the stairs page (not a route change).
  let learnBatchModal = null;
  if (playing && playing.type === "learn-batch") {
    const sLesson = lessons[playing.index];
    const total = stairTotal(sLesson);
    const closeLearn = () => {
      markLearned(sLesson);
      setPlaying(null);
    };
    learnBatchModal = (
      <div className="modal-backdrop learn-batch-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeLearn(); }}>
        <div className="modal learn-batch-modal" role="dialog" aria-modal="true" aria-label={`Learn batch of ${sLesson.sub}`}>
          <button className="learn-batch-close" onClick={closeLearn} aria-label="Close">✕</button>
          <LessonPlayer
            key={`${sLesson.sub}:learn:${playing.batchIndex}`}
            subjectKey={subjectKey}
            lesson={batchDeck(sLesson)}
            lessonKey={`${subjectKey}:${sLesson.sub}:learn:${playing.batchIndex}`}
            isLastLesson={playing.batchIndex === total - 1}
            strict={false}
            hearts={5}
            onAddXp={onAddXp}
            onLoseHeart={onLoseHeart}
            onWrongAnswer={onWrongAnswer}
            onComplete={closeLearn}
            onContinue={closeLearn}
            onExit={closeLearn}
          />
        </div>
      </div>
    );
  }

  if (playing && playing.type === "recall-batch") {
    const sLesson = lessons[playing.index];
    const total = stairTotal(sLesson);
    return (
      <LessonPlayer
        key={`${sLesson.sub}:recall:${playing.batchIndex}`}
        subjectKey={subjectKey}
        lesson={batchDeck(sLesson)}
        lessonKey={`${subjectKey}:${sLesson.sub}:recall:${playing.batchIndex}`}
        isLastLesson={playing.batchIndex === total - 1}
        strict
        hearts={hearts}
        onAddXp={onAddXp}
        onLoseHeart={onLoseHeart}
        onWrongAnswer={onWrongAnswer}
        onFailLesson={onFailLesson}
        onClearFailLesson={onClearFailLesson}
        onSRS={onSRS}
        onComplete={() => {
          const claimed = claimRecalled(sLesson);
          const key = `${subjectKey}:${sLesson.sub}`;
          if (claimed >= total && !completed[key]) {
            onCompleteLesson(key);
          }
          setPlaying(null);
        }}
        onContinue={() => setPlaying(null)}
        onExit={() => setPlaying(null)}
      />
    );
  }

  // ---- staircase view ----
  const steps = lessons.map((lesson, i) => ({
    lesson,
    i,
    done: isDone(i),
    locked: !isUnlocked(i),
    isCurrent: i === current,
    failed: !!failedLessons[`${subjectKey}:${lesson.sub}`],
  }));

  return (
    <>
    <div className="stairs-page">
      <section className="stairs-main">
        <div className="stairs-banner">
          <div className="stairs-banner-top">
            <span className="stairs-banner-art"><LuMountain size={30} color="#fff" /></span>
            <div className="stairs-banner-text">
              <h1>Stairs &mdash; {subject.name}</h1>
              <p>
                {allLessonsDone && !summitDone
                  ? "Every step done — the summit is open!"
                  : summitDone
                  ? "Summit reached. Fantastic!"
                  : `Step ${Math.min(current + 1, totalLessons)} of ${totalLessons} · ${stepsDone} done`}
              </p>
            </div>
            <span className="stairs-banner-count">
              {stepsDone}/{totalLessons}
            </span>
          </div>
          <div className="stairs-banner-bar">
            <span
              style={{
                width: `${totalLessons ? Math.round((stepsDone / totalLessons) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {outOfHearts && showHeartsBubble && (
          <div className="hearts-bubble-wrap">
            <div className="hearts-bubble">
              <span className="hearts-bubble-msg">
                Out of hearts &#183; new one in <strong>{heartCountdown}</strong>
              </span>
              <button
                className="hearts-bubble-close"
                aria-label="Dismiss"
                onClick={() => setShowHeartsBubble(false)}
              >
<LuX size={15} />
              </button>
            </div>
          </div>
        )}

        <div className="stairs-path">
          {/* summit sits at the top of the path */}
          <button
            className={
              "stair-summit" +
              (allLessonsDone ? " ready" : "") +
              (summitDone ? " done" : "")
            }
            onClick={openSummit}
            disabled={outOfHearts || !allLessonsDone}
          >
            <span className="summit-flag"><LuFlag size={26} color="#D97706" /></span>
            <span className="summit-body">
              <span className="summit-label">Summit</span>
              <span className="summit-sub">
                {summitDone
                  ? "Claimed — amazing work!"
                  : allLessonsDone
                  ? "Mega quiz awaits"
                  : "Locked"}
              </span>
              {!summitDone && (
                <span className="summit-reward">
                  <LuTarget size={13} /> Mega quiz &middot; 100 XP
                </span>
              )}
            </span>
          </button>

          {[...steps].reverse().map((s) => {
            const stateClass =
              (s.done ? " done" : s.locked ? " locked" : s.isCurrent ? " current" : "") +
              (s.failed ? " failed" : "");
            const mins = Math.max(5, s.lesson.terms.length);
            const stairTotalN = stairTotal(s.lesson);
            const stairClaimedN = stairClaimed(s.lesson, s.done);
            const stairGate = stairBatchGate(s.lesson, subjectKey, stairBatchesDone, s.done);
            const isFeatured = s.isCurrent && !s.done && stairTotalN > 0;
            // Six explicit paths: 4 curved corner bars + 2 straight horizontal
            // bars (one top, one bottom), as in the reference. Last two are
            // omitted when a stair has fewer than 6 batches.
            const trackPaths = [
              "M6 80 V32 A24 24 0 0 1 30 8 H150",                 // top-left corner
              "M180 8 H420",                                       // top horizontal
              "M450 8 H570 A24 24 0 0 1 594 32 V80",              // top-right corner
              "M594 100 V108 A24 24 0 0 1 570 132 H450",           // bottom-right corner
              "M420 132 H180",                                     // bottom horizontal
              "M150 132 H30 A24 24 0 0 1 6 108 V100",              // bottom-left corner
            ];
            if (isFeatured) {
              return (
                <div
                  key={s.lesson.sub}
                  ref={currentRef}
                  className="stair-step stair-step-featured"
                >
                  <span className="stair-node-wrap">
                    <span className="stair-node">{s.i + 1}</span>
                  </span>
                  <span className="stair-batch-frame">
                    <svg className="stair-batch-track" viewBox="0 0 600 140" preserveAspectRatio="none" aria-hidden="true">
                      {Array.from({ length: stairTotalN }, (_, r) => (
                        <g key={r}>
                          <path
                            d={trackPaths[r]}
                            className={"stair-batch-seg" + (stairClaimedN > r ? " done" : "")}
                            vectorEffect="non-scaling-stroke"
                          />
                          {stairClaimedN > r && (
                            <path
                              d={trackPaths[r]}
                              className="stair-batch-shine"
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                        </g>
                      ))}
                    </svg>
                    <button
                      className="stair-button stair-go-card"
                      onClick={() => openBatch(s, { mode: "recall", index: stairClaimedN })}
                      disabled={outOfHearts}
                    >
                      <span className="stair-body">
                        <span className="stair-label">{s.lesson.sub}</span>
                        <span className="stair-batch-label">
                          batch {Math.min(stairClaimedN + 1, stairTotalN)} of {stairTotalN}
                        </span>
                      </span>
                      <span className="stair-go">GO</span>
                    </button>
                  </span>
                  <button
                    className="stair-gate"
                    onClick={() => openBatch(s, { mode: "learn", index: stairClaimedN })}
                  >
                    Learn batch
                  </button>
                </div>
              );
            }
            return (
              <div key={s.lesson.sub} className={"stair-step" + stateClass}>
                <span className="stair-node-wrap">
                  <span className="stair-node">
                    {s.done ? <LuCircleCheck size={20} /> : s.locked ? <LuLock size={18} /> : s.i + 1}
                  </span>
                </span>
                <div className="stair-step-main">
                  <button
                    className="stair-button"
                    onClick={() => openLesson(s.i)}
                    disabled={s.locked || outOfHearts}
                  >
                    <span className="stair-body">
                      <span className="stair-label">{s.lesson.sub}</span>
                      {!s.locked && !s.done && (
                        <span className="stair-meta">
                          {s.lesson.terms.length} terms &middot; ~{mins} min
                        </span>
                      )}
                      {s.done && <span className="stair-meta">Completed</span>}
                    </span>
                    {s.locked && !s.isCurrent && <span className="stair-locked-label">Locked</span>}
                  </button>
                  {s.done && (
                    <button
                      className="stair-flash"
                      onClick={() => setPlaying({ type: "flashcards", index: s.i })}
                      title="Replay this step's matching game"
                      aria-label="Replay matching game"
                    >
                      <LuLayers size={13} /> Cards
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="stairs-stats">
        <div className="card stairs-stat-card">
          <div className="stairs-stat-title">Your climb</div>
          <div className="stairs-stat-row">
            <span>Lessons done</span>
            <strong>
              {stepsDone}/{totalLessons}
            </strong>
          </div>
          <div className="stairs-stat-row">
            <span>Terms in subject</span>
            <strong>{subject.data.glossary.length}</strong>
          </div>
          <div className="stairs-stat-row">
            <span>Summit</span>
            <strong>{summitDone ? "Claimed" : allLessonsDone ? "Open" : "Locked"}</strong>
          </div>
        </div>

        <div className="card stairs-next-card">
          <div className="stairs-stat-title">What&rsquo;s next</div>
<p className="stairs-next-text">
            {preview
              ? "Preview on — every step is open for checking."
              : allLessonsDone
              ? "Every lesson is done — take the mega quiz at the summit!"
              : `Finish "${lessons[current] ? lessons[current].sub : "this step"}" to unlock the one above it.`}
          </p>
        </div>
      </aside>
    </div>
    {learnBatchModal}
    </>
  );
}

