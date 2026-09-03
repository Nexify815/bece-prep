import { useRef, useState, useEffect } from "react";
import { getSubject, buildPath } from "../data/index.js";
import { useSnack } from "./Snackbar.jsx";
import LessonPlayer from "./LessonPlayer.jsx";
import MegaQuiz from "./MegaQuiz.jsx";

export default function Staircase({
  subjectKey,
  completed,
  passedSummit,
  onCompleteLesson,
  onPassSummit,
}) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const [playing, setPlaying] = useState(null); // { type: "lesson"|"summit", index?: number }
  const currentRef = useRef(null);

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
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [current]);

  if (!subject || totalLessons === 0) {
    return (
      <div className="center">
        <p className="muted">Lessons coming soon.</p>
      </div>
    );
  }

  const openLesson = (i) => {
    if (!isUnlocked(i)) {
      snack("Finish the step below first.");
      return;
    }
    setPlaying({ type: "lesson", index: i });
  };

  const openSummit = () => {
    if (!allLessonsDone) {
      snack("Complete every step first to reach the summit.");
      return;
    }
    setPlaying({ type: "summit" });
  };

  // ---- lesson player / mega quiz screen ----
  if (playing && playing.type === "lesson") {
    const i = playing.index;
    return (
      <LessonPlayer
        key={lessons[i].sub}
        subjectKey={subjectKey}
        lesson={lessons[i]}
        lessonKey={`${subjectKey}:${lessons[i].sub}`}
        isLastLesson={i === totalLessons - 1}
        onComplete={(key) => onCompleteLesson(key)}
        onContinue={() => setPlaying(null)}
        onExit={() => setPlaying(null)}
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
  }));

  return (
    <div className="stair-page">
      <div className="stair-heading">
        <div className="section-title">Stairs</div>
        <p className="muted">
          {allLessonsDone && !summitDone
            ? "All steps done! Climb to the summit."
            : summitDone
            ? "Summit reached. Fantastic!"
            : `Climb up — step ${current + 1} of ${totalLessons}`}
        </p>
      </div>

      <div className="stair-column">
        {/* summit at the very top */}
        <button
          className={"stair-summit" + (allLessonsDone ? " ready" : "") + (summitDone ? " done" : "")}
          onClick={openSummit}
        >
          <span className="summit-flag">&#127988;</span>
          <span className="summit-label">Summit</span>
          <span className="summit-sub">
            {summitDone ? "Complete!" : allLessonsDone ? "Mega quiz awaits" : "Locked"}
          </span>
        </button>

        {[...steps].reverse().map((s) => {
          const stateClass = s.done ? " done" : s.locked ? " locked" : s.isCurrent ? " current" : "";
          return (
            <div key={s.lesson.sub} ref={s.isCurrent ? currentRef : null} className={"stair-step" + stateClass}>
              {s.isCurrent && <span className="fox-mark">&#129418;</span>}
              <button
                className="stair-button"
                onClick={() => openLesson(s.i)}
                disabled={s.locked}
              >
                <span className="stair-icon">
                  {s.done ? "\u2713" : s.locked ? "\u{1F512}" : s.i + 1}
                </span>
                <span className="stair-label">{s.lesson.sub}</span>
                <span className="stair-meta">
                  {s.done ? "Done" : s.locked ? "Locked" : `${s.lesson.terms.length} terms`}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
