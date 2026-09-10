import { useEffect, useRef } from "react";
import { levelFromXp } from "../lib/storage.js";
import { useSnack } from "./Snackbar.jsx";
import { playWin } from "../lib/sound.js";

// Lives inside SnackProvider. Fires a little celebration every time the
// player's XP crosses a level boundary — no buttons or UI of its own.
export default function LevelUpWatcher({ xp }) {
  const snack = useSnack();
  const levelRef = useRef(levelFromXp(xp));

  useEffect(() => {
    const level = levelFromXp(xp);
    if (level > levelRef.current && levelRef.current > 0) {
      snack(`\u{1F389} Level ${level} unlocked!`);
      playWin();
    }
    levelRef.current = level;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  return null;
}