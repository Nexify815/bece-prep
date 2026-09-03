export default function TopBar({ title, showBack, xp, streak, level }) {
  return (
    <header className="topbar">
      <button
        className={"back-btn" + (showBack ? " show" : "")}
        aria-label="Back"
        onClick={() => window.history.back()}
      >
        &#8592;
      </button>
      <div className="topbar-title">
        <span className="brand-star">&#9733;</span>
        <span>{title}</span>
      </div>
      <div className="topbar-stats">
        <span className="badge badge-xp">
          <span className="mini-flag">&#11088;</span> {xp} XP &#183; Lv {level}
        </span>
        <span className="badge badge-streak">&#128293; {streak}</span>
      </div>
    </header>
  );
}
