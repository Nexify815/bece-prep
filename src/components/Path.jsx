import { useState } from "react";
import { getSubject, buildPath } from "../data/index.js";
import { navigate } from "../lib/router.js";
import { useSnack } from "./Snackbar.jsx";
import LessonPlayer from "./LessonPlayer.jsx";

export default function Path({ subjectKey, completed, onCompleteLesson }) {
  const subject = getSubject(subjectKey);
  const snack = useSnack();
  const [activeIndex, setActiveIndex] = useState(null);

  if (!subject) {
    return (
      <div className="center">
        <p className="muted">This subject has no lessons yet.</p>
        <button className="btn btn-primary mt" onClick={() => navigate(`/subject/${subjectKey}`)}>
          Back
        </button>
      </div>
    );
  }

  const lessons = buildPath(subject);
  if (lessons.length === 0) {
    return (
      <div className="center">
        <p className="muted">Lessons coming soon.</p>
        <button className="btn btn-primary mt" onClick={() => navigate(`/subject/${subjectKey}`)}>
          Back
        </button>
      </div>
    );
  }

  const isCompleted = (i) => !!completed[`${subjectKey}:${lessons[i].sub}`];
  const isUnlocked = (i) => i === 0 || isCompleted(i - 1);
  const nextIndex = lessons.findIndex((_, i) => isUnlocked(i) && !isCompleted(i));
  const next = nextIndex === -1 ? 0 : nextIndex;

  const handlePlay = (i) => {
    if (!isUnlocked(i)) {
      snack("Finish the previous lesson first.");
      return;
    }
    setActiveIndex(i);
  };

  if (activeIndex != null) {
    return (
      <LessonPlayer
        key={lessons[activeIndex].sub}
        subjectKey={subjectKey}
        lesson={lessons[activeIndex]}
        lessonKey={`${subjectKey}:${lessons[activeIndex].sub}`}
        isLastLesson={activeIndex === lessons.length - 1}
        onComplete={(key) => {
          onCompleteLesson(key);
        }}
        onContinue={() => setActiveIndex(null)}
        onExit={() => setActiveIndex(null)}
      />
    );
  }

  return (
    <div className="path-page">
      <div className="section-title">Learning Path</div>
      <p className="muted">
        {nextIndex === -1
          ? "You finished every lesson. Amazing!"
          : `Next: ${lessons[nextIndex].sub}`}
      </p>

      <div className="path">
        {(nextIndex !== -1 && (
          <button className="path-continue" onClick={() => handlePlay(next)}>
            &#9654; {isCompleted(next) ? "Revise" : "Start"} {lessons[next].sub}
          </button>
        )) || (
          <button className="path-continue" onClick={() => handlePlay(0)}>
            &#9654; Review the path
          </button>
        )}

        {lessons.map((lesson, i) => {
          const locked = !isUnlocked(i);
          const done = isCompleted(i);
          const isNext = i === nextIndex;
          return (
            <button
              key={lesson.sub}
              className={
                "path-node" +
                (done ? " done" : "") +
                (locked ? " locked" : "") +
                (isNext ? " next" : "")
              }
              onClick={() => handlePlay(i)}
              disabled={locked}
            >
              <span className="node-icon">{done ? "\u2713" : locked ? "\u{1F512}" : lesson.terms.length}</span>
              <span className="node-label">{lesson.sub}</span>
              <span className="node-meta">
                {done ? "Completed" : locked ? "Locked" : `${lesson.terms.length} terms`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
