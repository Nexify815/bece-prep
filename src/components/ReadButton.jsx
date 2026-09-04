import { speak, stopSpeaking, isSpeechSupported } from "../lib/tts.js";

// A compact square volume button that reads text aloud.
export default function ReadButton({ text, className = "" }) {
  if (!isSpeechSupported() || !text) return null;
  return (
    <button
      className={"read-btn " + className}
      aria-label="Read aloud"
      title="Read aloud"
      onClick={() => speak(text)}
    >
      &#128266;
    </button>
  );
}
