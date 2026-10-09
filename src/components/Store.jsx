import { useState } from "react";
import { THEMES, BOOSTS, HEARTS_PACK } from "../lib/store.js";
import { MAX_HEARTS } from "../lib/storage.js";
import { useStore } from "./StoreContext.jsx";
import { useSnack } from "./Snackbar.jsx";
import { THEME_ICON, BOOST_ICON, GOOD, WARN, LuSparkles, LuCircleCheck } from "./icons.jsx";
import { XP as XP_VALUES } from "../lib/XP.js";

const XP_PER_CORRECT = XP_VALUES.perCorrect;
const XP_LESSON = XP_VALUES.lessonComplete;

function themeIcon(key) {
  const Icon = THEME_ICON[key] || THEME_ICON.day;
  return <Icon size={22} />;
}

function itemIcon(key) {
  const Icon = BOOST_ICON[key];
  return Icon ? <Icon size={22} /> : null;
}

export default function Store() {
  const ctx = useStore();
  const {
    state, xp,
    ownedThemes, theme,
    buyHearts, buyTheme, equipTheme, buyBoost,
  } = ctx;
  const snack = useSnack();
  const [confirm, setConfirm] = useState(null); // {type,key}
  const heartsFull = state.hearts >= MAX_HEARTS;

  // Runs a purchase; shows a snackbar with the outcome (incl. failure reasons).
  const buy = (fn, failMsg) => {
    if (fn()) return true;
    snack(failMsg, WARN);
    return false;
  };
  const notEnough = (price) => `Not enough XP. Need ${price} (you have ${xp}).`;

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <div>
          <h1>Shop</h1>
          <p>Spend your XP on boosts and themes.</p>
        </div>
        <div className="shop-balance">
          <span className="shop-balance-num">{xp}</span>
          <span className="shop-balance-label">XP to spend</span>
        </div>
      </div>

      <div className="shop-earn">
        <LuSparkles size={16} />
        <span>
          Earn XP by answering questions right: {XP_PER_CORRECT} each, {XP_LESSON} for a
          finished lesson.
        </span>
      </div>

      {/* Hearts */}
      <div className="shop-group">
        <div className="shop-group-title">Hearts</div>
        <div className="shop-card">
          <div className="shop-card-top">
            <span className="shop-card-icon" style={{ background: "#FEF2F2", color: "#EF4444" }}>
              {itemIcon(HEARTS_PACK.icon)}
            </span>
            <div className="shop-card-body">
              <span className="shop-card-name">Heart pack</span>
              <span className="shop-card-desc">
                {HEARTS_PACK.amount} hearts, straight away
              </span>
            </div>
          </div>
          {confirm?.type === "hearts" ? (
            <div className="shop-confirm">
              <p>
                Buy {HEARTS_PACK.amount} hearts for {HEARTS_PACK.price} XP?
              </p>
              <div className="shop-confirm-actions">
                <button
                  className="focus-btn"
                  onClick={() => {
                    const ok = buy(() => buyHearts(), notEnough(HEARTS_PACK.price));
                    if (ok) snack(`+${HEARTS_PACK.amount} hearts`, GOOD);
                    setConfirm(null);
                  }}
                >
                  Confirm
                </button>
                <button className="focus-link" onClick={() => setConfirm(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="focus-btn"
              disabled={heartsFull}
              onClick={() => {
                if (heartsFull) {
                  snack("Hearts are already full");
                  return;
                }
                setConfirm({ type: "hearts" });
              }}
            >
              {heartsFull ? "Hearts full" : `Buy for ${HEARTS_PACK.price} XP`}
            </button>
          )}
        </div>
      </div>

      {/* Boosts */}
      <div className="shop-group">
        <div className="shop-group-title">Boosts</div>
        <div className="shop-grid">
          {BOOSTS.map((b) => {
            const owned = (state.boosts && state.boosts[b.key]) || 0;
            return (
              <div key={b.key} className="shop-card">
                <div className="shop-card-top">
                  <span className="shop-card-icon" style={{ background: "#FEFCE8", color: "#CA8A04" }}>
                    {itemIcon(b.icon)}
                  </span>
                  <div className="shop-card-body">
                    <span className="shop-card-name">
                      {b.name}
                      {owned > 0 && <span className="shop-owned">&times;{owned}</span>}
                    </span>
                    <span className="shop-card-desc">{b.desc}</span>
                  </div>
                </div>
                {confirm?.type === b.key ? (
                  <div className="shop-confirm">
                    <p>
                      Buy {b.name} for {b.price} XP?
                    </p>
                    <div className="shop-confirm-actions">
                      <button
                        className="focus-btn"
                        onClick={() => {
                          const ok = buy(() => buyBoost(b.key), notEnough(b.price));
                          if (ok) snack(`${b.name} bought`, GOOD);
                          setConfirm(null);
                        }}
                      >
                        Confirm
                      </button>
                      <button className="focus-link" onClick={() => setConfirm(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="focus-btn"
                    onClick={() => setConfirm({ type: b.key })}
                  >
                    {b.price} XP
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Themes */}
      <div className="shop-group">
        <div className="shop-group-title">Themes</div>
        <div className="shop-grid">
          {THEMES.map((t) => {
            const isOwned = ownedThemes.includes(t.key);
            const equipped = theme === t.key;
            return (
              <div key={t.key} className={"shop-card" + (equipped ? " equipped" : "")}>
                <div className="shop-card-top">
                  <span className="shop-card-icon" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                    {themeIcon(t.key)}
                  </span>
                  <div className="shop-card-body">
                    <span className="shop-card-name">{t.name}</span>
                    <span className="shop-card-desc">{t.desc}</span>
                  </div>
                </div>
                {equipped ? (
                  <span className="shop-equipped">
                    <LuCircleCheck size={16} /> Active
                  </span>
                ) : isOwned ? (
                  <button
                    className="focus-btn"
                    onClick={() => {
                      equipTheme(t.key);
                      snack(`${t.name} applied`, GOOD);
                    }}
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    className="focus-btn"
                    onClick={() => {
                      if (buy(() => buyTheme(t.key), notEnough(t.price))) {
                        snack(`${t.name} bought`, GOOD);
                      }
                    }}
                  >
                    {t.price} XP
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
