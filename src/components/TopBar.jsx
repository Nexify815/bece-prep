import { useEffect, useState } from "react";
import { parseHash, goBack, navigate } from "../lib/router.js";

const LIFE_COST_XP = 50;
const MAX_HEARTS = 5;

function formatCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TopBar({ title, showBack, xp, streak, level, hearts, nextHeartMs = 0, boosts, onBack, onBuyLife }) {
  const [countdown, setCountdown] = useState(nextHeartMs);
  const [showBuyMenu, setShowBuyMenu] = useState(false);

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

  const canBuy = hearts < MAX_HEARTS && xp >= LIFE_COST_XP;

  const handleHeartClick = () => {
    if (hearts >= MAX_HEARTS) return;
    setShowBuyMenu((v) => !v);
  };

  const handleBuy = () => {
    if (onBuyLife) onBuyLife();
    setShowBuyMenu(false);
  };

  // close menu when tapping outside
  useEffect(() => {
    if (!showBuyMenu) return;
    const close = (e) => {
      if (!e.target.closest(".badge-hearts-wrap")) setShowBuyMenu(false);
    };
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [showBuyMenu]);

  return (
    <header className="topbar">
      <button
        className={"back-btn" + (showBack ? " show" : "")}
        aria-label="Back"
        onClick={() => (onBack ? onBack() : navigate(goBack(parseHash().parts)))}
      >
        &#8592;
      </button>
      <div className="topbar-title">
        <span className="brand-star">&#9733;</span>
        <span>{title}</span>
      </div>
      <div className="topbar-stats">
        <div className="badge badge-hearts-wrap">
          <button
            className="badge badge-hearts"
            onClick={handleHeartClick}
            aria-label="Hearts"
          >
            <span className="mini-flag">&#10084;&#65039;</span> {hearts}
            {nextHeartMs > 0 && countdown > 0 && (
              <span className="heart-timer" title="Next heart in">&#9202;{formatCountdown(countdown)}</span>
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
                &#10084;&#65039; +1 life &middot; {LIFE_COST_XP} XP
              </button>
              {!canBuy && xp < LIFE_COST_XP && (
                <p className="topbar-buy-hint">Need {LIFE_COST_XP} XP ({xp} available)</p>
              )}
              {hearts >= MAX_HEARTS && (
                <p className="topbar-buy-hint">Already full</p>
              )}
            </div>
          )}
        </div>
        <span className="badge badge-xp">
          <span className="mini-flag">&#11088;</span> {xp} XP &#183; Lv {level}
        </span>
        <span className="badge badge-streak">&#128293; {streak}</span>
        {(boosts && boosts.xp2x > 0) && (
          <span className="badge badge-xp" title="2x XP active">&#9889;&#215;2</span>
        )}
        <button
          className="setting-btn"
          aria-label="Shop"
          title="Shop"
          onClick={() => navigate("/store")}
        >
          &#128722;
        </button>
        <button
          className="setting-btn"
          aria-label="Settings"
          title="Settings"
          onClick={() => navigate("/settings")}
        >
          &#9881;&#65039;
        </button>
      </div>
    </header>
  );
}
