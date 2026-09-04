import { useEffect, useState } from "react";
import { getSubject, buildPath } from "../data/index.js";
import LessonPlayer from "./LessonPlayer.jsx";

export default function Learn({
  subjectKey,
  onAddXp,
  onRunActiveChange,
}) {
  const subject = getSubject(subjectKey);
  const lessons = subject && subject.data ? buildPath(subject) : [];
  const [activeIndex, setActiveIndex] = useState(null);

  // report to the shell whether a lesson is open (for leave confirmation)
  useEffect(() => {
    if (onRunActiveChange) onRunActiveChange(activeIndex != null);
  }, [activeIndex, onRunActiveChange]);

  if (!subject || lessons.length === 0) {
    return (
      <div className="center">
        <div className="section-title">Learn</div>
        <p className="muted">Lessons coming soon.</p>
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
        onComplete={() => {}}
        onContinue={() => setActiveIndex(null)}
        onExit={() => setActiveIndex(null)}
      />
    );
  }

  return (
    <div>
      <div className="section-title">Learn</div>
      <p className="muted">
        Browse any lesson freely — no need to pass earlier steps. No hearts spent here.
      </p>
      <div className="spacer" />
      {lessons.map((l, i) => (
        <button key={l.sub} className="row" onClick={() => setActiveIndex(i)}>
          <span className="row-icon">&#128218;</span>
          <span className="row-main">
            <span className="row-title">{l.sub}</span>
            <span className="row-sub">
              {l.terms.length} terms &#183; {l.questions.length} questions
            </span>
          </span>
          <span className="row-chev">&#8250;</span>
        </button>
      ))}
    </div>
  );
}