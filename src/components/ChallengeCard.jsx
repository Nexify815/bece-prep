import { LuTrophy } from "react-icons/lu";
import { getMonthlyChallenge, computeChallengeProgress } from "../lib/challenges.js";
import { XP } from "../lib/XP.js";
import { playWin } from "../lib/sound.js";

export default function ChallengeCard({ state, onClaim }) {
  const challenge = getMonthlyChallenge();
  const progress = computeChallengeProgress(state);
  const claimed = !!(state.challengesClaimed && state.challengesClaimed[challenge.month]);
  const pct = Math.min(100, (progress.raw != null ? progress.raw : progress.progress) / challenge.goal * 100);
  const show = progress.done ? progress.raw : progress.progress;

  return (
    <div className={"card challenge-card" + (progress.done ? " done" : "")}>
      <div className="challenge-head">
        <span className="challenge-title"><LuTrophy size={16} /> Monthly challenge</span>
        {claimed && <span className="pill pill-easy">Claimed</span>}
      </div>
      <p className="challenge-name">{challenge.title}</p>
      <p className="muted">{challenge.desc}</p>
      <div className="progress-bar mt">
        <div className="progress-fill" style={{ width: pct + "%" }} />
      </div>
      <p className="challenge-count muted">
        {show}/{challenge.goal} {challenge.type === "days" ? "days" : "XP"}
      </p>
      <button
        className="btn btn-primary mt"
        disabled={!progress.done || claimed}
        onClick={() => {
          if (!progress.done || claimed) return;
          onClaim(challenge);
          playWin();
        }}
      >
        {claimed ? "Claimed \u2713" : progress.done ? `Claim ${XP.challengeReward} XP ` : `Reward: ${XP.challengeReward} XP`}
      </button>
    </div>
  );
}