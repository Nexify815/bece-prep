import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { LuX } from "react-icons/lu";

// One-time guided tour over the landing screen.
//
// The spotlight is real: it measures the target with getBoundingClientRect and
// masks everything around it. On a phone the coach mark becomes a bottom sheet
// (the only place a thumb can reach); on a desktop it docks beside the target
// so the thing being described is never covered.
export default function OnboardingTour({ steps, onFinish }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const raf = useRef(0);

  const step = steps[i];
  const target = step && document.querySelector(step.selector);

  const measure = useCallback(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const r = target.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [target]);

  useLayoutEffect(() => {
    measure();
  }, [measure, i]);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    // the landing screen reflows after images/fonts settle
    const t = setTimeout(onScroll, 350);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
      cancelAnimationFrame(raf.current);
      clearTimeout(t);
    };
  }, [measure]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onFinish();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const next = () => (i === steps.length - 1 ? onFinish() : setI(i + 1));
  const back = () => (i > 0 && setI(i - 1));

  const last = i === steps.length - 1;
  const Icon = step?.Icon;

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Guided tour">
      <div className="tour-scrim" onClick={next} />

      {rect && (
        <>
          <div className="tour-hole" style={holeStyle(rect)} />
          <div className="tour-ring" style={holeStyle(rect)} />
        </>
      )}

      <div
        className={"tour-card" + (rect ? " anchored" : " centred")}
        style={cardStyle(rect)}
      >
        <div className="tour-card-top">
          {Icon && (
            <span className={"tour-icon" + (step.tone ? " tone-" + step.tone : "")}>
              <Icon size={20} color="#fff" />
            </span>
          )}
          <span className="tour-count">
            {i + 1} of {steps.length}
          </span>
          <button className="tour-skip" onClick={onFinish} aria-label="Skip the tour">
            <LuX size={18} />
          </button>
        </div>

        <h2 className="tour-title">{step.title}</h2>
        <p className="tour-body">{step.body}</p>

        <div className="tour-dots">
          {steps.map((s, n) => (
            <span key={s.selector} className={"tour-dot" + (n === i ? " on" : "")} />
          ))}
        </div>

        <div className="tour-actions">
          {i > 0 && (
            <button className="focus-link" onClick={back}>
              Back
            </button>
          )}
          <button className="focus-btn" onClick={next}>
            {last ? "Start learning" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function holeStyle(r) {
  return {
    top: r.top - 6,
    left: r.left - 6,
    width: r.width + 12,
    height: r.height + 12,
    borderRadius: 18,
  };
}

// On a desktop the coach mark sits beside the highlighted card, never on top of
// it, and is nudged back inside the viewport if it would overflow. Phones leave
// this null so the CSS bottom-sheet rules apply.
const CARD_W = 360;
const GAP = 20;
const MARGIN = 16;

function cardStyle(rect) {
  if (!rect || typeof window === "undefined" || window.innerWidth < 1024) return undefined;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // prefer the side with more room
  const right = vw - (rect.left + rect.width);
  const putLeft = right >= CARD_W + GAP + MARGIN;
  const spaceRight = putLeft ? right - GAP - MARGIN : rect.left - GAP - MARGIN;
  const placeRight = spaceRight >= CARD_W;

  let left = putLeft
    ? rect.left + rect.width + GAP
    : rect.left - GAP - CARD_W;
  if (!putLeft && left < MARGIN) left = rect.left + rect.width + GAP;
  left = Math.max(MARGIN, Math.min(left, vw - CARD_W - MARGIN));

  const height = 260;
  let top = rect.top + rect.height / 2 - height / 2;
  top = Math.max(MARGIN, Math.min(top, vh - height - MARGIN));

  return { left, top, right: "auto", bottom: "auto" };
}