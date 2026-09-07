import { useState, useEffect } from "react";
import { getVoices, getSavedVoice, setSavedVoice, isChildPitch, setChildPitch, isSpeechSupported, speakWithVoice } from "../lib/tts.js";
import { isConfigured, signUp, signIn, signOut, validUsername, pinError } from "../lib/firebase.js";

const PREVIEW_TEXT = "Hello! Let's practise for BECE together. One, two, three!";

function errorName(err) {
  if (err && err.code) return err.code;
  const m = err && err.message ? String(err.message) : "";
  const hit = m.match(/\(auth\/([a-z-]+)\)/);
  return hit ? "auth/" + hit[1] : "";
}

export default function Settings({ onReset, account, syncStatus }) {
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [childPitch, setPitch] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);

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

  const doAuth = async (mode) => {
    setAuthError("");
    if (!isConfigured()) {
      setAuthError("Cloud sync is not set up yet on this build.");
      return;
    }
    if (!validUsername(username)) {
      setAuthError("Use a username of 3–20 letters or numbers (no spaces).");
      return;
    }
    const perr = pinError(pin);
    if (perr) {
      setAuthError(perr);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") await signUp(username, pin);
      else await signIn(username, pin);
      await new Promise((r) => setTimeout(r, 200)); // let onUser update the app
      setBusy(false);
    } catch (err) {
      setBusy(false);
      const code = (err && err.code) || "";
      if (mode === "signup" && code === "auth/email-already-in-use") {
        setAuthError("That username is taken — pick another one, or sign in instead.");
      } else if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setAuthError("Wrong username or PIN.");
      } else if (code === "auth/operation-not-allowed") {
        setAuthError("Accounts aren't enabled in Firebase yet — enable Email/Password sign-in, then try again.");
      } else if (code === "auth/unauthorized-domain") {
        setAuthError("This site isn't an authorized domain in Firebase yet.");
      } else {
        setAuthError("Something went wrong (" + (errorName(err) || code || "unknown") + "). Check your connection and try again.");
      }
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
        <div className="settings-group-title">Account</div>
        <div className="card settings-card">
          {account ? (
            <>
              <p className="settings-line">
                Signed in as <strong>{account.username}</strong>
              </p>
              {syncStatus ? (
                <p className={"muted settings-hint" + (syncStatus.startsWith("Sync issue") ? " settings-warn" : "")}>
                  {syncStatus}
                </p>
              ) : (
                <p className="muted settings-hint">
                  Your progress is saved in the cloud. Sign in with the same
                  username and PIN on any device to carry it over.
                </p>
              )}
              <button
                className="btn btn-secondary mt"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className="muted settings-hint">
                Create an account so your progress follows you to any device.
                Just pick a username and a 4–6 digit PIN.
              </p>
              {!isConfigured() && (
                <p className="settings-warn">
                  Cloud sync isn&rsquo;t configured on this build yet, so accounts
                  aren&rsquo;t available.
                </p>
              )}
              <div className="account-form">
                <input
                  className="txt-input"
                  type="text"
                  placeholder="Username (e.g. ama12)"
                  value={username}
                  autoCapitalize="none"
                  autoCorrect="off"
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  className="txt-input"
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN (4–6 digits)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                {authError && <p className="settings-warn">{authError}</p>}
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => doAuth("signup")}
                >
                  {busy ? "Working\u2026" : "Create account"}
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => doAuth("signin")}
                >
                  Sign in to existing account
                </button>
              </div>
            </>
          )}
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
