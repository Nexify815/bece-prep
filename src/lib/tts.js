// Text-to-speech helper using the Web Speech API.
// Falls back gracefully on browsers that don't support it.

const VOICE_KEY = "studybuddy.ttsVoice";

// Every speak/queue/stop bumps this counter. Chained utterances only advance
// while their session id is current, so any cancel — another speaker button,
// a route change, a lesson advancing — instantly kills pending queue steps
// instead of letting the last utterance finish (or the next one start) late.
let sessionSeq = 0;
const newSession = () => (sessionSeq += 1);

export function speak(text) {
  speakWithVoice(getSavedVoice(), text);
}

export function speakWithVoice(voice, text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  newSession();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(makeUtterance(voice, text));
}

// Speak a list of texts one after another, driven by utterance end events
// (not guessed timers). Calls onDone when the queue finishes on its own,
// onStop when it was cancelled or superseded by another speak/stopSpeaking.
export function speakQueue(texts, voice, { onDone, onStop } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    if (onDone) onDone();
    return;
  }
  const id = newSession();
  const synth = window.speechSynthesis;
  synth.cancel();
  const queue = (texts || []).map((t) => String(t || "").trim()).filter(Boolean);
  let i = 0;
  let finished = false;
  const finish = (natural) => {
    if (finished) return;
    finished = true;
    if (natural) {
      if (onDone) onDone();
    } else if (onStop) {
      onStop();
    } else if (onDone) {
      onDone();
    }
  };
  const speakNext = () => {
    if (id !== sessionSeq) return finish(false);
    if (i >= queue.length) return finish(true);
    const u = makeUtterance(voice, queue[i]);
    i += 1;
    u.onend = speakNext;
    // On error, skip to the next item rather than stall the queue forever.
    u.onerror = speakNext;
    synth.speak(u);
  };
  // Defer the first utterance so the cancel() above has time to land —
  // Chrome occasionally drops an utterance spoken synchronously after cancel.
  setTimeout(() => {
    if (id === sessionSeq) speakNext();
    else finish(false);
  }, 60);
}

function makeUtterance(voice, text) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = getPitch();
  if (voice) {
    u.voice = voice;
  } else {
    const en = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
    if (en) u.voice = en;
  }
  return u;
}

export function stopSpeaking() {
  // Invalidate any queued chain first so late onend/onerror events are no-ops.
  newSession();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSupported() {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

// load all available voices; call this after mount so voices are populated
export function getVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function getSavedVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  try {
    const name = localStorage.getItem(VOICE_KEY);
    if (!name) return null;
    return window.speechSynthesis.getVoices().find((v) => v.name === name) || null;
  } catch {
    return null;
  }
}

export function setSavedVoice(voice) {
  try {
    if (voice) localStorage.setItem(VOICE_KEY, voice.name);
    else localStorage.removeItem(VOICE_KEY);
  } catch {
    // ignore storage errors
  }
}

// higher pitch makes speech sound younger/child-like
function getPitch() {
  try {
    return localStorage.getItem("studybuddy.ttsPitch") === "child" ? 1.6 : 1;
  } catch {
    return 1;
  }
}

export function setChildPitch(enabled) {
  try {
    if (enabled) localStorage.setItem("studybuddy.ttsPitch", "child");
    else localStorage.removeItem("studybuddy.ttsPitch");
  } catch {
    // ignore
  }
}

export function isChildPitch() {
  try {
    return localStorage.getItem("studybuddy.ttsPitch") === "child";
  } catch {
    return false;
  }
}
