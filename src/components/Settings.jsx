import { useState, useEffect } from "react";
import { getVoices, getSavedVoice, setSavedVoice, isChildPitch, setChildPitch, isSpeechSupported, speakWithVoice } from "../lib/tts.js";
import { encodeBackup, decodeBackup, loadState } from "../lib/storage.js";

const PREVIEW_TEXT = "Hello! Let's practise for BECE together. One, two, three!";

export default function Settings({ onReset, onRestore }) {
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [childPitch, setPitch] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [code, setCode] = useState("");
  const [restoreText, setRestoreText] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");

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
    speakWithVoice(v, PREVIEW_TEXT);
  };

  const makeCode = () => {
    try {
      setCode(encodeBackup(loadState()));
      setRestoreMsg("");
    } catch {
      setCode("");
      setRestoreMsg("Couldn't make a backup code on this device.");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setRestoreMsg("Code copied \u2713");
    } catch {
      setRestoreMsg("Couldn't copy — long-press the code and tap Copy instead.");
    }
  };

  const doRestore = () => {
    try {
      const backup = decodeBackup(restoreText);
      onRestore(backup);
      setRestoreMsg("Progress restored on this device \u2713");
      setRestoreText("");
    } catch (err) {
      setRestoreMsg(err.message || "Couldn't restore with that code.");
    }
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
              Tap a voice to hear a preview. Choices save automatically. Tap any &#128266; button to hear reading in your chosen voice.
            </p>
          </div>
        )}
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Backup &amp; Restore</div>
        <div className="card settings-card">
          <p className="muted settings-hint">
            Carry your progress to another device with a backup code — no account
            needed, works fully offline. Make a code here, then paste it on the
            other device.
          </p>
          <button className="btn btn-primary" onClick={makeCode}>
            &#128427;&#65039; Make backup code
          </button>
          {code && (
            <>
              <p className="backup-code">{code}</p>
              <button className="btn btn-secondary mt" onClick={copyCode}>
                &#128203; Copy code
              </button>
            </>
          )}
          <div className="account-form">
            <textarea
              className="txt-input backup-input"
              rows={2}
              placeholder="Paste a backup code here to restore on this device..."
              value={restoreText}
              onChange={(e) => setRestoreText(e.target.value)}
            />
            {restoreMsg && (
              <p className={"muted settings-hint" + (restoreMsg.includes("restored") || restoreMsg.includes("copied") ? "" : " settings-warn")}>
                {restoreMsg}
              </p>
            )}
            <button className="btn btn-primary" disabled={!restoreText.trim()} onClick={doRestore}>
              Restore progress here
            </button>
          </div>
        </div>
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
