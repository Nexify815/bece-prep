import { useEffect, useState } from "react";
import { THEMES, BOOSTS, HEARTS_PACK } from "../lib/store.js";
import { MAX_HEARTS } from "../lib/storage.js";
import { useStore } from "./StoreContext.jsx";
import { useSnack } from "./Snackbar.jsx";
import { GOOD, WARN, LuCircleCheck } from "./icons.jsx";
import { XP as XP_VALUES } from "../lib/XP.js";
import { TileIcon } from "./Tile.jsx";

const XP_PER_CORRECT = XP_VALUES.perCorrect;
const XP_LESSON = XP_VALUES.lessonComplete;

// Decorative previews for the theme cards — palette thumbnails of the app
// shell (sidebar + content blocks), matching the store design.
const THEME_PREVIEW = {
  day: { bg: "#F6FFEC", side: "#FFFFFF", bar: "#58CC02" },
  night: { bg: "#16251A", side: "#1F3324", bar: "#2F6B3A" },
  berry: { bg: "#F7EEFF", side: "#FFFFFF", bar: "#CE82FF" },
  ocean: { bg: "#EAF8FF", side: "#FFFFFF", bar: "#1CB0F6" },
};

const ICON_PATHS = {
  heart: "M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z",
  star: "M12 2l3 7 7 .6-5.3 4.6 1.7 7L12 17.5 5.6 21.2l1.7-7L2 9.6 9 9z",
  zap: "M13 2L4 14h7l-1 8 9-12h-7z",
  snowflake: "M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7",
};

function Glyph({ name, size = 24, className = "", fill = "#fff" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": "true",
  };
  if (name === "snowflake") {
    return (
      <svg {...common} fill="none" stroke={fill} strokeWidth="2.6" strokeLinecap="round">
        <path d={ICON_PATHS.snowflake} />
      </svg>
    );
  }
  return (
    <svg {...common} fill={fill}>
      <path d={ICON_PATHS[name] || ICON_PATHS.star} />
    </svg>
  );
}

function StarGlyph({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFC800" stroke="#B88A00" strokeWidth="1.5" aria-hidden="true">
      <path d={ICON_PATHS.star} />
    </svg>
  );
}

function ThemePreview({ themeKey }) {
  const p = THEME_PREVIEW[themeKey] || THEME_PREVIEW.day;
  return (
    <div className="sh-preview" style={{ background: p.bg }} aria-hidden="true">
      <span className="sh-preview-side" style={{ background: p.side }} />
      <span className="sh-preview-body">
        <b style={{ background: p.bar }} />
        <u />
        <u />
      </span>
    </div>
  );
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

  // Page-scoped palette so the shell (bg, rail, topbar) can match the design.
  useEffect(() => {
    document.documentElement.classList.add("shop-route");
    return () => document.documentElement.classList.remove("shop-route");
  }, []);

  // Runs a purchase; shows a snackbar with the outcome (incl. failure reasons).
  const buy = (fn, failMsg) => {
    if (fn()) return true;
    snack(failMsg, WARN);
    return false;
  };
  const notEnough = (price) => `Not enough XP. Need ${price} (you have ${xp}).`;

  return (
    <div className="sh-page">
      <section className="sh-hero">
        <span className="sh-bub sh-bub-a" aria-hidden="true" />
        <span className="sh-bub sh-bub-b" aria-hidden="true" />
        <span className="sh-bub sh-bub-c" aria-hidden="true" />
        <div className="sh-hero-text">
          <h2>Shop</h2>
          <p>Spend your XP on boosts and themes.</p>
        </div>
        <div className="sh-wallet">
          <TileIcon tone="lime" size="lg">
            <Glyph name="star" size={28} />
          </TileIcon>
          <div className="sh-wallet-text">
            <b>{xp.toLocaleString()}</b>
            <small>XP to spend</small>
          </div>
        </div>
      </section>

      <section className="sh-earn">
        <TileIcon tone="lime" size="sm">
          <Glyph name="zap" size={18} />
        </TileIcon>
        <b>Earn XP</b>
        <span className="sh-chip">{XP_PER_CORRECT} for each right answer</span>
        <span className="sh-chip">{XP_LESSON} for a finished lesson</span>
      </section>

      {/* Hearts */}
      <section className="sh-section">
        <h3>Hearts</h3>
        <div className="sh-card">
          <div className="sh-head">
            <TileIcon tone="red" size="lg">
              <Glyph name="heart" size={28} />
            </TileIcon>
            <div className="sh-body">
              <b>Heart pack</b>
              <small>{HEARTS_PACK.amount} hearts, straight away</small>
            </div>
            <div className="sh-hearts" aria-label={`${state.hearts} of ${MAX_HEARTS} hearts`}>
              {Array.from({ length: MAX_HEARTS }, (_, i) => (
                <Glyph
                  key={i}
                  name="heart"
                  size={26}
                  fill="#FF4B4B"
                  className={"sh-heart" + (i < state.hearts ? "" : " is-off")}
                />
              ))}
            </div>
          </div>
          {confirm?.type === "hearts" ? (
            <div className="sh-confirm">
              <p>
                Buy {HEARTS_PACK.amount} hearts for {HEARTS_PACK.price} XP?
              </p>
              <div className="sh-confirm-actions">
                <button
                  className="sh-btn sh-btn-sm"
                  onClick={() => {
                    const ok = buy(() => buyHearts(), notEnough(HEARTS_PACK.price));
                    if (ok) snack(`+${HEARTS_PACK.amount} hearts`, GOOD);
                    setConfirm(null);
                  }}
                >
                  Confirm
                </button>
                <button className="sh-cancel" onClick={() => setConfirm(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className={"sh-btn" + (heartsFull ? " is-off" : "")}
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
      </section>

      {/* Boosts */}
      <section className="sh-section">
        <h3>Boosts</h3>
        <div className="sh-grid sh-grid-2">
          {BOOSTS.map((b) => {
            const owned = (state.boosts && state.boosts[b.key]) || 0;
            return (
              <div key={b.key} className="sh-card">
                <div className="sh-head">
                  <TileIcon tone={b.icon === "zap" ? "lime" : "ice"} size="lg">
                    <Glyph name={b.icon === "zap" ? "zap" : "snowflake"} size={28} />
                  </TileIcon>
                  <div className="sh-body">
                    <b>
                      {b.name}
                      {owned > 0 && <span className="sh-owned">&times;{owned}</span>}
                    </b>
                    <small>{b.desc}</small>
                  </div>
                </div>
                {confirm?.type === b.key ? (
                  <div className="sh-confirm">
                    <p>
                      Buy {b.name} for {b.price} XP?
                    </p>
                    <div className="sh-confirm-actions">
                      <button
                        className="sh-btn sh-btn-sm"
                        onClick={() => {
                          const ok = buy(() => buyBoost(b.key), notEnough(b.price));
                          if (ok) snack(`${b.name} bought`, GOOD);
                          setConfirm(null);
                        }}
                      >
                        Confirm
                      </button>
                      <button className="sh-cancel" onClick={() => setConfirm(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="sh-btn" onClick={() => setConfirm({ type: b.key })}>
                    <StarGlyph />
                    {b.price} XP
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Themes */}
      <section className="sh-section">
        <h3>Themes</h3>
        <div className="sh-grid sh-grid-4">
          {THEMES.map((t) => {
            const isOwned = ownedThemes.includes(t.key);
            const equipped = theme === t.key;
            return (
              <div key={t.key} className={"sh-theme" + (equipped ? " is-current" : "")}>
                <ThemePreview themeKey={t.key} />
                <b>{t.name}</b>
                <small>{t.desc}</small>
                {equipped ? (
                  <span className="sh-act is-on">
                    <LuCircleCheck size={16} /> Active
                  </span>
                ) : isOwned ? (
                  <button
                    className="sh-act"
                    onClick={() => {
                      equipTheme(t.key);
                      snack(`${t.name} applied`, GOOD);
                    }}
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    className="sh-act"
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
      </section>
    </div>
  );
}
