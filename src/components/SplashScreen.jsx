import Mascot from "./Mascot.jsx";

// Full-screen intro splash. `leaving` triggers the fade-out before unmount.
export default function SplashScreen({ leaving = false }) {
  return (
    <div className={"splash" + (leaving ? " splash-leave" : "")}>
      <div className="splash-inner">
        <Mascot className="splash-mascot" />
        <div className="splash-title">StudyBuddy</div>
        <div className="splash-tagline">BECE, made easy</div>
        <div className="splash-dots">
          <span className="dot dot-math" />
          <span className="dot dot-science" />
          <span className="dot dot-english" />
          <span className="dot dot-social" />
        </div>
      </div>
      <div className="splash-bar" />
    </div>
  );
}