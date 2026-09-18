import { useState } from "react";
import { FiDownload, FiRefreshCw, FiUpload } from "react-icons/fi";
import { downloadBackup, decodeBackup } from "../lib/storage.js";
import {
  isConfigured, signUp, signIn, validUsername, pinError,
  authLockRemainingMs, recordAuthFailure, clearAuthFailures,
} from "../lib/firebase.js";
import { useSnack } from "./Snackbar.jsx";

// Optional, non-blocking backup screen. Keeps the app usable for everyone
// (guest-first) while making it genuinely hard to lose months of progress:
// either a one-tap file download or an account that syncs to the cloud.
export default function BackupScreen({ state, account, syncStatus, onSyncNow, onSignOut, onRestore, onBackedUp, onDone }) {
  const snack = useSnack();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoreText, setRestoreText] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");

  const doDownload = () => {
    try {
      downloadBackup(state);
      if (onBackedUp) onBackedUp();
      snack("Backup file saved \u2713");
    } catch {
      snack("Couldn't save a backup on this device.");
    }
  };

  const lockMs = authLockRemainingMs();
  const locked = lockMs > 0;
  const lockMins = Math.ceil(lockMs / 60000);

  const doAuth = async (mode) => {
    setAuthError("");
    if (!isConfigured()) {
      setAuthError("Cloud backup isn't available on this build.");
      return;
    }
    if (authLockRemainingMs() > 0) {
      setAuthError(`Too many tries — wait ${Math.ceil(authLockRemainingMs() / 60000)} min.`);
      return;
    }
    if (!validUsername(username)) {
      setAuthError("Use a username of 3–20 letters or numbers (no spaces).");
      return;
    }
    const perr = pinError(pin, { signup: mode === "signup" });
    if (perr) {
      setAuthError(perr);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") await signUp(username, pin);
      else await signIn(username, pin);
      clearAuthFailures();
      if (onBackedUp) onBackedUp();
      await new Promise((r) => setTimeout(r, 200));
      setBusy(false);
    } catch (err) {
      setBusy(false);
      recordAuthFailure();
      const code = (err && err.code) || "";
      if (mode === "signup" && code === "auth/email-already-in-use") {
        setAuthError("That username is taken — pick another, or sign in.");
      } else if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setAuthError("Wrong username or PIN.");
      } else if (code === "auth/operation-not-allowed") {
        setAuthError("Accounts aren't enabled yet on this build.");
      } else if (code === "auth/unauthorized-domain") {
        setAuthError("This site isn't an authorised domain yet.");
      } else {
        setAuthError("Couldn't sign in. Check your connection and try again.");
      }
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
      <div className="section-title">Back up progress</div>
      <p className="muted">
        Your progress lives on this device. Back it up so a cleared browser or a
        new phone never wipes your streak.
      </p>

      <div className="settings-group">
        <div className="settings-group-title">Option 1 · Save a backup file</div>
        <div className="card settings-card">
          <p className="muted settings-hint">
            Saves a file you can keep or send to another device. No account needed.
          </p>
          <button className="btn btn-primary" onClick={doDownload}>
            <FiDownload /> Download backup file
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Option 2 · Cloud backup</div>
        <div className="card settings-card">
          {account ? (
            <>
              <p className="settings-line">Cloud backup on — <strong>{account.username}</strong></p>
              {syncStatus ? (
                <p className={"muted settings-hint" + (syncStatus.startsWith("Sync issue") ? " settings-warn" : "")}>
                  {syncStatus}
                </p>
              ) : (
                <p className="muted settings-hint">Sign in on any device to carry your progress over.</p>
              )}
              <button className="btn btn-secondary mt" onClick={onSyncNow}><FiRefreshCw /> Sync now</button>
              <button className="btn btn-secondary mt" onClick={onSignOut}>Sign out</button>
            </>
          ) : !isConfigured() ? (
            <p className="muted settings-hint">Cloud backup isn't available on this build — use a backup file above.</p>
          ) : (
            <>
              <p className="muted settings-hint">
                Pick a username and a 6-digit PIN. Use the same details on any
                device to get your progress back.
              </p>
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
                  maxLength={6}
                  placeholder="6-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                {pin.length > 0 && !busy && pinError(pin, { signup: true }) && (
                  <p className="settings-warn">{pinError(pin, { signup: true })}</p>
                )}
                {authError && <p className="settings-warn">{authError}</p>}
                {locked && <p className="settings-warn">Too many tries — wait about {lockMins} min.</p>}
                <button className="btn btn-primary" disabled={busy || locked} onClick={() => doAuth("signup")}>
                  {busy ? "Working\u2026" : "Create account"}
                </button>
                <button className="btn btn-secondary" disabled={busy || locked} onClick={() => doAuth("signin")}>
                  Sign in to existing account
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Restore from a code</div>
        <div className="card settings-card">
          <textarea
            className="txt-input backup-input"
            rows={2}
            placeholder="Paste a backup code here..."
            value={restoreText}
            onChange={(e) => setRestoreText(e.target.value)}
          />
          {restoreMsg && (
            <p className={"muted settings-hint" + (restoreMsg.includes("restored") ? "" : " settings-warn")}>
              {restoreMsg}
            </p>
          )}
          <button className="btn btn-primary" disabled={!restoreText.trim()} onClick={doRestore}>
            <FiUpload /> Restore progress here
          </button>
        </div>
      </div>

      {onDone && (
        <button className="btn btn-secondary mt" onClick={onDone}>Not now</button>
      )}
    </div>
  );
}
