import { useEffect, useRef, useState } from "react";
import Mascot from "./Mascot.jsx";
import { playClick, playRight, playWrong, playWin } from "../lib/sound.js";

// "Match It": a memory-matching game where every face-down card is either a
// term or a definition. Flip two cards — term + definition = match.
// Replaces the old flashcard checkpoint with a played reinforcement round.

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(deck) {
  const pairs = [];
  deck.forEach((term) => {
    pairs.push({ pid: term.id, kind: "term", term });
    pairs.push({ pid: term.id, kind: "def", term });
  });
  return shuffle(pairs);
}

// Completion bonus: +5 XP per pair, so 4 pairs -> 10, 6 -> 15, 8 -> 20.
function completionBonus(pairs) {
  return Math.floor(pairs * 2.5);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function MatchingGame({
  title = "Match It",
  subjectKey,
  deck = [],
  onSRS,
  onAddXp,
  compact = false,
  onFinish,
}) {
  const [cards, setCards] = useState(() => buildDeck(deck));
  const [open, setOpen] = useState([]); // unmatched face-up card index
  const [wrongPair, setWrongPair] = useState([]); // indices flashing red
  const [matchedPids, setMatchedPids] = useState([]); // matched pair ids
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [bonusXp, setBonusXp] = useState(0);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);
  const movesRef = useRef(0);
  const secondsRef = useRef(0);
  const wrongTimer = useRef(null);

  const total = deck.length;

  useEffect(() => {
    return () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        secondsRef.current = s + 1;
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const stopTimer = () => {
    setRunning(false);
  };

  const countMove = () => {
    movesRef.current += 1;
    setMoves(movesRef.current);
  };

  const finishGame = () => {
    const perfect = movesRef.current === cards.length;
    const bonus = completionBonus(total) + (perfect ? 10 : 0);
    setBonusXp(bonus);
    stopTimer();
    playWin();
    if (onAddXp && bonus > 0) onAddXp(bonus);
    setWon(true);
  };

  const tap = (idx) => {
    if (lockRef.current || won) return;
    const card = cards[idx];
    if (matchedPids.includes(card.pid)) return;
    if (open.includes(idx) || wrongPair.includes(idx)) return;
    if (total === 0) return;

    countMove();
    playClick();
    if (!running) setRunning(true);

    if (open.length === 0) {
      setOpen([idx]);
      return;
    }

    const first = cards[open[0]];
    lockRef.current = true;

    if (first.pid === card.pid) {
      playRight();
      if (onAddXp) onAddXp(5);
      if (onSRS) onSRS(`${subjectKey}:${card.pid}`, true);
      const nextMatched = [...matchedPids, card.pid];
      setMatchedPids(nextMatched);
      setOpen([]);
      lockRef.current = false;
      if (nextMatched.length === total) finishGame();
    } else {
      playWrong();
      setWrongPair([open[0], idx]);
      setOpen([]);
      wrongTimer.current = setTimeout(() => {
        setWrongPair([]);
        lockRef.current = false;
      }, 900);
    }
  };

  const playAgain = () => {
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setCards(buildDeck(deck));
    setOpen([]);
    setWrongPair([]);
    setMatchedPids([]);
    setMoves(0);
    setSeconds(0);
    setBonusXp(0);
    setWon(false);
    setRunning(false);
    movesRef.current = 0;
    secondsRef.current = 0;
    lockRef.current = false;
  };

  if (total === 0) {
    return <p className="muted">No cards yet.</p>;
  }

  if (won) {
    return (
      <div className="center">
        <Mascot className="mascot-big" happy />
        <h2 className="results-title">All matched!</h2>
        <p className="muted">
          Time {fmtTime(seconds)} &middot; {moves} moves
          {moves === cards.length ? " &middot; perfect!" : ""}
        </p>
        <p className="muted">+{bonusXp} XP</p>
        {onAddXp && (
          <p className="muted xp-pop">+5 XP per pair</p>
        )}
        <div className="flash-actions">
          <button className="btn btn-primary" onClick={playAgain}>
            Play again
          </button>
          {onFinish && (
            <button className="btn btn-secondary" onClick={onFinish}>
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={"flash-page mg-page" + (compact ? " mg-compact" : "")}>
      <div className="quiz-top">
        <span className="quiz-count">{title}</span>
        <span className="quiz-count">Pairs {matchedPids.length} / {total}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(matchedPids.length / total) * 100}%` }} />
      </div>

      <div className="mg-grid">
        {cards.map((card, idx) => {
          const isUp =
            open.includes(idx) ||
            wrongPair.includes(idx) ||
            matchedPids.includes(card.pid);
          const isMatched = matchedPids.includes(card.pid);
          const isWrong = wrongPair.includes(idx);
          return (
            <button
              type="button"
              key={`${card.pid}-${idx}`}
              className={"mg-card" + (isUp ? " up" : "") + (isMatched ? " match" : "") + (isWrong ? " wrong" : "")}
              onClick={() => tap(idx)}
              aria-label={isUp ? card.term.term : "Hidden card"}
            >
              <div className="mg-inner">
                <div className="mg-side mg-face-down">?</div>
                <div className="mg-side mg-face-up">
                  {card.kind === "term" ? (
                    <span className="mg-term">{card.term.term}</span>
                  ) : (
                    <span className="mg-def">{card.term.definition}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mg-stats">
        <span>Pairs {matchedPids.length}/{total}</span>
        <span>Moves {moves}</span>
        <span>{fmtTime(seconds)}</span>
      </div>
      <p className="muted center flash-note">Match each term to its meaning.</p>
    </div>
  );
}