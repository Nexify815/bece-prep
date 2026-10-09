import { useRef, useState, useEffect } from "react";
import { getSubject, buildPath } from "../data/index.js";
import {
  LuCircleCheck, LuLock, LuLayers, LuX, LuFlag, LuMountain, LuTarget,
  LuHeart, LuStar, GOOD,
} from "./icons.jsx";
import { useSnack } from "./Snackbar.jsx";
import { msUntilNextHeart } from "../lib/storage.js";
import LessonPlayer from "./LessonPlayer.jsx";
import MatchingGame from "./MatchingGame.jsx";
import MegaQuiz from "./MegaQuiz.jsx";
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
}) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const [playing, setPlaying] = useState(null); // { type: "lesson"|"summit", index?: number }
  const [showHeartsBubble, setShowHeartsBubble] = useState(true);
  const [heartMs, setHeartMs] = useState(0);
  const currentRef = useRef(null);

  useEffect(() => {
    if (onRunActiveChange) onRunActiveChange(!!playing);
    if (onLivesRunChange) onLivesRunChange(!!playing);
  }, [playing, onRunActiveChange, onLivesRunChange]);

  const lessons = buildPath(subject);
  const totalLessons = lessons.length;

  const isDone = (i) => !!completed[`${subjectKey}:${lessons[i].sub}`];
  const isUnlocked = (i) => i === 0 || isDone(i - 1);
  const stepsDone = lessons.filter((_, i) => isDone(i)).length;
  const allLessonsDone = totalLessons > 0 && stepsDone === totalLessons;
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

  const openLesson = (i) => {
    if (hearts === 0) {
      return; // no hearts — cannot start
    }
    if (!isUnlocked(i)) {
      snack("Finish the step below first.", LuLock);
      return;
    }
    // A failed step is locked: reopening it costs a heart (cleared on retry).
    if (failedLessons && failedLessons[`${subjectKey}:${lessons[i].sub}`]) {
      if (onLoseHeart) onLoseHeart();
      if (onClearFailLesson) onClearFailLesson(`${subjectKey}:${lessons[i].sub}`);
      snack("One heart spent to retry this step \u2014 make it count!", LuHeart);
    }
    setPlaying({ type: "lesson", index: i });
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
    <div className="stairs-page">
      <section className="stairs-main">
        <div className="stairs-banner">
          <div className="stairs-banner-top">
            <span className="stairs-banner-art"><LuMountain size={30} color="#fff" /></span>
            <div className="stairs-banner-text">
              <h1>Stairs &mdash; {subject.name}</h1>
              <p>
                {allLessonsDone && !summitDone
                  ? "Every step done \u2014 the summit is open!"
                  : summitDone
                  ? "Summit reached. Fantastic!"
                  : `Step ${Math.min(current + 1, totalLessons)} of ${totalLessons} \u00B7 ${stepsDone} done`}
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
                  ? "Claimed \u2014 amazing work!"
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
            return (
              <div
                key={s.lesson.sub}
                ref={s.isCurrent ? currentRef : null}
                className={"stair-step" + stateClass}
              >
<span className="stair-node">
                  {s.done ? <LuCircleCheck size={20} /> : s.locked ? <LuLock size={18} /> : s.i + 1}
                </span>
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
                    {s.failed && <span className="stair-meta">Locked &middot; retry costs 1 </span>}
                  </span>
                  {s.isCurrent && !s.done && <span className="stair-start">START</span>}
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
            {allLessonsDone
              ? "Every lesson is done \u2014 take the mega quiz at the summit!"
              : `Finish "${lessons[current] ? lessons[current].sub : "this step"}" to unlock the one above it.`}
          </p>
        </div>
      </aside>
    </div>
  );
}

