import { useState, useEffect } from "react";
import { useHashRoute, navigate } from "./lib/router.js";
import { loadState, saveState, markPractice, levelFromXp } from "./lib/storage.js";
import { SnackProvider } from "./components/Snackbar.jsx";
import TopBar from "./components/TopBar.jsx";
import Home from "./components/Home.jsx";
import SubjectHome from "./components/SubjectHome.jsx";
import Glossary from "./components/Glossary.jsx";
import Quiz from "./components/Quiz.jsx";
import PastPapers from "./components/PastPapers.jsx";
import Staircase from "./components/Staircase.jsx";
import { getSubject, PAST_PAPERS } from "./data/index.js";

export default function App() {
  const route = useHashRoute();
  const [state, setState] = useState(() => loadState());
  const { parts } = route;

  useEffect(() => {
    saveState(state);
  }, [state]);

  // streak banner on first open of a new day
  useEffect(() => {}, []);

  const addXp = (amount) => {
    setState((s) => markPractice({ ...s, xp: s.xp + amount }));
  };

  const recordResult = (subjectKey, difficulty, correct) => {
    setState((s) => {
      const key = `${subjectKey}.${difficulty}`;
      const prev = s.quizScores[key] || { best: 0, attempts: 0 };
      const next = { best: prev.best, attempts: prev.attempts + 1 };
      return { ...s, quizScores: { ...s.quizScores, [key]: next } };
    });
  };

  const toggleLearned = (key) => {
    setState((s) => {
      const learned = { ...s.learnedTerms };
      if (learned[key]) delete learned[key];
      else learned[key] = true;
      return { ...s, learnedTerms: learned };
    });
  };

  const recordWrong = ({ subject, qid }) => {
    setState((s) => {
      const list = s.wrongAnswers.slice();
      const found = list.find((w) => w.subject === subject && w.qid === qid);
      if (found) {
        found.count += 1;
        found.lastWrong = Date.now();
      } else {
        list.push({ subject, qid, count: 1, lastWrong: Date.now() });
      }
      return { ...s, wrongAnswers: list };
    });
  };

  const completeLesson = (key) => {
    setState((s) => {
      if (s.completedLessons[key]) return s;
      return {
        ...markPractice(s),
        xp: s.xp + 20,
        completedLessons: { ...s.completedLessons, [key]: true },
      };
    });
  };

  const passSummit = (key) => {
    setState((s) => {
      if (s.passedSummit[key]) return s;
      return {
        ...markPractice(s),
        xp: s.xp + 30,
        passedSummit: { ...s.passedSummit, [key]: true },
      };
    });
  };

  const level = levelFromXp(state.xp);

  // Determine screen title + back button
  let title = "StudyBuddy";
  let showBack = false;
  let content;
  let subjectKey = null;

  if (parts[0] === "subject") {
    subjectKey = parts[1];
    const subj = getSubject(subjectKey);
    const section = parts[2];
    if (!section) {
      title = subj ? subj.name : "Subject";
      showBack = true;
      content = <SubjectHome subjectKey={subjectKey} />;
    } else if (section === "path") {
      title = "Stairs";
      showBack = true;
      content = (
        <Staircase
          subjectKey={subjectKey}
          completed={state.completedLessons}
          passedSummit={state.passedSummit}
          onCompleteLesson={completeLesson}
          onPassSummit={passSummit}
        />
      );
    } else if (section === "glossary") {
      title = "Glossary";
      showBack = true;
      content = (
        <Glossary subjectKey={subjectKey} onToggleLearned={toggleLearned} />
      );
    } else if (section === "quiz") {
      title = "Quiz";
      showBack = true;
      content = (
        <Quiz
          subjectKey={subjectKey}
          level={level}
          onAddXp={addXp}
          onRecordResult={recordResult}
          onWrongAnswer={recordWrong}
        />
      );
    }
  } else if (parts[0] === "past-papers") {
    title = "Past Papers";
    showBack = true;
    content = <PastPapers onAddXp={addXp} />;
  } else {
    content = <Home />;
  }

  return (
    <SnackProvider>
      <TopBar title={title} showBack={showBack} xp={state.xp} streak={state.streak} level={level} />
      <main className="app">{content}</main>
    </SnackProvider>
  );
}
