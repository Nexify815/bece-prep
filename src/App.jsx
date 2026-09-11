import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useHashRoute, navigate, goBack, previousHash } from "./lib/router.js";
import { loadState, saveState, markPractice, levelFromXp, healHearts, loseHeart, msUntilNextHeart, addUsage, todayKey, MAX_HEARTS, addXpLog, sanitizeState } from "./lib/storage.js";
import { XP } from "./lib/XP.js";
import { scheduleSRS } from "./lib/srs.js";
import { SnackProvider } from "./components/Snackbar.jsx";
import TopBar from "./components/TopBar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import LevelUpWatcher from "./components/LevelUpWatcher.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import Home from "./components/Home.jsx";
import SubjectHome from "./components/SubjectHome.jsx";
import Staircase from "./components/Staircase.jsx";
import Learn from "./components/Learn.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import Drill from "./components/Drill.jsx";
import SprintScreen from "./components/SprintScreen.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import SectionB from "./components/SectionB.jsx";

// ---- lazy-loaded routes (split into separate chunks, loaded on demand) ----
const Glossary = lazy(() => import("./components/Glossary.jsx"));
const SubjectFlashcards = lazy(() => import("./components/SubjectFlashcards.jsx"));
const Quiz = lazy(() => import("./components/Quiz.jsx"));
const PastPapers = lazy(() => import("./components/PastPapers.jsx"));
const MockExam = lazy(() => import("./components/MockExam.jsx"));
const ProgressReport = lazy(() => import("./components/ProgressReport.jsx"));
const Settings = lazy(() => import("./components/Settings.jsx"));
const Store = lazy(() => import("./components/Store.jsx"));
const ReviewMistakes = lazy(() => import("./components/ReviewMistakes.jsx"));
const Schedule = lazy(() => import("./components/Schedule.jsx"));

function RouteLoading() {
  return <div className="route-loading">&#8987; Loading&hellip;</div>;
}
import { StoreContext } from "./components/StoreContext.jsx";
import { THEME_MAP, BOOST_MAP } from "./lib/store.js";
import { todayPlan, weekSnapshot } from "./lib/plan.js";
import { getSubject, PAST_PAPERS } from "./data/index.js";
import { onUser, fetchCloudState, seedCloudState, pushState, watchState, nextWriteId } from "./lib/firebase.js";

function syncErrorName(err) {
  const code = (err && (err.code || err.message)) || "";
  const s = String(code).toLowerCase();
  if (s.includes("permission-denied")) return "your database rules are blocking sync";
  if (s.includes("database does not exist") || s.includes("not found") || s.includes("network")) return "offline or the database isn't reachable yet";
  if (s.includes("unauth")) return "you're not signed in to the cloud";
  return code || "unknown error";
}

// Mark one Today's Plan step as completed on today's date. Each step's `id`
// (learn/glossary/quiz/final — or review/paper/mock/reflect on light days)
// is matched against the steps of today's plan so "Your next step" advances
// as each activity is actually finished. Idempotent: re-doing something never
// un-marks it and never double-counts.
function planStepDone(s, stepId) {
  const today = todayKey();
  return {
    ...(s.planDone || {}),
    [today]: {
      ...((s.planDone || {})[today] || {}),
      [stepId]: true,
    },
  };
}

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
  // splash screen shown only on the very first app launch (never on reloads)
  // active study sprint { mins, endsAt } — runs app-wide via the TopBar chip
  const [sprint, setSprint] = useState(null);
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !localStorage.getItem("sb_splash_seen");
    } catch {
      return false;
    }
  });
  const [splashLeaving, setSplashLeaving] = useState(false);
  // true when the device has no internet connection
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const { parts } = route;

  useEffect(() => {
    if (!showSplash) return;
    try {
      localStorage.setItem("sb_splash_seen", "1");
    } catch {
      /* storage unavailable — just fall back to showing on next load */
    }
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

  // ---- cloud sync (accounts + cross-device progress) ----
  // account from cloud sync ({ uid, username }) or null when not signed in
  const [account, setAccount] = useState(null);
  // short status of the last cloud sync attempt ("" until first attempt)
  const [syncStatus, setSyncStatus] = useState("");
  // write ids we've seen (ours + applied remote) so snapshots don't loop back
  const recentWritesRef = useRef(new Set());
  const stateRef = useRef(null);
  const lastCloudPushMs = useRef(0);
  const pushTimer = useRef(null);
  // false while the initial cloud state is being pulled after sign-in, so the
  // auto-push below can't overwrite the saved cloud progress with this
  // device's local values before the pull lands.
  const hydratedRef = useRef(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const markSynced = (p) => {
    Promise.resolve(p)
      .then(() => setSyncStatus("Saved to cloud"))
      .catch((err) => setSyncStatus("Sync issue: " + syncErrorName(err)));
  };

  // Manual "Sync now": push this device's progress up, then pull the newest
  // cloud state back down (so two devices converge on tap).
  const syncNow = async () => {
    if (!account) return;
    setSyncStatus("Syncing\u2026");
    const wid = nextWriteId();
    recentWritesRef.current.add(wid);
    try {
      await pushState(account.uid, stateRef.current, wid);
      setSyncStatus("Saved to cloud");
    } catch (err) {
      setSyncStatus("Sync issue: " + syncErrorName(err));
      return;
    }
    try {
      const cloud = await fetchCloudState(account.uid);
      if (!cloud || !cloud.state) return;
      if (!recentWritesRef.current.has(cloud.writeId)) {
        recentWritesRef.current.add(cloud.writeId);
        setState((cur) => healHearts(sanitizeState({ ...cur, ...cloud.state })));
      }
      setSyncStatus("Synced \u2713");
    } catch (err) {
      setSyncStatus("Sync issue: " + syncErrorName(err));
    }
  };

  // Track the signed-in user (no-op entirely when Firebase isn't configured).
  useEffect(() => {
    const off = onUser((fbUser) => {
      setAccount(
        fbUser
          ? { uid: fbUser.uid, username: String(fbUser.email || "").split("@")[0].toLowerCase() || "student" }
          : null
      );
    });
    return off;
  }, []);

  // When a user signs in: listen for changes from their other devices and
  // pull their saved cloud state once (newest write wins).
  useEffect(() => {
    if (!account) return;
    hydratedRef.current = false;
    let unsub = () => {};
    let cancelled = false;

    (async () => {
      unsub = watchState(
        account.uid,
        (data) => {
          if (!data?.writeId || recentWritesRef.current.has(data.writeId)) return;
          recentWritesRef.current.add(data.writeId);
          if (recentWritesRef.current.size > 100) recentWritesRef.current.clear();
          setState((cur) => healHearts(sanitizeState({ ...cur, ...data.state })));
        },
        (err) => setSyncStatus("Sync issue: " + syncErrorName(err))
      );

      let cloud;
      try {
        cloud = await fetchCloudState(account.uid);
      } catch (err) {
        if (!cancelled) setSyncStatus("Sync issue: " + syncErrorName(err));
        hydratedRef.current = true;
        return;
      }
      if (cancelled) return;
      if (cloud) {
        if (cloud.writeId) recentWritesRef.current.add(cloud.writeId);
        if (cloud.state) {
          setState((cur) => healHearts(sanitizeState({ ...cur, ...cloud.state })));
          if (!cancelled) setSyncStatus("Loaded your saved progress");
        } else {
          markSynced(seedCloudState(account.uid, stateRef.current));
        }
      } else {
        // no saved cloud progress yet — upload this device's progress now
        markSynced(seedCloudState(account.uid, stateRef.current));
      }
      hydratedRef.current = true;
    })();

    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.uid]);

  // Push progress to the cloud (throttled; also flushed when leaving the app).
  useEffect(() => {
    if (!account) return;
    const send = () => {
      if (!hydratedRef.current) return;
      const wid = nextWriteId();
      recentWritesRef.current.add(wid);
      markSynced(pushState(account.uid, state, wid));
      lastCloudPushMs.current = Date.now();
    };
    const schedule = () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      const elapsed = Date.now() - lastCloudPushMs.current;
      const remaining = 10000 - elapsed;
      pushTimer.current = setTimeout(send, remaining > 0 ? remaining : 0);
    };
    const flush = () => {
      const elapsed = Date.now() - lastCloudPushMs.current;
      if (elapsed > 500 && elapsed < 8000) send();
      // else: it's already syncing or still within the throttle window
    };
    schedule();
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, account?.uid]);

  // Daily active time: a plain stopwatch that keeps counting regardless of
  // focus/visibility. Uses wall-clock elapsed time so it catches up even if a
  // timer is throttled in the background. Batched so we don't re-render and
  // persist the whole app state every single second.
  const usageAccum = useRef(0);
  const usageFlush = () => {
    if (usageAccum.current <= 0) return;
    const secs = usageAccum.current;
    usageAccum.current = 0;
    setState((s) => addUsage(s, secs));
  };
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const secs = Math.floor((now - last) / 1000);
      last = now;
      if (secs > 0) {
        usageAccum.current += secs;
        usageFlush();
      }
    };
    const flushId = setInterval(tick, 10000);
    const onHide = () => tick();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(flushId);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the equipped theme to the document root so CSS can style the app.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme || "day");
  }, [state.theme]);

  // Freeze this week's subject order once on the Monday it starts. Without the
  // snapshot, today's focus re-ranks as the student studies (a completed lesson
  // makes a subject "stronger") and hops to the next weakest mid-day.
  useEffect(() => {
    setState((s) => {
      const snap = weekSnapshot(s);
      return s.planWeek && s.planWeek.weekKey === snap.weekKey ? s : { ...s, planWeek: snap };
    });
  }, [state.planWeek]);

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

  // apply a restored backup into the live state (newest wins per field)
  const restoreProgress = (backup) => {
    setState((cur) => healHearts(sanitizeState({ ...cur, ...backup })));
  };

  const addXp = (amount) => {
    setState((s) => {
      const boosted = (s.boosts?.xp2x || 0) > 0 && amount > 0;
      const awarded = boosted ? amount * 2 : amount;
      return addXpLog(
        markPractice({
          ...s,
          xp: s.xp + awarded,
          boosts: boosted
            ? { ...s.boosts, xp2x: s.boosts.xp2x - 1 }
            : s.boosts,
        }),
        awarded
      );
    });
  };

  // deduct a heart on a wrong answer
  const loseAHeart = () => {
    setState((s) => loseHeart(s));
  };

  // spend XP to buy back one life
  const buyLife = () => {
    setState((s) => {
      if (s.xp < XP.heartCost || s.hearts >= MAX_HEARTS) return s;
      return { ...s, xp: s.xp - XP.heartCost, hearts: s.hearts + 1 };
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
      const base = { ...s, quizScores: { ...s.quizScores, [key]: next } };
      const plan = todayPlan(s);
      if (plan.steps[2]?.id === "quiz" && subjectKey === plan.focus?.key) {
        return { ...base, planDone: planStepDone(s, "quiz") };
      }
      return base;
    });
  };

  // remember a question that was answered correctly this session; when every
  // question of a difficulty set is solved, that set is "complete"
  const markQuizSolved = (subjectKey, difficulty, qid) => {
    setState((s) => {
      const key = `${subjectKey}.${difficulty}`;
      const solved = { ...(s.quizSolved || {}) };
      const set = { ...(solved[key] || {}) };
      if (set[qid]) return s;
      set[qid] = true;
      solved[key] = set;
      return { ...s, quizSolved: solved };
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
      const base = markPractice({ ...s, xp: s.xp + XP.perTermLearned, learnedTerms: learned });
      // On a weekday this fills the glossary step (focus subject only); on a
      // light day it covers the "gentle glossary browse" review step.
      const plan = todayPlan(s);
      const subj = String(key).split(":")[0];
      let stepId = null;
      if (plan.steps[0]?.id === "review") stepId = "review";
      else if (plan.steps[1]?.id === "glossary" && subj === plan.focus?.key) stepId = "glossary";
      return stepId ? { ...base, planDone: planStepDone(s, stepId) } : base;
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
    setState((s) => {
      const next = { ...s, wrongAnswers: s.wrongAnswers.filter((w) => !(w.subject === subject && w.qid === qid)) };
      if (next.wrongAnswers.length > 0) return next;
      // Bank emptied — the "fix your mistakes" step is done.
      const plan = todayPlan(s);
      const stepId = plan.steps.find((x) => x.id === "review") != null
        ? "review"
        : plan.steps.find((x) => x.id === "final" && x.route === "/review") != null
          ? "final"
          : null;
      return stepId ? { ...next, planDone: planStepDone(s, stepId) } : next;
    });
  };

  // ---- settings prefs ----
  const updatePrefs = (partial) => {
    setState((s) => ({ ...s, ...partial }));
  };

  const setGoalSecs = (secs) => {
    setState((s) => ({ ...s, goalSecs: secs }));
  };

  const setNotifHour = (hour) => {
    setState((s) => ({ ...s, notifHour: hour }));
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
      try {
        Notification.requestPermission().catch(() => {});
      } catch {
        /* ignore */
      }
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification("StudyBuddy reminders ON", { body: "We'll nudge you if today's goal isn't done yet." }))
        .catch(() => {});
    }
  };

  // ---- daily reminder (minute check) ----
  useEffect(() => {
    if (!state.notifHour) return;
    const [h, m] = String(state.notifHour).split(":").map(Number);
    let lastSent = "";
    const check = () => {
      const now = new Date();
      const today = todayKey();
      const done = (state.usageSecs || {})[today] >= (state.goalSecs || 60 * 60);
      const target = new Date();
      target.setHours(h, m || 0, 0, 0);
      if (now < target) return;
      const key = today + "|" + state.notifHour;
      if (done || lastSent === key) return;
      lastSent = key;
      if (Notification.permission === "granted" && navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification("Time for StudyBuddy!", {
              body: `You've hit ${Math.round(((state.usageSecs || {})[today] || 0) / 60)} minutes today.`,
              tag: "daily-nudge",
              renotify: false,
            })
          )
          .catch(() => {});
      }
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.notifHour, state.goalSecs, state.usageSecs]);

  // ---- Question of the day ----
  const handleQotd = (q, correct) => {
    setState((s) => {
      if (s.qotdAnswered && s.qotdAnswered[todayKey()] !== undefined) {
        return s;
      }
      const base = { ...s, qotdAnswered: { ...(s.qotdAnswered || {}), [todayKey()]: { qid: q.id, correct: !!correct } } };
      if (!correct) return base;
      const boosted = (s.boosts?.xp2x || 0) > 0;
      const need = boosted ? s.boosts.xp2x : 1;
      const awarded = XP.qotd * (boosted ? 2 : 1);
      const next = addXpLog(markPractice({ ...base, xp: base.xp + awarded, boosts: boosted ? { ...base.boosts, xp2x: need - 1 } : base.boosts }), awarded);
      return next;
    });
  };

  // ---- monthly challenge claim ----
  const claimChallenge = (challenge) => {
    const month = challenge.month || todayKey().slice(5, 7);
    const reward = challenge.rewardXp || XP.challengeReward;
    setState((s) => {
      if (s.challengesClaimed && s.challengesClaimed[month]) return s;
      return addXpLog({ ...s, xp: s.xp + reward, challengesClaimed: { ...(s.challengesClaimed || {}), [month]: true }, badges: [...(s.badges || []), challenge.badge || ("challenge-" + month)] }, reward);
    });
  };

  // ---- study sprint (persists app-wide while it runs on the TopBar chip) ----
  const startSprint = (mins) => {
    setSprint({ mins, endsAt: Date.now() + mins * 60000 });
  };

  const cancelSprint = () => {
    setSprint(null);
  };

  // a full sprint finished — award XP + record it (once per sprint)
  const completeSprint = () => {
    if (!sprint) return;
    const mins = sprint.mins;
    const reward = mins >= 15 ? XP.sprint15 : XP.sprint10;
    setState((s) => {
      const doneSprint = (s.sprints || []).some((x) => x.date === todayKey());
      return addXpLog({ ...s, xp: s.xp + reward, sprints: [...(s.sprints || []), { date: todayKey(), mins, xp: reward }], badges: doneSprint ? s.badges : [...(s.badges || []), "sprint-badge"] }, reward);
    });
    setSprint(null);
  };

  // ---- worked solutions (XP unlock) ----
  const spendXp = (amount) => {
    setState((s) => {
      if (s.xp < amount) return s;
      return { ...s, xp: s.xp - amount };
    });
  };

  const unlockSolution = (qid) => {
    setState((s) => {
      if (s.xp < XP.solutionCost || (s.solutionsUnlocked && s.solutionsUnlocked[qid])) return s;
      return { ...s, xp: s.xp - XP.solutionCost, solutionsUnlocked: { ...(s.solutionsUnlocked || {}), [qid]: true } };
    });
  };

  // ---- mock exam history ----
  const recordMock = (m) => {
    setState((s) => {
      const base = {
        ...s,
        xp: s.xp,
        mockHistory: [...(s.mockHistory || []), { date: todayKey(), ...m }].slice(-50),
      };
      const plan = todayPlan(s);
      let stepId = null;
      if (plan.steps.some((x) => x.id === "mock")) stepId = "mock";
      else if (plan.steps.some((x) => x.id === "final" && x.route === "/mock-exam")) stepId = "final";
      return stepId ? { ...base, planDone: planStepDone(s, stepId) } : base;
    });
  };

  // past paper finished — counts toward the light-day "paper" step, or the
  // weekday "Exam practice" final step
  const recordPaper = () => {
    setState((s) => {
      const plan = todayPlan(s);
      const stepId = plan.steps.some((x) => x.id === "paper") ? "paper" : "final";
      return { ...s, planDone: planStepDone(s, stepId) };
    });
  };

  // ---- spaced repetition (glossary) ----
  const srsRecord = (key, correct) => {
    setState((s) => ({ ...s, srs: scheduleSRS(s.srs || {}, key, correct) }));
  };

  const completeLesson = (key) => {
    setState((s) => {
      if (s.completedLessons[key]) return s;
      const failedLessons = { ...(s.failedLessons || {}) };
      delete failedLessons[key];
      const base = {
        ...markPractice(s),
        xp: s.xp + XP.lessonComplete,
        completedLessons: { ...s.completedLessons, [key]: true },
        failedLessons,
      };
      // Completing today's focus-subject lesson fulfills the "learn" step.
      const plan = todayPlan(s);
      if (plan.steps[0]?.id === "learn" && String(key).startsWith((plan.focus?.key || "") + ":")) {
        return { ...base, planDone: planStepDone(s, "learn") };
      }
      return base;
    });
  };

  // Stairs strict mode: a failed lesson quiz locks its step until a 1-heart retry.
  const failLesson = (key) => {
    setState((s) => ({
      ...s,
      failedLessons: { ...(s.failedLessons || {}), [key]: true },
    }));
  };

  const clearFailLesson = (key) => {
    setState((s) => {
      const failedLessons = { ...(s.failedLessons || {}) };
      delete failedLessons[key];
      return { ...s, failedLessons };
    });
  };

  // ---- user-created glossary terms ----
  const addCustomTerm = (subjectKey, { term, definition, example }) => {
    setState((s) => ({
      ...s,
      customTerms: [
        ...(s.customTerms || []),
        { id: "custom-" + Date.now(), subjectKey, term, definition, example: example || "" },
      ],
    }));
  };

  const removeCustomTerm = (id) => {
    setState((s) => ({
      ...s,
      customTerms: (s.customTerms || []).filter((t) => t.id !== id),
    }));
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
    ownedThemes: state.ownedThemes,
    theme: state.theme,
    buyHearts,
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
    } else if (parts[0] === "settings") {
      // keep context: go back to wherever the user came from, not the landing
      navigate(previousHash());
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
      content = <SubjectHome subjectKey={subjectKey} passedSummit={state.passedSummit} />;
    } else if (section === "learn") {
      title = "Learn";
      showBack = true;
      content = (
        <Learn
          subjectKey={subjectKey}
          onAddXp={addXp}
          onRunActiveChange={setRunActive}
          onWrongAnswer={recordWrong}
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
          failedLessons={state.failedLessons || {}}
          hearts={state.hearts}
          onAddXp={addXp}
          onLoseHeart={loseAHeart}
          onCompleteLesson={completeLesson}
          onPassSummit={passSummit}
          onFailLesson={failLesson}
          onClearFailLesson={clearFailLesson}
          onRunActiveChange={setRunActive}
          onLivesRunChange={setLivesRunActive}
          onWrongAnswer={recordWrong}
        />
      );
    } else if (section === "flashcards") {
      title = "Flashcards";
      showBack = true;
      content = (
        <SubjectFlashcards
          subjectKey={subjectKey}
          passedSummit={state.passedSummit}
          onSRS={srsRecord}
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
          srs={state.srs || {}}
          onSRS={srsRecord}
          customTerms={state.customTerms || []}
          onAddCustom={(t) => addCustomTerm(subjectKey, t)}
          onRemoveCustom={removeCustomTerm}
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
          xp={state.xp}
          solutionsUnlocked={state.solutionsUnlocked || {}}
          onUnlockSolution={unlockSolution}
          onSpendXp={spendXp}
          onAddXp={addXp}
          onLoseHeart={loseAHeart}
          onRecordResult={recordResult}
          quizSolved={state.quizSolved || {}}
          onSolved={markQuizSolved}
          onWrongAnswer={recordWrong}
          onRunActiveChange={setRunActive}
          onLivesRunChange={setLivesRunActive}
        />
      );
    }
  } else if (parts[0] === "past-papers") {
    title = "Past Papers";
    showBack = true;
    content = <PastPapers onAddXp={addXp} onLoseHeart={loseAHeart} hearts={state.hearts} onWrongAnswer={recordWrong} onRunActiveChange={setRunActive} onLivesRunChange={setLivesRunActive} onComplete={recordPaper} />;
  } else if (parts[0] === "mock-exam") {
    title = "Mock Exam";
    showBack = true;
    content = <MockExam onAddXp={addXp} onComplete={() => navigate("/")} onRecord={recordMock} />;
  } else if (parts[0] === "progress") {
    title = "Progress Report";
    showBack = true;
    content = <ProgressReport state={state} />;
  } else if (parts[0] === "settings") {
    title = "Settings";
    showBack = true;
    content = (
      <Settings
        onReset={resetProgress}
        onRestore={restoreProgress}
        account={account}
        syncStatus={syncStatus}
        onSyncNow={syncNow}
        prefs={{ goalSecs: state.goalSecs, notifHour: state.notifHour, leaderboardOptIn: state.leaderboardOptIn, nickname: state.nickname }}
        onPrefs={updatePrefs}
        onGoalSecs={setGoalSecs}
        onNotifHour={setNotifHour}
      />
    );
  } else if (parts[0] === "store") {
    title = "Shop";
    showBack = true;
    content = <Store />;
  } else if (parts[0] === "schedule") {
    title = "Study Timetable";
    showBack = true;
    content = <Schedule state={state} />;
  } else if (parts[0] === "drill") {
    title = "Drills";
    showBack = true;
    content = (
      <Drill
        state={state}
        onAddXp={addXp}
        onLoseHeart={loseAHeart}
        onWrongAnswer={recordWrong}
        onClearWrong={clearWrong}
        onRunActiveChange={setRunActive}
        onLivesRunChange={setLivesRunActive}
      />
    );
  } else if (parts[0] === "sprint") {
    title = "Study Sprint";
    showBack = true;
    content = <SprintScreen sprint={sprint} onStart={startSprint} onCancel={cancelSprint} />;
  } else if (parts[0] === "leaderboard") {
    title = "Leaderboard";
    showBack = true;
    content = <Leaderboard state={state} account={account} />;
  } else if (parts[0] === "section-b") {
    title = "Section B - Writing";
    showBack = true;
    content = (
      <SectionB
        onAward={(subjectKey, termId) => {
          addXp(XP.essayReward);
          toggleLearned(`${subjectKey}:${termId}`);
        }}
      />
    );
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
  } else if (parts[0] === "home") {
    content = (
      <Home
        usageSecs={state.usageSecs || {}}
        goalSecs={state.goalSecs}
        state={state}
        onQotdAnswer={handleQotd}
        onClaimChallenge={claimChallenge}
      />
    );
  } else {
    // landing — Today's Plan is the new default screen (old Home moved to /home)
    content = <Schedule state={state} home />;
  }

  return (
    <StoreContext.Provider value={storeValue}>
      <SnackProvider>
        <LevelUpWatcher xp={state.xp} />
        <TopBar
          title={title}
          showBack={showBack}
          xp={state.xp}
          streak={state.streak}
          level={level}
        hearts={state.hearts}
        nextHeartMs={nextHeartMs}
        boosts={state.boosts}
        sprint={sprint}
        theme={state.theme}
        onThemeToggle={equipTheme}
        onSprintEnd={completeSprint}
        onBack={handleBack}
        onBuyLife={buyLife}
      />
        <main className="app">
      <Suspense fallback={<RouteLoading />}>{content}</Suspense>
    </main>
      {!runActive && <BottomNav parts={parts} />}
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
              disabled={state.xp < XP.heartCost}
              onClick={buyLife}
            >
              &#10084;&#65039; Buy a life &#183; {XP.heartCost} XP
            </button>
            {state.xp < XP.heartCost && (
              <p className="center muted hint mt">
                You don't have enough XP yet ({state.xp}/{XP.heartCost}).
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
