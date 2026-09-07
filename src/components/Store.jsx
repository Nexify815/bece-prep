import { useState } from "react";
import { SKINS, THEMES, BOOSTS, HEARTS_PACK } from "../lib/store.js";
import { MAX_HEARTS } from "../lib/storage.js";
import { useStore } from "./StoreContext.jsx";
import { useSnack } from "./Snackbar.jsx";

function themeDot(key) {
  return { day: "\u2600\uFE0F", night: "\u{1F319}", berry: "\u{1F7E7}", ocean: "\u{1F30A}" }[key] || "\u2600\uFE0F";
}

export default function Store() {
  const ctx = useStore();
  const {
    state, xp, ownedSkins, skin,
    ownedThemes, theme,
    buyHearts, buySkin, equipSkin, buyTheme, equipTheme, buyBoost,
  } = ctx;
  const snack = useSnack();
  const [confirm, setConfirm] = useState(null); // {type,key}
  const heartsFull = state.hearts >= MAX_HEARTS;

  // Runs a purchase; shows a snackbar with the outcome (incl. failure reasons).
  const buy = (fn, failMsg) => {
    if (fn()) return true;
    snack(failMsg);
    return false;
  };
  const notEnough = (price) => `Not enough XP. Need ${price} (you have ${xp}). \u26A0\uFE0F`;

  return (
    <div>
      <div className="section-title">Shop</div>
      <p className="muted">
        Spend your XP on fun stuff! You have <strong>{xp} XP</strong>.
      </p>
      <div className="spacer" />

      {/* Hearts */}
      <div className="store-group">
        <div className="store-group-title">Hearts</div>
        <div className="card store-card">
          <div className="store-head">
            <span className="store-icon">{HEARTS_PACK.emoji}</span>
            <div className="store-main">
              <span className="store-name">Buy hearts</span>
              <span className="store-desc">Get {HEARTS_PACK.amount} hearts instantly.</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              if (heartsFull) { snack(`Hearts are already full \uD83D\uDC97`); return; }
              setConfirm(confirm?.type === "hearts" ? null : { type: "hearts" });
            }}>
              {heartsFull ? "Full" : `${HEARTS_PACK.price} XP`}
            </button>
          </div>
          {confirm?.type === "hearts" && (
            <div className="store-confirm">
              <p className="store-warn">Buy {HEARTS_PACK.amount} hearts for {HEARTS_PACK.price} XP?</p>
              <div className="settings-actions">
                <button className="btn btn-primary btn-sm" onClick={() => {
                  const ok = buy(
                    () => buyHearts(),
                    notEnough(HEARTS_PACK.price)
                  );
                  if (ok) snack(`+${HEARTS_PACK.amount} hearts \u2713`);
                  setConfirm(null);
                }}>Confirm</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Boosts */}
      <div className="store-group">
        <div className="store-group-title">Boosts</div>
        {BOOSTS.map((b) => {
          const owned = (state.boosts && state.boosts[b.key]) || 0;
          return (
            <div key={b.key} className="card store-card mt">
              <div className="store-head">
                <span className="store-icon">{b.emoji}</span>
                <div className="store-main">
                  <span className="store-name">{b.name} <span className="store-owned">&#215;{owned}</span></span>
                  <span className="store-desc">{b.desc}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setConfirm(confirm?.type === b.key ? null : { type: b.key })}>
                  {b.price} XP
                </button>
              </div>
              {confirm?.type === b.key && (
                <div className="store-confirm">
                  <p className="store-warn">Buy {b.name} for {b.price} XP?</p>
                  <div className="settings-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      const ok = buy(() => buyBoost(b.key), notEnough(b.price));
                      if (ok) snack(`${b.name} bought \u2713`);
                      setConfirm(null);
                    }}>Confirm</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mascot skins */}
      <div className="store-group">
        <div className="store-group-title">Mascot</div>
        <div className="store-skin-grid">
          {SKINS.map((s) => {
            const isOwned = ownedSkins.includes(s.key);
            const equipped = skin === s.key;
            return (
              <button key={s.key} className={"store-skin" + (equipped ? " equipped" : "") + (isOwned ? " owned" : "")} onClick={() => {
                if (equipped) return;
                if (isOwned) { equipSkin(s.key); snack(`${s.name} equipped \u2713`); }
                else { buy(() => buySkin(s.key), notEnough(s.price)) && snack(`${s.name} bought & equipped \u2713`); }
              }}>
                <span className="store-skin-emoji">{s.emoji}</span>
                <span className="store-skin-name">{s.name}</span>
                <span className="store-skin-status">{equipped ? "Equipped" : isOwned ? "Equip" : `${s.price} XP`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Themes */}
      <div className="store-group">
        <div className="store-group-title">Themes</div>
        {THEMES.map((t) => {
          const isOwned = ownedThemes.includes(t.key);
          const equipped = theme === t.key;
          return (
            <div key={t.key} className="card store-card mt">
              <div className="store-head">
                <span className="store-icon">{themeDot(t.key)}</span>
                <div className="store-main">
                  <span className="store-name">{t.name}</span>
                  <span className="store-desc">{t.desc}</span>
                </div>
                {equipped ? (
                  <span className="pill pill-easy">Active</span>
                ) : isOwned ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => { equipTheme(t.key); snack(`${t.name} applied \u2713`); }}>Apply</button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => { if (buy(() => buyTheme(t.key), notEnough(t.price))) snack(`${t.name} bought \u2713`); }}>{t.price} XP</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="spacer" />
      <p className="muted center">Earn XP by answering questions correctly to afford more.</p>
    </div>
  );
}
