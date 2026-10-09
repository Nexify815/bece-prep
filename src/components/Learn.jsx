import { useEffect, useState } from "react";
import { getSubject, buildPath } from "../data/index.js";
import LessonPlayer from "./LessonPlayer.jsx";
import { LuBookOpen, LuChevronRight } from "./icons.jsx";

export default function Learn({
  subjectKey,
  onAddXp,
  onRunActiveChange,
  onWrongAnswer,
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
        onComplete={() => {}}
        onContinue={() => setActiveIndex(null)}
        onExit={() => setActiveIndex(null)}
      />
    );
  }

  return (
    <div className="prep-page">
      <div className="prep-head">
        <h1>Learn</h1>
        <p>Browse any lesson freely. No hearts, no locks, no pass mark.</p>
      </div>
      {lessons.map((l, i) => (
        <button key={l.sub} className="prep-item" onClick={() => setActiveIndex(i)}>
          <span className="prep-item-icon" style={{ background: subject.colorHex }}>
            <LuBookOpen size={18} color="#fff" />
          </span>
          <span className="prep-item-body">
            <span className="prep-item-title">{l.sub}</span>
            <span className="prep-item-sub">
              {l.terms.length} terms &middot; {l.questions.length} questions
            </span>
          </span>
          <LuChevronRight size={18} className="prep-item-chev" />
        </button>
      ))}
    </div>
  );
}