import { useEffect, useRef, useState } from "react";
import { FiMic, FiX } from "react-icons/fi";

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

  useEffect(() => {
    return () => {
      try {
        if (recRef.current) recRef.current.stop();
      } catch {
        // recognition already finished
      }
    };
  }, []);

  if (!hasSpeechAPI()) return null;

  const start = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = undefined; // default recognition language
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("")
        .trim();
      if (text && onResult) onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => {
    try {
      if (recRef.current) recRef.current.stop();
    } catch {
      // already stopped
    }
    recRef.current = null;
    setListening(false);
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