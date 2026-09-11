import { useEffect, useRef, useState } from "react";
import { FiMic, FiX } from "react-icons/fi";

// Stop listening 2.5s after the user goes quiet (but pauses in speech no
// longer end the session — continuous mode keeps the mic open).
const SILENCE_MS = 2500;

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
  const committedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
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
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    silenceTimerRef.current = null;
    try {
      if (recRef.current) recRef.current.stop();
    } catch {
      // already stopped
    }
    recRef.current = null;
    setListening(false);
  };

  const start = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Ctor();
    bufRef.current = "";
    committedRef.current = false;
    rec.lang = undefined; // default recognition language
    rec.continuous = true; // brief pauses don't cut the mic off
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
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
      if (recRef.current === rec) {
        recRef.current = null;
        setListening(false);
        if (!committedRef.current) {
          committedRef.current = true;
          commit();
        }
      }
    };

    rec.onerror = () => {
      committedRef.current = true;
      stopAll();
    };

    lastResultRef.current = Date.now();
    silenceTimerRef.current = setInterval(() => {
      if (Date.now() - lastResultRef.current > SILENCE_MS) {
        committedRef.current = true;
        stopAll();
        commit();
      }
    }, 500);

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      stopAll();
    }
  };

  const stop = () => {
    const r = recRef.current;
    committedRef.current = true;
    if (r) {
      try {
        r.stop();
      } catch {
        // already stopped
      }
    } else {
      setListening(false);
    }
    commit();
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