import { useEffect, useRef, useState } from "react";
import { LuMic, LuX } from "react-icons/lu";

// Chrome's continuous mode is unreliable (often no results at all), so we
// keep the non-continuous engine — which captures voice dependably — and
// re-arm it after every phrase. The mic stays open until the user goes quiet
// for SILENCE_MS, then the whole utterance is committed at once.
const SILENCE_MS = 2500;
const RESTART_DELAY = 150;

export function hasSpeechAPI() {
  return (
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

// Combine existing typed text with a fresh dictation chunk.
export function appendDictation(current, add) {
  const t = String(add || "").trim();
  if (!t) return current;
  return String(current || "").trim()
    ? String(current).trimEnd() + " " + t
    : t;
}

const mergeText = (finalText, interimText) =>
  [String(finalText || "").trim(), String(interimText || "").trim()]
    .filter(Boolean)
    .join(" ")
    .trim();

export default function MicButton({ onResult, disabled, ariaLabel = "Type with your voice", title = "Type with your voice" }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const bufRef = useRef("");        // finalized phrases
  const interimRef = useRef("");    // current unfinished hypothesis
  const lastResultRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const restartTimerRef = useRef(null);
  const cancelRef = useRef(true);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        if (recRef.current) recRef.current.stop();
      } catch {
        // recognition already finished
      }
    };
  }, []);

  if (!hasSpeechAPI()) return null;

  const commit = () => {
    const text = mergeText(bufRef.current, interimRef.current);
    bufRef.current = "";
    interimRef.current = "";
    if (text && onResult) onResult(text);
  };

  const stopAll = () => {
    cancelRef.current = true;
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    silenceTimerRef.current = null;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    try {
      if (recRef.current) recRef.current.stop();
    } catch {
      // already stopped
    }
    recRef.current = null;
    setListening(false);
  };

  const begin = () => {
    if (cancelRef.current) return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Ctor();
    // NOTE: do not assign `lang` at all — an invalid/empty tag makes Chrome
    // abort the recognition almost immediately. Omitting it uses the device default.
    rec.continuous = false;
    // Interim results double as a "user is speaking right now" signal so the
    // silence timer never fires mid-sentence.
    rec.interimResults = true;

    rec.onresult = (e) => {
      if (cancelRef.current) return;
      let added = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) added += " " + res[0].transcript;
        else interim += res[0].transcript;
      }
      const chunk = added.trim();
      if (chunk) bufRef.current = (bufRef.current + " " + chunk).trim();
      // Always overwrite so stale hypotheses never linger into the commit.
      interimRef.current = interim.trim();
      // Any result event — final or interim — means the user is active.
      lastResultRef.current = Date.now();
    };

    // Speech detection events fire even before any result does; use them as an
    // extra liveness heartbeat so the mic can't time out mid-word.
    const bump = () => {
      if (!cancelRef.current) lastResultRef.current = Date.now();
    };
    rec.onspeechstart = bump;
    rec.onsoundstart = bump;
    rec.onaudiostart = bump;

    rec.onend = () => {
      recRef.current = null;
      interimRef.current = "";
      if (cancelRef.current) {
        setListening(false);
        return;
      }
      // Natural end of a phrase — re-arm so the mic keeps listening.
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        begin();
      }, RESTART_DELAY);
    };

    rec.onerror = (e) => {
      if (cancelRef.current) return;
      // "no-speech" just means the person stayed quiet; stop gracefully and
      // keep whatever was captured. Same for any other engine error.
      stopAll();
      commit();
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      stopAll();
    }
  };

  const start = () => {
    cancelRef.current = false;
    bufRef.current = "";
    interimRef.current = "";
    lastResultRef.current = Date.now();
    silenceTimerRef.current = setInterval(() => {
      if (cancelRef.current) return;
      // Keep the mic alive as long as result/speech events keep landing.
      if (Date.now() - lastResultRef.current > SILENCE_MS) {
        const text = mergeText(bufRef.current, interimRef.current);
        bufRef.current = "";
        interimRef.current = "";
        stopAll();
        if (text && onResult) onResult(text);
      }
    }, 500);
    setListening(true);
    begin();
  };

  const stop = () => {
    const remaining = mergeText(bufRef.current, interimRef.current);
    bufRef.current = "";
    interimRef.current = "";
    stopAll();
    if (remaining && onResult) onResult(remaining);
  };

  return (
    <button
      type="button"
      className={"mic-btn" + (listening ? " listening" : "")}
      aria-label={listening ? "Stop listening" : ariaLabel}
      title={listening ? "Listening — tap to stop" : title}
      disabled={disabled}
      onClick={() => (listening ? stop() : start())}
    >
      {listening ? <LuX size={20} /> : <LuMic size={20} />}
    </button>
  );
}
