import { useState } from "react";
import { FiZap } from "react-icons/fi";
import { isConfigured, signUp, signIn, validUsername, pinError } from "../lib/firebase.js";

function errorName(err) {
  if (err && err.code) return err.code;
  const m = err && err.message ? String(err.message) : "";
  const hit = m.match(/\(auth\/([a-z-]+)\)/);
  return hit ? "auth/" + hit[1] : "";
}

export default function AuthGate({ onGuest }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const doAuth = async (mode) => {
    setAuthError("");
    if (!isConfigured()) {
      setAuthError("Cloud sync is not set up yet on this build.");
      return;
    }
    if (!validUsername(username)) {
      setAuthError("Use a username of 3\u201320 letters or numbers (no spaces).");
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
        setAuthError("That username is taken \u2014 pick another one, or sign in instead.");
      } else if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setAuthError("Wrong username or PIN.");
      } else if (code === "auth/operation-not-allowed") {
        setAuthError("Accounts aren\u2019t enabled in Firebase yet \u2014 enable Email/Password sign-in, then try again.");
      } else if (code === "auth/unauthorized-domain") {
        setAuthError("This site isn\u2019t an authorized domain in Firebase yet.");
      } else {
        setAuthError("Something went wrong (" + (errorName(err) || code || "unknown") + "). Check your connection and try again.");
      }
    }
  };

  return (
    <div className="auth-gate">
      <div className="card auth-card">
        <span className="mascot-big" aria-hidden="true">{"\u{1F989}"}</span>
        <div className="auth-title">Welcome to Study Buddy</div>
        <p className="muted auth-subtitle">
          Practise BECE questions, build streaks and track your goals.
        </p>

        {!isConfigured() ? (
          <p className="settings-warn">
            Cloud sync isn&rsquo;t configured on this build yet, so accounts
            aren&rsquo;t available.
          </p>
        ) : (
          <>
            <p className="muted settings-hint">
              Create an account (or sign in) so your progress follows you to
              any device \u2014 just a username and a 4\u20136 digit PIN.
            </p>
            <div className="account-form">
              <input
                className="txt-input"
                type="text"
                placeholder="Pick a username (e.g. ama12)"
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
                placeholder="PIN (4\u20136 digits)"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              {pin.length > 0 && pinError(pin) && (
                <p className="settings-warn">{pinError(pin)}</p>
              )}
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

        <button className="auth-guest" onClick={onGuest} disabled={busy}>
          <FiZap size={14} /> Continue without an account
        </button>
      </div>
    </div>
  );
}