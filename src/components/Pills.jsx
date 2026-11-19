import { useEffect, useState, useRef } from "react";
import { LuHeart, LuTimer, LuZap, LuPartyPopper, LuStar, LuFlame } from "react-icons/lu";
import { useSnack } from "./Snackbar.jsx";
import { playWin } from "../lib/sound.js";
import { XP } from "../lib/XP.js";
import { navigate } from "../lib/router.js";

const MAX_HEARTS = 5;

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// The live hearts / XP / streak pill cluster. Extracted from TopBar so both
// the chrome and the Plan page render the same pills.
export default function Pills({ xp, streak, level, hearts, nextHeartMs = 0, boosts, sprint, onSprintEnd, onBuyLife }) {
  const snack = useSnack();
  const [countdown, setCountdown] = useState(nextHeartMs);
  const [showBuyMenu, setShowBuyMenu] = useState(false);
  const [sprintLeft, setSprintLeft] = useState(0);
  const sprintFinishedRef = useRef(false);
  const sprintEndRef = useRef(onSprintEnd);
  sprintEndRef.current = onSprintEnd;

  const canBuy = hearts < MAX_HEARTS && xp >= XP.heartCost;

  const handleHeartClick = () => {
    if (hearts >= MAX_HEARTS) return;
    setShowBuyMenu((v) => !v);
  };

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
          snack("Sprint complete!", LuPartyPopper);
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

  // close menus when tapping outside
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
    <div className="pv2-pills">
      {sprint && (
        <button
          className="badge badge-sprint"
          title="Study sprint running — timer keeps going on every screen. Tap to see it."
          onClick={() => navigate("/sprint")}
        >
          <LuTimer size={14} /> {formatCountdown(sprintLeft)}
        </button>
      )}
      <div className="badge-hearts-wrap">
        <button className="badge badge-hearts" onClick={handleHeartClick} aria-label="Hearts">
          <LuHeart size={17} fill="#FF4B4B" strokeWidth={0} /> {hearts}
          {nextHeartMs > 0 && countdown > 0 && (
            <span className="heart-timer" title="Next heart in"><span className="heart-timer-dot">·</span>{formatCountdown(countdown)}</span>
          )}
        </button>
        {showBuyMenu && hearts < MAX_HEARTS && (
          <div className="topbar-buy-menu">
            <p className="topbar-buy-title">Buy a life?</p>
            <button className="btn btn-primary btn-sm" disabled={!canBuy} onClick={() => { onBuyLife && onBuyLife(); setShowBuyMenu(false); }}>
              <LuHeart /> +1 life &middot; {XP.heartCost} XP
            </button>
            {!canBuy && xp < XP.heartCost && (
              <p className="topbar-buy-hint">Need {XP.heartCost} XP ({xp} available)</p>
            )}
          </div>
        )}
      </div>
      <span className="badge badge-xp">
        <LuStar size={16} fill="#FFC800" strokeWidth={0} /> {xp.toLocaleString()} XP &middot; Lv {level}
      </span>
      <span className={"badge badge-streak " + streakClass}>
        <LuFlame size={16} fill="#FF9600" strokeWidth={0} /> {streak}
      </span>
      {(boosts && boosts.xp2x > 0) && (
        <span className="badge badge-xp" title="2x XP active"><LuZap size={14} />&times;2</span>
      )}
    </div>
  );
}
