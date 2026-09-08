// Tiny Web Audio sound effects + haptic feedback. Pure JS, no assets, works
// offline. Preferences live in localStorage so playback is always cheap.

function prefs() {
  let sound = true;
  let haptics = true;
  try {
    sound = localStorage.getItem("studybuddy.sound") !== "off";
    haptics = localStorage.getItem("studybuddy.haptics") !== "off";
  } catch {
    /* storage unavailable */
  }
  return { sound, haptics };
}

export function setSoundEnabled(on) {
  try {
    localStorage.setItem("studybuddy.sound", on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

export function setHapticsEnabled(on) {
  try {
    localStorage.setItem("studybuddy.haptics", on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

export function isSoundEnabled() {
  return prefs().sound;
}

export function isHapticsEnabled() {
  return prefs().haptics;
}

let ctx = null;

function tone(freq, start, dur, type = "sine", gain = 0.14) {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch {
    /* audio not available — skip silently */
  }
}

function buzz(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

// Correct answer: a bright two-note "ding".
export function playRight() {
  if (!prefs().sound) return;
  tone(660, 0, 0.12, "sine", 0.16);
  tone(990, 0.1, 0.16, "sine", 0.16);
  if (prefs().haptics) buzz(20);
}

// Wrong answer: a low "thud".
export function playWrong() {
  if (!prefs().sound) return;
  tone(220, 0, 0.18, "triangle", 0.14);
  tone(165, 0.09, 0.22, "triangle", 0.12);
  if (prefs().haptics) buzz([40, 40, 40]);
}

// Generic tap "click".
export function playClick() {
  if (!prefs().sound) return;
  tone(440, 0, 0.05, "square", 0.05);
}

// Level-up / success fanfare.
export function playWin() {
  if (!prefs().sound) return;
  tone(523, 0, 0.15, "sine", 0.16);
  tone(659, 0.12, 0.15, "sine", 0.16);
  tone(784, 0.24, 0.2, "sine", 0.16);
  tone(1047, 0.36, 0.3, "sine", 0.16);
  if (prefs().haptics) buzz([30, 40, 60]);
}

// Time-warning tick for the exam timer.
export function playTick() {
  if (!prefs().sound) return;
  tone(880, 0, 0.05, "square", 0.06);
}