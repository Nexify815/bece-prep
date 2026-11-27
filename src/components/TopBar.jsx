import { useEffect, useState } from "react";
import {
  LuArrowLeft, LuStar,
  LuShoppingBag, LuSettings, LuEllipsis, LuCircleHelp, LuRefreshCw, LuGraduationCap, LuCloud, LuSun, LuMoon,
} from "react-icons/lu";
import { parseHash, goBack, navigate } from "../lib/router.js";
import Pills from "./Pills.jsx";

// PWA refresh: the service worker serves the old bundle, so a plain reload
// keeps showing stale content. Drop the caches + the worker, then reload.
async function hardRefresh() {
  try {
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // ignore — fall through to the reload anyway
  }
  window.location.reload();
}

export default function TopBar({ title, subtitle, showBack, xp, streak, level, hearts, nextHeartMs = 0, boosts, sprint, theme = "day", onThemeToggle, onSprintEnd, onBack, onBuyLife, pillsOnly = false, planPage = false, shopPage = false, subjectPage = false, progressPage = false, settingsPage = false, morePage = false, learnPage = false, glossaryPage = false }) {
  const [showMore, setShowMore] = useState(false);

  // close the "more" menu when tapping outside
  useEffect(() => {
    if (!showMore) return;
    const close = (e) => {
      if (!e.target.closest(".topbar-more-wrap")) setShowMore(false);
    };
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [showMore]);

  // Escape closes the same menu for keyboard users
  useEffect(() => {
    if (!showMore) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowMore(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMore]);

  // hidden dev refresh: Ctrl+Shift+R (not shipped as a visible button)
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        hardRefresh();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={"topbar" + (pillsOnly ? " topbar-home" : "") + (planPage ? " topbar-plan" : "") + (shopPage ? " topbar-shop" : "") + (subjectPage ? " topbar-subject" : "") + (progressPage ? " topbar-progress" : "") + (settingsPage ? " topbar-settings" : "") + (morePage ? " topbar-morepage" : "") + (learnPage ? " topbar-learn" : "") + (glossaryPage ? " topbar-glossary" : "")}>
      {!pillsOnly && !planPage && !shopPage && !subjectPage && !progressPage && !settingsPage && !morePage && !learnPage && !glossaryPage && parseHash().parts[0] !== "exam" && (
        <button
          className="exam-corner-btn"
          aria-label="Exam Mode"
          title="Exam Mode — cram without hearts or XP"
          onClick={() => navigate("/exam")}
        >
          <LuGraduationCap size={20} />
        </button>
      )}
      <button
        className={"back-btn" + (showBack ? " show" : "")}
        aria-label="Back"
        onClick={() => (onBack ? onBack() : navigate(goBack(parseHash().parts)))}
      >
        <LuArrowLeft size={22} />
      </button>
      <div className={"topbar-title" + (title === "StudyBuddy" ? " brand-title" : "")}>
        <span className="brand-star"><LuStar size={14} /></span>
        <span>{title}</span>
        {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
      </div>
      <div className="topbar-stats">
        <Pills xp={xp} streak={streak} level={level} hearts={hearts} nextHeartMs={nextHeartMs} boosts={boosts} sprint={sprint} onSprintEnd={onSprintEnd} onBuyLife={onBuyLife} />
        {!pillsOnly && !planPage && !shopPage && !subjectPage && !progressPage && !settingsPage && !morePage && !learnPage && !glossaryPage && (
          <>
            <button
              className="setting-btn theme-toggle"
              aria-label="Night mode"
              title={theme === "night" ? "Switch to day theme" : "Switch to night theme"}
              onClick={() => onThemeToggle && onThemeToggle(theme === "night" ? "day" : "night")}
            >
              {theme === "night" ? <LuSun size={20} /> : <LuMoon size={20} />}
            </button>
            <button
              className="setting-btn"
              aria-label="Refresh app"
              title="Refresh app (clears cache)"
              onClick={hardRefresh}
            >
              <LuRefreshCw size={18} />
            </button>
            <div className="topbar-more-wrap">
              <button
                className="setting-btn"
                aria-label="More menu"
                title="More"
                onClick={() => setShowMore((v) => !v)}
              >
                <LuEllipsis size={20} />
              </button>
              {showMore && (
                <div className="topbar-more-menu">
                  <button
                    className="topbar-more-item"
                    onClick={() => { setShowMore(false); navigate("/store"); }}
                  >
                    <LuShoppingBag size={16} /> Shop
                  </button>
                  <button
                    className="topbar-more-item"
                    onClick={() => { setShowMore(false); navigate("/settings"); }}
                  >
                    <LuSettings size={16} /> Settings
                  </button>
                  <button
                    className="topbar-more-item"
                    onClick={() => { setShowMore(false); navigate("/backup"); }}
                  >
                    <LuCloud size={16} /> Backup
                  </button>
                  <button
                    className="topbar-more-item"
                    onClick={() => { setShowMore(false); navigate("/help"); }}
                  >
                    <LuCircleHelp size={16} /> Help
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
