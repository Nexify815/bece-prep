import { useEffect, useRef, useState } from "react";
import { LuArrowUpRight, LuGithub, LuMonitor, LuSmartphone } from "react-icons/lu";

// The poster is authored at a fixed size and scaled to fit the window, so the
// whole page is always one screenshot: no scrolling, at any viewport.
const POSTER_W = 1440;
const POSTER_H = 900;

const LAPTOP = { w: 1280, h: 800, scale: 0.5 };
const PHONE = { w: 390, h: 844, scale: 0.34 };

const SCREENS = [
  { route: "/subject/math/path", label: "Staircase" },
  { route: "/exam", label: "Exam mode" },
  { route: "/leaderboard", label: "Leaderboard" },
];

// A real app screen, rendered in a frame. `?shot=1` skips the splash and the
// first-run onboarding; `theme=day` pins the palette so shots stay consistent.
function Shot({ route, size }) {
  return (
    <div
      className="shot-screen"
      style={{
        width: Math.round(size.w * size.scale),
        height: Math.round(size.h * size.scale),
      }}
    >
      <iframe
        src={`?shot=1&theme=day#${route}`}
        title={route}
        width={size.w}
        height={size.h}
        loading="lazy"
        tabIndex={-1}
        style={{ transform: `scale(${size.scale})` }}
      />
    </div>
  );
}

// Scale the poster down to fit the viewport without ever scrolling.
function useFitScale(w, h) {
  const ref = useRef(null);
  const [scale, setScale] = useState(() => {
    if (typeof window === "undefined") return 1;
    const s = Math.min(window.innerWidth / w, window.innerHeight / h);
    return Math.max(0.2, Math.min(2, s));
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => {
      const s = Math.min(el.clientWidth / w, el.clientHeight / h);
      setScale(Math.max(0.2, Math.min(2, s)));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, [w, h]);

  return [ref, scale];
}

export default function ShowcasePage() {
  const [ref, scale] = useFitScale(POSTER_W, POSTER_H);

  return (
    <div className="showcase-root" ref={ref}>
      <div
        className="showcase-poster"
        style={{
          width: POSTER_W,
          height: POSTER_H,
          transform: `scale(${scale})`,
        }}
      >
        <section className="showcase-copy">
          <span className="showcase-eyebrow">Case study &middot; 2026</span>
          <h1>StudyBuddy</h1>
          <p className="showcase-lede">
            A BECE exam-prep app for Ghanaian Junior High students. It takes the
            whole syllabus and turns it into a staircase &mdash; one lesson
            unlocked at a time, so a student always knows exactly what to do
            next.
          </p>

          <dl className="showcase-meta">
            <div>
              <dt>Role</dt>
              <dd>Design &amp; development</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>React &middot; Vite &middot; Firebase</dd>
            </div>
            <div>
              <dt>Platform</dt>
              <dd>Mobile-first web</dd>
            </div>
          </dl>

          <div className="showcase-links">
            <a className="showcase-link showcase-link-primary" href="#/">
              Open the app <LuArrowUpRight size={15} />
            </a>
            <a
              className="showcase-link"
              href="https://github.com/Nexify815/bece-prep"
              target="_blank"
              rel="noreferrer"
            >
              <LuGithub size={15} /> Source
            </a>
          </div>

          <ul className="showcase-notes">
            <li>
              <span className="showcase-note-icon tone-purple">
                <LuSmartphone size={16} />
              </span>
              <div>
                <strong>One clear next step</strong>
                <p>Every screen answers: what do I do right now?</p>
              </div>
            </li>
            <li>
              <span className="showcase-note-icon tone-green">
                <LuMonitor size={16} />
              </span>
              <div>
                <strong>Built to survive a phone</strong>
                <p>Offline caching and a mobile-first layout throughout.</p>
              </div>
            </li>
            <li>
              <span className="showcase-note-icon tone-gold">
                <LuArrowUpRight size={16} />
              </span>
              <div>
                <strong>Progress you can feel</strong>
                <p>XP, streaks and leagues aimed at consistency.</p>
              </div>
            </li>
          </ul>
        </section>

        <section className="showcase-frames" aria-label="App screens">
          <div className="shot-laptop">
            <div className="shot-chrome">
              <span className="shot-dot" />
              <span className="shot-dot" />
              <span className="shot-dot" />
              <span className="shot-url">
                <LuMonitor size={11} /> bece-prep.vercel.app
              </span>
            </div>
            <Shot route="/" size={LAPTOP} />
          </div>

          <div className="shot-phones">
            {SCREENS.map((s) => (
              <figure className="shot-phone" key={s.route}>
                <div className="shot-phone-body">
                  <span className="shot-phone-notch" />
                  <Shot route={s.route} size={PHONE} />
                </div>
                <figcaption>{s.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <p className="showcase-foot">
          Screens shown are live app screens, not mockups.
        </p>
      </div>
    </div>
  );
}