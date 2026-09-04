// Text-to-speech helper using the Web Speech API.
// Falls back gracefully on browsers that don't support it.

const VOICE_KEY = "studybuddy.ttsVoice";

export function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = getPitch();
  const voice = getSavedVoice();
  if (voice) {
    u.voice = voice;
  } else {
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => v.lang.startsWith("en"));
    if (en) u.voice = en;
  }
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
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
