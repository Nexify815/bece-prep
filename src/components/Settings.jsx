import { useState, useEffect } from "react";
import { getVoices, getSavedVoice, setSavedVoice, isChildPitch, setChildPitch, isSpeechSupported } from "../lib/tts.js";

export default function Settings({ onReset }) {
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [childPitch, setPitch] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const load = () => {
      setVoices(getVoices());
      setSelected(getSavedVoice());
      setPitch(isChildPitch());
    };
    load();
    if (isSpeechSupported()) {
      window.speechSynthesis.addEventListener("voiceschanged", load);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
    }
  }, []);

  const saveVoice = (v) => {
    setSelected(v);
    setSavedVoice(v);
  };

  return (
    <div>
      <div className="section-title">Settings</div>

      <div className="settings-group">
        <div className="settings-group-title">Reading &amp; Voice</div>
        {!isSpeechSupported() && (
          <p className="muted">Your device doesn't support text-to-speech.</p>
        )}
        {isSpeechSupported() && (
          <div className="card settings-card">
            <div className="voice-section" style={{ marginTop: 0 }}>
              <div className="voice-title">Voice</div>
              {voices.length === 0 && <p className="muted">Loading voices...</p>}
              <div className="voice-list">
                {voices
                  .filter((v) => v.lang.startsWith("en"))
                  .map((v) => (
                    <button
                      key={v.name}
                      className={"voice-option" + (selected && selected.name === v.name ? " selected" : "")}
                      onClick={() => saveVoice(v)}
                    >
                      <span className="voice-name">{v.name}</span>
                      <span className="voice-lang">{v.lang}</span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="voice-section">
              <label className="voice-toggle">
                <input
                  type="checkbox"
                  checked={childPitch}
                  onChange={(e) => {
                    setPitch(e.target.checked);
                    setChildPitch(e.target.checked);
                  }}
                />
                <span className="voice-toggle-label">&#128118; Kid-friendly voice (younger tone)</span>
              </label>
            </div>
            <p className="muted settings-hint">
              Choices save automatically. Tap any &#128266; button to hear reading in your chosen voice.
            </p>
          </div>
        )}
      </div>

      <div className="settings-group">
        <div className="settings-group-title">About</div>
        <div className="card settings-card">
          <p className="settings-line"><strong>StudyBuddy</strong> &#8212; BECE Prep</p>
          <p className="settings-line">Version 4.0</p>
          <p className="muted settings-hint">
            Learn the words of your BECE exams the easy way, on any device, even offline.
          </p>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Data</div>
        <div className="card settings-card">
          <div className="settings-line">
            <strong>Reset all progress</strong>
            <p className="muted settings-hint">
              Clears your XP, levels, learned terms, scores and stair progress. This cannot be undone.
            </p>
          </div>
          {!confirmReset ? (
            <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
              Reset progress
            </button>
          ) : (
            <div className="settings-reset-confirm">
              <p className="settings-warn">Are you sure? This deletes everything on this device.</p>
              <div className="settings-actions">
                <button className="btn btn-danger" onClick={onReset}>
                  Yes, reset everything
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
