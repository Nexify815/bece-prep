import { LuArrowUpRight, LuGithub, LuMonitor, LuSmartphone } from "react-icons/lu";

const LAPTOP = { w: 1280, h: 800, scale: 0.52 };
const PHONE = { w: 390, h: 844, scale: 0.52 };

const SCREENS = [
  {
    route: "/subject/math/path",
    label: "The staircase",
    note: "One lesson unlocked at a time",
  },
  {
    route: "/exam",
    label: "Exam mode",
    note: "Timed drills against the real paper format",
  },
  {
    route: "/leaderboard",
    label: "Leaderboard",
    note: "Weekly leagues by XP",
  },
];

// A real app screen, rendered in a frame. `?shot=1` skips the splash and the
// first-run onboarding so the screen is ready the moment it paints.
function Shot({ route, size, className = "" }) {
  return (
    <div
      className={"shot-screen " + className}
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

function Phone({ route, label, note }) {
  return (
    <figure className="shot-phone">
      <div className="shot-phone-body">
        <span className="shot-phone-notch" />
        <Shot route={route} size={PHONE} />
      </div>
      <figcaption>
        <strong>{label}</strong>
        <span>{note}</span>
      </figcaption>
    </figure>
  );
}

export default function ShowcasePage() {
  return (
    <div className="showcase">
      <header className="showcase-hero">
        <span className="showcase-eyebrow">Case study &middot; 2026</span>
        <h1>StudyBuddy</h1>
        <p className="showcase-lede">
          A BECE exam-prep app for Ghanaian Junior High students. It takes the
          whole syllabus and turns it into a staircase &mdash; one lesson
          unlocked at a time, so a student always knows exactly what to do next.
        </p>

        <dl className="showcase-meta">
          <div>
            <dt>Role</dt>
            <dd>Design &amp; development, solo</dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>React, Vite, Firebase</dd>
          </div>
          <div>
            <dt>Platform</dt>
            <dd>Mobile-first web app</dd>
          </div>
        </dl>

        <div className="showcase-links">
          <a className="showcase-link showcase-link-primary" href="#/">
            Open the app <LuArrowUpRight size={16} />
          </a>
          <a
            className="showcase-link"
            href="https://github.com/Nexify815/bece-prep"
            target="_blank"
            rel="noreferrer"
          >
            <LuGithub size={16} /> Source
          </a>
        </div>
      </header>

      <section className="showcase-frames" aria-label="App screens">
        <figure className="shot-laptop">
          <div className="shot-laptop-body">
            <div className="shot-chrome">
              <span className="shot-dot" />
              <span className="shot-dot" />
              <span className="shot-dot" />
              <span className="shot-url">
                <LuMonitor size={12} /> bece-prep.vercel.app
              </span>
            </div>
            <Shot route="/" size={LAPTOP} />
          </div>
          <figcaption>
            <strong>Today&rsquo;s plan</strong>
            <span>
              The app decides what to study today from the student&rsquo;s own
              progress, then rewrites it every day.
            </span>
          </figcaption>
        </figure>

        <div className="shot-phones">
          {SCREENS.map((s) => (
            <Phone key={s.route} {...s} />
          ))}
        </div>
      </section>

      <section className="showcase-notes" aria-label="Design notes">
        <article className="showcase-note">
          <span className="showcase-note-icon tone-purple">
            <LuSmartphone size={18} />
          </span>
          <h2>One clear next step</h2>
          <p>
            Students do not need another content dump. Every screen answers a
            single question: what do I do right now? The staircase makes
            progress visible and the next lesson obvious.
          </p>
        </article>

        <article className="showcase-note">
          <span className="showcase-note-icon tone-green">
            <LuMonitor size={18} />
          </span>
          <h2>Built to survive a phone</h2>
          <p>
            Mobile-first throughout, with a service worker that keeps the app
            usable on a weak connection and a layout that never depends on a
            large screen.
          </p>
        </article>

        <article className="showcase-note">
          <span className="showcase-note-icon tone-gold">
            <LuArrowUpRight size={18} />
          </span>
          <h2>Progress you can feel</h2>
          <p>
            XP, streaks, hearts and weekly leagues borrow the grammar of games
            students already play &mdash; aimed at consistency rather than
            cramming.
          </p>
        </article>
      </section>

      <footer className="showcase-foot">
        Screens shown are live app screens, not mockups.
      </footer>
    </div>
  );
}