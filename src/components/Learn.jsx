import { useEffect, useRef, useState } from "react";
import { LuCheck, LuBox, LuCircleDot, LuGlobe, LuRefreshCw, LuLeaf, LuPawPrint } from "react-icons/lu";
import { getSubject, buildPath } from "../data/index.js";
import LessonPlayer from "./LessonPlayer.jsx";
import { LuBookOpen, LuChevronRight, SubjectIcon } from "./icons.jsx";
import { loadRun, saveRun, clearRun } from "../lib/runSnapshot.js";

const TONES = ["blue", "pink", "green", "purple", "orange", "yellow"];
const LESSON_ICONS = [LuBox, LuCircleDot, LuGlobe, LuRefreshCw, LuLeaf, LuPawPrint];

export default function Learn({
  subjectKey,
  onAddXp,
  onRunActiveChange,
  onWrongAnswer,
  onCompleteLesson,
}) {
  const subject = getSubject(subjectKey);
  const lessons = subject && subject.data ? buildPath(subject) : [];
  // Restore the open lesson after a refresh, so the user lands back where
  // they were instead of at the Learn list.
  const runKey = `sb_learn_run_${subjectKey}`;
  const [activeIndex, setActiveIndex] = useState(() => {
    const snap = loadRun(runKey);
    if (!snap) return null;
    const i = snap.index | 0;
    return lessons[i] ? i : null;
  });
  const lastRunRef = useRef(null);

  // Leaving the screen on purpose (back arrow, rail, any navigation) drops the
  // saved run, so coming back starts at the lesson list. A browser refresh
  // never runs this cleanup, so "resume where I was" still works there.
  useEffect(
    () => () => {
      clearRun(runKey);
      clearRun(`sb_lesson_run_${subjectKey}_learn`);
    },
    [runKey, subjectKey]
  );

  useEffect(() => {
    saveRun(runKey, activeIndex != null ? { index: activeIndex } : null);
    if (activeIndex != null) {
      lastRunRef.current = activeIndex;
    } else if (lastRunRef.current !== null) {
      // Intentional exit from the open lesson — re-entering starts fresh.
      clearRun(`sb_lesson_run_${subjectKey}_learn`);
      lastRunRef.current = null;
    }
  }, [activeIndex, runKey, subjectKey]);

  // report to the shell whether a lesson is open (for leave confirmation)
  useEffect(() => {
    if (onRunActiveChange) onRunActiveChange(activeIndex != null);
  }, [activeIndex, onRunActiveChange]);

  // Only the lesson list follows the reference palette; the full-screen
  // lesson player keeps its own styling while a run is open.
  useEffect(() => {
    if (activeIndex != null) {
      document.documentElement.classList.remove("learn-route");
      return;
    }
    document.documentElement.classList.add("learn-route");
    return () => document.documentElement.classList.remove("learn-route");
  }, [activeIndex]);

  if (!subject || lessons.length === 0) {
    return (
      <div className="prep-page">
        <div className="empty-card">
          <span className="empty-card-icon">
            <LuBookOpen size={26} color="#14B8A6" />
          </span>
          <h2>No lessons yet</h2>
          <p className="muted">This subject doesn&rsquo;t have lessons to browse.</p>
        </div>
      </div>
    );
  }

  const lesson = activeIndex != null ? lessons[activeIndex] : null;

  // open lesson player for free browsing — no pass mark, no hearts, no unlocking needed
  if (lesson) {
    return (
      <LessonPlayer
        key={lesson.sub}
        subjectKey={subjectKey}
        lesson={lesson}
        lessonKey={`${subjectKey}:${lesson.sub}`}
        isLastLesson={activeIndex === lessons.length - 1}
        onAddXp={onAddXp}
        onLoseHeart={() => {}}
        onWrongAnswer={onWrongAnswer}
        onComplete={(lessonKey) => onCompleteLesson && onCompleteLesson(lessonKey)}
        onContinue={() => setActiveIndex(null)}
        onExit={() => setActiveIndex(null)}
      />
    );
  }

  return (
    <div className="ln-page">
      <section className="ln-intro">
        <span className="ln-bub ln-bub-a" aria-hidden="true" />
        <span className="ln-bub ln-bub-b" aria-hidden="true" />
        <span className="ln-intro-tile" aria-hidden="true">
          <SubjectIcon subjectKey={subjectKey} size={40} color="#0F3D12" />
        </span>
        <div className="ln-intro-body">
          <span className="ln-eyebrow">{subject.name}</span>
          <h2>Browse any lesson freely.</h2>
          <div className="ln-checks">
            <span><LuCheck size={16} strokeWidth={4} /> No hearts</span>
            <span><LuCheck size={16} strokeWidth={4} /> No locks</span>
            <span><LuCheck size={16} strokeWidth={4} /> No pass mark</span>
          </div>
        </div>
      </section>

      <div className="ln-grid">
        {lessons.map((l, i) => {
          const Icon = LESSON_ICONS[i % LESSON_ICONS.length];
          return (
            <button key={l.sub} className="ln-card" onClick={() => setActiveIndex(i)}>
              <span className={"ln-card-icon ln-tone-" + TONES[i % TONES.length]} aria-hidden="true">
                <Icon size={28} strokeWidth={2.6} />
              </span>
              <span className="ln-card-body">
                <b>{l.sub}</b>
                <span className="ln-meta">
                  <span>{l.terms.length} terms</span>
                  <span>{l.questions.length} questions</span>
                </span>
              </span>
              <LuChevronRight size={20} strokeWidth={3.5} className="ln-chev" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
