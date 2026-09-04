import { useState, useEffect } from "react";
import { useHashRoute, navigate, goBack } from "./lib/router.js";
import { loadState, saveState, markPractice, levelFromXp, healHearts, loseHeart, msUntilNextHeart, MAX_HEARTS } from "./lib/storage.js";
import { XP } from "./lib/XP.js";
import { SnackProvider } from "./components/Snackbar.jsx";
import TopBar from "./components/TopBar.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import Home from "./components/Home.jsx";
import SubjectHome from "./components/SubjectHome.jsx";
import Glossary from "./components/Glossary.jsx";
import Quiz from "./components/Quiz.jsx";
import PastPapers from "./components/PastPapers.jsx";
import Staircase from "./components/Staircase.jsx";
import Learn from "./components/Learn.jsx";
import MockExam from "./components/MockExam.jsx";
import ProgressReport from "./components/ProgressReport.jsx";
import Settings from "./components/Settings.jsx";
import Store from "./components/Store.jsx";
import ReviewMistakes from "./components/ReviewMistakes.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import { StoreContext } from "./components/StoreContext.jsx";
import { SKIN_MAP, THEME_MAP, BOOST_MAP } from "./lib/store.js";
import { getSubject, PAST_PAPERS } from "./data/index.js";

// how much XP it costs to buy one life (only way to spend XP in the app)
const LIFE_COST_XP = 50;

export default function App() {
  const route = useHashRoute();
  const [state, setState] = useState(() => healHearts(loadState()));
  const [nextHeartMs, setNextHeartMs] = useState(0);
  // true when a quiz or lesson run is in progress (used for leave confirmation)
  const [runActive, setRunActive] = useState(false);
  // true when a hearts-consuming run is active (quiz, stairs, past papers — NOT learn)
  const [livesRunActive, setLivesRunActive] = useState(false);
  // when set to a message, shows a leave-confirmation modal
  const [leavePrompt, setLeavePrompt] = useState(null);
  // true when lives run out mid-run -> persistent buy/quit modal
  const [outOfLives, setOutOfLives] = useState(false);
  // splash screen shown once on load (~3s)
  const [showSplash, setShowSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  // true when the device has no internet connection
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const { parts } = route;

  useEffect(() => {
    if (!showSplash) return;
    const leaveTimer = setTimeout(() => setSplashLeaving(true), 2600);
    const dismissTimer = setTimeout(() => setShowSplash(false), 3000);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(dismissTimer);
    };
  }, [showSplash]);

  // track online/offline so the app can show a "works offline" banner
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply the equipped theme to the document root so CSS can style the app.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme || "day");
  }, [state.theme]);

  // when lives hit 0 during a hearts-consuming run, show the persistent buy/quit modal
  useEffect(() => {
    if (state.hearts === 0 && livesRunActive) {
      setOutOfLives(true);
    } else if (state.hearts > 0) {
      setOutOfLives(false);
    }
  }, [state.hearts, livesRunActive]);

  // show live countdown until the next heart restores (0 when full)
  useEffect(() => {
    if (state.hearts >= MAX_HEARTS) {
      setNextHeartMs(0);
      return;
    }
    const update = () => setNextHeartMs(msUntilNextHeart(state));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [state.hearts]);

  // streak banner on first open of a new day
  useEffect(() => {}, []);

  const addXp = (amount) => {
    setState((s) => {
      const boosted = (s.boosts?.xp2x || 0) > 0 && amount > 0;
      const awarded = boosted ? amount * 2 : amount;
      return markPractice({
        ...s,
        xp: s.xp + awarded,
        boosts: boosted
          ? { ...s.boosts, xp2x: s.boosts.xp2x - 1 }
          : s.boosts,
      });
    });
  };

  // deduct a heart on a wrong answer
  const loseAHeart = () => {
    setState((s) => loseHeart(s));
  };

  // spend XP to buy back one life
  const buyLife = () => {
    setState((s) => {
      if (s.xp < LIFE_COST_XP || s.hearts >= MAX_HEARTS) return s;
      return { ...s, xp: s.xp - LIFE_COST_XP, hearts: s.hearts + 1 };
    });
    setOutOfLives(false);
  };

  // quit the current run and leave; restores no progress
  const quitRun = () => {
    setOutOfLives(false);
    setRunActive(false);
    setLivesRunActive(false);
    navigate(goBack(parts));
  };

  const recordResult = (subjectKey, difficulty, correct, total) => {
    setState((s) => {
      const key = `${subjectKey}.${difficulty}`;
      const prev = s.quizScores[key] || { best: 0, attempts: 0 };
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      const best = Math.max(prev.best, pct);
      const next = { best, attempts: prev.attempts + 1 };
      return { ...s, quizScores: { ...s.quizScores, [key]: next } };
    });
  };

  const toggleLearned = (key) => {
    setState((s) => {
      const learned = { ...s.learnedTerms };
      const wasLearned = !!learned[key];
      if (wasLearned) {
        delete learned[key];
        return { ...s, learnedTerms: learned };
      }
      // first-time learn: award XP (anti-spam — no XP for unmark/re-mark)
      learned[key] = true;
      return markPractice({ ...s, xp: s.xp + XP.perTermLearned, learnedTerms: learned });
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

  // remove a question from the mistakes bank once answered correctly in review
  const clearWrong = (subject, qid) => {
    setState((s) => ({
      ...s,
      wrongAnswers: s.wrongAnswers.filter((w) => !(w.subject === subject && w.qid === qid)),
    }));
  };

  const completeLesson = (key) => {
    setState((s) => {
      if (s.completedLessons[key]) return s;
      return {
        ...markPractice(s),
        xp: s.xp + XP.lessonComplete,
        completedLessons: { ...s.completedLessons, [key]: true },
      };
    });
  };

  const passSummit = (key) => {
    setState((s) => {
      if (s.passedSummit[key]) return s;
      return {
        ...markPractice(s),
        xp: s.xp + XP.summitPass,
        passedSummit: { ...s.passedSummit, [key]: true },
      };
    });
  };

  const level = levelFromXp(state.xp);

  // clear all saved progress (Settings -> reset)
  const resetProgress = () => {
    localStorage.removeItem("studybuddy.v1");
    setState(healHearts(loadState()));
    setOutOfLives(false);
    setRunActive(false);
    setLivesRunActive(false);
  };

  // ----- store actions (buy with XP) -----
  const canAfford = (price) => state.xp >= price;

  const buyHearts = (amount = 3, price = 60) => {
    if (!canAfford(price) || state.hearts >= MAX_HEARTS) return false;
    const added = Math.min(amount, MAX_HEARTS - state.hearts);
    if (added <= 0) return false;
    setState((s) => ({
      ...s,
      xp: s.xp - price,
      hearts: s.hearts + added,
      heartsUpdatedAt: Date.now(),
    }));
    return true;
  };

  const buySkin = (key) => {
    const info = SKIN_MAP[key];
    if (!info || info.free || !canAfford(info.price)) return false;
    if (state.ownedSkins.includes(key)) return equipSkin(key);
    setState((s) => ({
      ...s,
      xp: s.xp - info.price,
      ownedSkins: [...s.ownedSkins, key],
      skin: key,
    }));
    return true;
  };

  const equipSkin = (key) => {
    if (!state.ownedSkins.includes(key)) return false;
    setState((s) => ({ ...s, skin: key }));
    return true;
  };

  const buyTheme = (key) => {
    const info = THEME_MAP[key];
    if (!info || info.free || !canAfford(info.price)) return false;
    setState((s) => ({ ...s, xp: s.xp - info.price, ownedThemes: [...s.ownedThemes, key] }));
    return true;
  };

  const equipTheme = (key) => {
    if (!state.ownedThemes.includes(key)) return false;
    setState((s) => ({ ...s, theme: key }));
    return true;
  };

  const buyBoost = (key) => {
    const info = BOOST_MAP[key];
    if (!info || !canAfford(info.price)) return false;
    const qty = info.qty || 1;
    setState((s) => ({
      ...s,
      xp: s.xp - info.price,
      boosts: { ...s.boosts, [key]: (s.boosts[key] || 0) + qty },
    }));
    return true;
  };

  const storeValue = {
    state,
    xp: state.xp,
    ownedSkins: state.ownedSkins,
    skin: state.skin,
    ownedThemes: state.ownedThemes,
    theme: state.theme,
    buyHearts,
    buySkin,
    equipSkin,
    buyTheme,
    equipTheme,
    buyBoost,
  };

  // Back button: confirm before leaving a quiz or an active lesson run.
  const handleBack = () => {
    const inQuiz = parts[0] === "subject" && parts[2] === "quiz";
    const inLesson =
      parts[0] === "subject" && (parts[2] === "path" || parts[2] === "learn");
    if ((inQuiz && runActive) || (inLesson && runActive)) {
      setLeavePrompt(
        inQuiz
          ? "Leave the quiz? Your progress in this run will be lost."
          : "Leave the lesson? Your progress in this run will be lost."
      );
    } else {
      navigate(goBack(parts));
    }
  };

  const confirmLeave = () => {
    setLeavePrompt(null);
    setRunActive(false);
    setLivesRunActive(false);
    navigate(goBack(parts));
  };

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
    } else if (section === "learn") {
      title = "Learn";
      showBack = true;
      content = (
        <Learn
          subjectKey={subjectKey}
          onAddXp={addXp}
          onRunActiveChange={setRunActive}
        />
      );
    } else if (section === "path") {
      title = "Stairs";
      showBack = true;
      content = (
        <Staircase
          subjectKey={subjectKey}
          completed={state.completedLessons}
          passedSummit={state.passedSummit}
          hearts={state.hearts}
          onAddXp={addXp}
          onLoseHeart={loseAHeart}
          onCompleteLesson={completeLesson}
          onPassSummit={passSummit}
          onRunActiveChange={setRunActive}
          onLivesRunChange={setLivesRunActive}
        />
      );
    } else if (section === "glossary") {
      title = "Glossary";
      showBack = true;
      content = (
        <Glossary
          subjectKey={subjectKey}
          onToggleLearned={toggleLearned}
          onAddXp={addXp}
          onLoseHeart={loseAHeart}
          hearts={state.hearts}
          learnedTerms={state.learnedTerms}
        />
      );
    } else if (section === "quiz") {
      title = "Quiz";
      showBack = true;
      content = (
        <Quiz
          subjectKey={subjectKey}
          level={level}
          hearts={state.hearts}
          onAddXp={addXp}
          onLoseHeart={loseAHeart}
          onRecordResult={recordResult}
          onWrongAnswer={recordWrong}
          onRunActiveChange={setRunActive}
          onLivesRunChange={setLivesRunActive}
        />
      );
    }
  } else if (parts[0] === "past-papers") {
    title = "Past Papers";
    showBack = true;
    content = <PastPapers onAddXp={addXp} onLoseHeart={loseAHeart} hearts={state.hearts} onRunActiveChange={setRunActive} onLivesRunChange={setLivesRunActive} />;
  } else if (parts[0] === "mock-exam") {
    title = "Mock Exam";
    showBack = true;
    content = <MockExam onAddXp={addXp} onComplete={() => navigate("/")} />;
  } else if (parts[0] === "progress") {
    title = "Progress Report";
    showBack = true;
    content = <ProgressReport state={state} />;
  } else if (parts[0] === "settings") {
    title = "Settings";
    showBack = true;
    content = <Settings onReset={resetProgress} />;
  } else if (parts[0] === "store") {
    title = "Shop";
    showBack = true;
    content = <Store />;
  } else if (parts[0] === "review") {
    title = "Review Mistakes";
    showBack = true;
    content = (
      <ReviewMistakes
        wrongAnswers={state.wrongAnswers}
        onAddXp={addXp}
        onLoseHeart={loseAHeart}
        onClearWrong={clearWrong}
        onRunActiveChange={setRunActive}
        onLivesRunChange={setLivesRunActive}
      />
    );
  } else {
    content = <Home />;
  }

  return (
    <StoreContext.Provider value={storeValue}>
      <SnackProvider>
        <TopBar
          title={title}
          showBack={showBack}
          xp={state.xp}
          streak={state.streak}
          level={level}
        hearts={state.hearts}
        nextHeartMs={nextHeartMs}
        boosts={state.boosts}
        onBack={handleBack}
        onBuyLife={buyLife}
      />
        <main className="app">{content}</main>
      {leavePrompt && (
        <ConfirmDialog
          title="Leave?"
          message={leavePrompt}
          confirmLabel="Leave"
          cancelLabel="Stay"
          onConfirm={confirmLeave}
          onCancel={() => setLeavePrompt(null)}
        />
      )}
      {outOfLives && (
        <div className="modal-backdrop">
          <div className="card modal">
            <div className="modal-title">Out of lives!</div>
            <p className="modal-def">
              You ran out of hearts in the middle of this run.
            </p>
            <p className="modal-def muted">
              Quit to lose your progress here, or buy a life to keep going.
            </p>
            <div className="spacer" />
            <button
              className="btn btn-primary mt"
              disabled={state.xp < LIFE_COST_XP}
              onClick={buyLife}
            >
              &#10084;&#65039; Buy a life &#183; {LIFE_COST_XP} XP
            </button>
            {state.xp < LIFE_COST_XP && (
              <p className="center muted hint mt">
                You don't have enough XP yet ({state.xp}/{LIFE_COST_XP}).
              </p>
            )}
            <button className="btn btn-danger mt" onClick={quitRun}>
              Quit &#38; lose progress
            </button>
          </div>
        </div>
      )}
      {isOffline && (
        <div className="offline-banner">
          <span className="offline-dot" />
          Offline mode &middot; works without internet
        </div>
      )}
    </SnackProvider>
      {showSplash && <SplashScreen leaving={splashLeaving} />}
    </StoreContext.Provider>
  );
}
