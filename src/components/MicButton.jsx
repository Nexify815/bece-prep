import { useEffect, useRef, useState } from "react";
import { FiMic, FiX } from "react-icons/fi";

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

export default function MicButton({ onResult, disabled, ariaLabel = "Type with your voice", title = "Type with your voice" }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const bufRef = useRef("");
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
    const text = bufRef.current.trim();
    bufRef.current = "";
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
    rec.lang = undefined; // device default language
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      let added = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) added += " " + e.results[i][0].transcript;
      }
      const chunk = added.trim();
      if (chunk) {
        bufRef.current = (bufRef.current + " " + chunk).trim();
        lastResultRef.current = Date.now();
      }
    };

    rec.onend = () => {
      recRef.current = null;
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
      // "no-speech" happens a while after silence; we already stop earlier via
      // the quiet timer, so treat any engine error as the end of the session.
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
    lastResultRef.current = Date.now();
    silenceTimerRef.current = setInterval(() => {
      if (cancelRef.current) return;
      if (Date.now() - lastResultRef.current > SILENCE_MS) {
        const text = bufRef.current.trim();
        bufRef.current = "";
        stopAll();
        if (text && onResult) onResult(text);
      }
    }, 500);
    setListening(true);
    begin();
  };

  const stop = () => {
    const remaining = bufRef.current.trim();
    bufRef.current = "";
    stopAll();
    if (remaining && onResult) onResult(remaining);
  };

  return (
    <button
      type="button"
      className={"mic-btn" + (listening ? " listening" : "")}
      aria-label={listening ? "Stop listening" : ariaLabel}
      title={listening ? "Listening \u2014 tap to stop" : title}
      disabled={disabled}
      onClick={() => (listening ? stop() : start())}
    >
      {listening ? <FiX size={20} /> : <FiMic size={20} />}
    </button>
  );
}