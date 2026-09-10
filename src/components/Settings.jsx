import { useState, useEffect } from "react";
import {
  FiSmile, FiVolume2, FiSmartphone, FiRefreshCw,
  FiUpload, FiCopy,
} from "react-icons/fi";
import { LuTrophy } from "react-icons/lu";
import { getVoices, getSavedVoice, setSavedVoice, isChildPitch, setChildPitch, isSpeechSupported, speakWithVoice } from "../lib/tts.js";
import { encodeBackup, decodeBackup, loadState } from "../lib/storage.js";
import { isConfigured, signUp, signIn, signOut, validUsername, pinError } from "../lib/firebase.js";
import { setSoundEnabled, isSoundEnabled, setHapticsEnabled, isHapticsEnabled } from "../lib/sound.js";

const PREVIEW_TEXT = "Hello! Let's practise for BECE together. One, two, three!";

function errorName(err) {
  if (err && err.code) return err.code;
  const m = err && err.message ? String(err.message) : "";
  const hit = m.match(/\(auth\/([a-z-]+)\)/);
  return hit ? "auth/" + hit[1] : "";
}

export default function Settings({ onReset, onRestore, account, syncStatus, onSyncNow, prefs = {}, onPrefs, onGoalSecs, onNotifHour }) {
  const [voices, setVoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [childPitch, setPitch] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [code, setCode] = useState("");
  const [restoreText, setRestoreText] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [hapOn, setHapOn] = useState(isHapticsEnabled());
  const [goalMin, setGoalMin] = useState(Math.round((prefs.goalSecs || 7200) / 60));
  const [notifHour, setNotifHour] = useState(prefs.notifHour != null ? prefs.notifHour : "");
  const [leaderOpt, setLeaderOpt] = useState(!!prefs.leaderboardOptIn);
  const [nickname, setNickname] = useState(prefs.nickname || "");

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
                <span className="voice-toggle-label"><FiSmile size={16} /> Kid-friendly voice (younger tone)</span>
              </label>
            </div>
            <p className="muted settings-hint">
              Tap a voice to hear a preview. Choices save automatically. Tap any <FiVolume2 size={12} /> button to hear reading in your chosen voice.
            </p>
          </div>
        )}
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Sound &amp; Vibration</div>
        <div className="card settings-card">
          <label className="voice-toggle">
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => {
                setSoundOn(e.target.checked);
                setSoundEnabled(e.target.checked);
              }}
            />
            <span className="voice-toggle-label"><FiVolume2 size={16} /> Sound effects</span>
          </label>
          <label className="voice-toggle">
            <input
              type="checkbox"
              checked={hapOn}
              onChange={(e) => {
                setHapOn(e.target.checked);
                setHapticsEnabled(e.target.checked);
              }}
            />
            <span className="voice-toggle-label"><FiSmartphone size={16} /> Vibrations</span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Daily Goal &amp; Reminder</div>
        <div className="card settings-card">
          <div className="voice-section">
            <div className="voice-title">Daily time goal</div>
            <div className="goal-options">
              {[30, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  className={"goal-option" + (goalMin === m ? " selected" : "")}
                  onClick={() => {
                    setGoalMin(m);
                    if (onGoalSecs) onGoalSecs(m * 60);
                  }}
                >
                  {m} min
                </button>
              ))}
            </div>
            <p className="muted settings-hint">
              StudyBuddy streaks and the daily card are measured against this goal.
            </p>
          </div>
          <div className="voice-section">
            <div className="voice-title">Reminder</div>
            <input
              className="txt-input"
              type="time"
              value={notifHour || ""}
              onChange={(e) => {
                setNotifHour(e.target.value);
                if (onNotifHour) onNotifHour(e.target.value || null);
              }}
            />
            <p className="muted settings-hint">
              Set a time and this device will nudge you each day if your goal isn't
              done yet (browser permission required the first time).
            </p>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Leaderboard</div>
        <div className="card settings-card">
          <label className="voice-toggle">
            <input
              type="checkbox"
              checked={leaderOpt}
              onChange={(e) => {
                setLeaderOpt(e.target.checked);
                if (onPrefs) onPrefs({ leaderboardOptIn: e.target.checked });
              }}
            />
            <span className="voice-toggle-label"><LuTrophy size={16} /> Join the global leaderboard</span>
          </label>
          {leaderOpt && (
            <div className="account-form">
              <input
                className="txt-input"
                type="text"
                maxLength={16}
                placeholder="Display name (e.g. Ama12)"
                value={nickname}
                autoCapitalize="none"
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (onPrefs) onPrefs({ nickname: e.target.value });
                }}
              />
            </div>
          )}
          <p className="muted settings-hint">
            Your total XP competes weekly on the global board. Sign in with an account
            to save your spot; otherwise the board is saved locally.
          </p>
        </div>
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
              <button className="btn btn-secondary mt" onClick={onSyncNow}>
                <FiRefreshCw /> Sync now
              </button>
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
        <div className="settings-group-title">Backup &amp; Restore</div>
        <div className="card settings-card">
          <p className="muted settings-hint">
            Carry your progress to another device with a backup code — no account
            needed, works fully offline. Make a code here, then paste it on the
            other device.
          </p>
          <button className="btn btn-primary" onClick={makeCode}>
            <FiUpload /> Make backup code
          </button>
          {code && (
            <>
              <p className="backup-code">{code}</p>
              <button className="btn btn-secondary mt" onClick={copyCode}>
                <FiCopy /> Copy code
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
