import { useEffect, useState, useRef } from "react";
import {
  FiArrowLeft, FiStar, FiHeart, FiClock, FiZap,
  FiShoppingBag, FiSettings,
} from "react-icons/fi";
import { LuFlame, LuTimer, LuSparkles } from "react-icons/lu";
import { parseHash, goBack, navigate } from "../lib/router.js";
import { useSnack } from "./Snackbar.jsx";
import { playWin } from "../lib/sound.js";
import { XP } from "../lib/XP.js";

const MAX_HEARTS = 5;

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TopBar({ title, showBack, xp, streak, level, hearts, nextHeartMs = 0, boosts, sprint, onSprintEnd, onBack, onBuyLife }) {
  const snack = useSnack();
  const [countdown, setCountdown] = useState(nextHeartMs);
  const [showBuyMenu, setShowBuyMenu] = useState(false);
  const [sprintLeft, setSprintLeft] = useState(0);
  const sprintFinishedRef = useRef(false);
  // keep the latest callback without restarting the ticker
  const sprintEndRef = useRef(onSprintEnd);
  sprintEndRef.current = onSprintEnd;

  useEffect(() => {
    setCountdown(nextHeartMs);
    if (nextHeartMs <= 0) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1000) {
          clearInterval(id);
          return 0;
        }
        return c - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [nextHeartMs]);

  const canBuy = hearts < MAX_HEARTS && xp >= XP.heartCost;

  const handleHeartClick = () => {
    if (hearts >= MAX_HEARTS) return;
    setShowBuyMenu((v) => !v);
  };

  const handleBuy = () => {
    if (onBuyLife) onBuyLife();
    setShowBuyMenu(false);
  };

  useEffect(() => {
    setSprintLeft(0);
    sprintFinishedRef.current = false;
    if (!sprint) return;
    let id = null;
    const tick = () => {
      const left = sprint.endsAt - Date.now();
      if (left <= 0) {
        setSprintLeft(0);
        if (id) clearInterval(id);
        if (!sprintFinishedRef.current) {
          sprintFinishedRef.current = true;
          if (sprintEndRef.current) sprintEndRef.current();
          snack("Sprint complete! \u{1F389}");
          playWin();
        }
        return;
      }
      setSprintLeft(left);
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sprint?.endsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // close menu when tapping outside
  useEffect(() => {
    if (!showBuyMenu) return;
    const close = (e) => {
      if (!e.target.closest(".badge-hearts-wrap")) setShowBuyMenu(false);
    };
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [showBuyMenu]);

  const streakClass =
    streak >= 7 ? "streak-fire streak-fire-hot" : streak >= 3 ? "streak-fire" : "";

  return (
    <header className="topbar">
      <button
        className={"back-btn" + (showBack ? " show" : "")}
        aria-label="Back"
        onClick={() => (onBack ? onBack() : navigate(goBack(parseHash().parts)))}
      >
        <FiArrowLeft size={22} />
      </button>
      <div className="topbar-title">
        <span className="brand-star"><FiStar size={14} /></span>
        <span>{title}</span>
      </div>
      <div className="topbar-stats">
        {sprint && (
          <button
            className="badge badge-sprint"
            title="Study sprint running — timer keeps going on every screen. Tap to see it."
            onClick={() => navigate("/sprint")}
          >
            <LuTimer size={14} /> {formatCountdown(sprintLeft)}
          </button>
        )}
        <div className="badge badge-hearts-wrap">
          <button
            className="badge badge-hearts"
            onClick={handleHeartClick}
            aria-label="Hearts"
          >
            <FiHeart size={14} /> {hearts}
            {nextHeartMs > 0 && countdown > 0 && (
              <span className="heart-timer" title="Next heart in"><FiClock size={12} />{formatCountdown(countdown)}</span>
            )}
          </button>
          {showBuyMenu && hearts < MAX_HEARTS && (
            <div className="topbar-buy-menu">
              <p className="topbar-buy-title">Buy a life?</p>
              <button
                className="btn btn-primary btn-sm"
                disabled={!canBuy}
                onClick={handleBuy}
              >
                <FiHeart /> +1 life &middot; {XP.heartCost} XP
              </button>
              {!canBuy && xp < XP.heartCost && (
                <p className="topbar-buy-hint">Need {XP.heartCost} XP ({xp} available)</p>
              )}
              {hearts >= MAX_HEARTS && (
                <p className="topbar-buy-hint">Already full</p>
              )}
            </div>
          )}
        </div>
        <span className="badge badge-xp">
          <LuSparkles size={14} /> {xp} XP &middot; Lv {level}
        </span>
        <span className={"badge badge-streak " + streakClass}>
          <LuFlame size={14} /> {streak}
        </span>
        {(boosts && boosts.xp2x > 0) && (
          <span className="badge badge-xp" title="2x XP active"><FiZap size={14} />&times;2</span>
        )}
        <span className="desktop-only">
          <button
            className="setting-btn"
            aria-label="Shop"
            title="Shop"
            onClick={() => navigate("/store")}
          >
            <FiShoppingBag size={20} />
          </button>
          <button
            className="setting-btn"
            aria-label="Settings"
            title="Settings"
            onClick={() => navigate("/settings")}
          >
            <FiSettings size={20} />
          </button>
        </span>
      </div>
    </header>
  );
}