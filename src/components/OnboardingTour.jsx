import { useState, useEffect, useRef, useCallback } from "react";
import { LuX } from "react-icons/lu";

// One-time guided tour over the landing screen.
//
// The spotlight is real: it measures the target with getBoundingClientRect and
// masks everything around it. On a phone the coach mark becomes a bottom sheet
// (the only place a thumb can reach); on a desktop it docks beside the target
// so the thing being described is never covered.
//
// The target is looked up INSIDE the effect, never during render: the landing
// page is lazy-loaded, so on first paint the element usually isn't in the DOM
// yet. Resolving it during render meant a null lookup called setRect(null) on
// an already-null state, React bailed out, and nothing ever re-measured --
// leaving the spotlight pointing at empty space.
export default function OnboardingTour({ steps, onFinish }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const raf = useRef(0);

  const step = steps[i];

  const measure = useCallback(() => {
    const el = document.querySelector(step.selector);
    const r = el && el.getBoundingClientRect();
    if (!r || r.width < 1 || r.height < 1) {
      setRect((prev) => (prev === null ? prev : null));
      return;
    }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.selector]);

  useEffect(() => {
    let alive = true;

    const schedule = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        if (alive) measure();
      });
    };

    // The landing page mounts lazily and reflows as content arrives, so keep
    // re-measuring for a short while instead of trusting the first read.
    let tries = 0;
    const poll = setInterval(() => {
      schedule();
      if (++tries > 40) clearInterval(poll);
    }, 50);

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    const ro = "ResizeObserver" in window ? new ResizeObserver(schedule) : null;
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });

    // (re)point the ResizeObserver at whichever element we are measuring, and
    // bring it into view once so the spotlight can't end up off-screen
    let attachTries = 0;
    const attach = setInterval(() => {
      const el = document.querySelector(step.selector);
      if (el && ro) {
        ro.disconnect();
        ro.observe(el);
        const r = el.getBoundingClientRect();
        const offscreen = r.top < 8 || r.bottom > window.innerHeight - 8;
        if (offscreen) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        clearInterval(attach);
        return;
      }
      if (++attachTries > 40) clearInterval(attach);
    }, 100);

    schedule();

    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(attach);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      mo.disconnect();
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, [step.selector, measure]);

  // defined at component scope: the JSX below wires these straight to
  // onClick, so they cannot live inside the keyboard effect
  const next = useCallback(() => {
    setI((cur) => (cur === steps.length - 1 ? onFinish() : cur + 1));
  }, [steps.length, onFinish]);
  const back = useCallback(() => setI((cur) => Math.max(0, cur - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onFinish();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onFinish]);

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

  // prefer whichever side has room
  const roomRight = vw - (rect.left + rect.width);
  const putRight = roomRight >= CARD_W + GAP + MARGIN;

  let left = putRight ? rect.left + rect.width + GAP : rect.left - GAP - CARD_W;
  if (!putRight && left < MARGIN) left = rect.left + rect.width + GAP;
  left = Math.max(MARGIN, Math.min(left, vw - CARD_W - MARGIN));

  const height = 300;
  let top = rect.top + rect.height / 2 - height / 2;
  top = Math.max(MARGIN, Math.min(top, vh - height - MARGIN));

  return { left, top, right: "auto", bottom: "auto" };
}