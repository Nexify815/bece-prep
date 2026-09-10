import { FiVolume2 } from "react-icons/fi";
import { speak, stopSpeaking, isSpeechSupported } from "../lib/tts.js";

// A compact volume button that reads text aloud. Deliberately kept small and
// muted in the UI — it's a helper, not a headline feature.
export default function ReadButton({ text, className = "" }) {
  if (!isSpeechSupported() || !text) return null;
  return (
    <button
      className={"read-btn " + className}
      aria-label="Read aloud"
      title="Read aloud"
      onClick={() => speak(text)}
    >
      <FiVolume2 size={14} />
    </button>
  );
}