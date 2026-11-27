import { useState, useEffect } from "react";
import {
  LuHeart, LuClock, LuVolume2, LuVibrate, LuUserRound, LuTrophy, LuCloud,
  LuPlay, LuSmile, LuRefreshCw, LuRotateCcw, LuUpload, LuCopy, LuSettings2,
} from "react-icons/lu";
import {
  getVoices, getSavedVoice, setSavedVoice, isChildPitch, setChildPitch,
  isSpeechSupported, speakWithVoice,
} from "../lib/tts.js";
import { encodeBackup, decodeBackup, loadState } from "../lib/storage.js";
import {
  isConfigured, signUp, signIn, signOut, validUsername, pinError,
  authLockRemainingMs, recordAuthFailure, clearAuthFailures,
} from "../lib/firebase.js";
import { setSoundEnabled, isSoundEnabled, setHapticsEnabled, isHapticsEnabled } from "../lib/sound.js";
import { previewAll, setPreviewAll } from "../lib/dev.js";

const PREVIEW_TEXT = "Hello! Let's practise for BECE together. One, two, three!";

function errorName(err) {
  if (err && err.code) return err.code;
  const m = err && err.message ? String(err.message) : "";
  const hit = m.match(/\(auth\/([a-z-]+)\)/);
  return hit ? "auth/" + hit[1] : "";
}

function CardHead({ Icon, children, tone }) {
  return (
    <div className="st-head">
      <span className={"st-head-icon" + (tone ? " st-tone-" + tone : "")} aria-hidden="true">
        <Icon size={22} strokeWidth={2.6} />
      </span>
      <h2>{children}</h2>
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className="st-switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export default function Settings({ onReset, onRestore, account, syncStatus, onSyncNow, onSignOut, prefs = {}, onPrefs, onGoalSecs, onNotifHour, studyMode = "practice", onSetStudyMode, onResetOnboarding }) {
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
  const [goalMin, setGoalMin] = useState(Math.round((prefs.goalSecs || 60 * 60) / 60));
  const [notifHour, setNotifHour] = useState(prefs.notifHour != null ? prefs.notifHour : "");
  const [leaderOpt, setLeaderOpt] = useState(!!prefs.leaderboardOptIn);
  const [nickname, setNickname] = useState(prefs.nickname || "");
  const [previewOn, setPreviewOn] = useState(previewAll());

  // Give the shell the reference page's light-green canvas, like Home / Shop.
  useEffect(() => {
    document.documentElement.classList.add("settings-route");
    return () => document.documentElement.classList.remove("settings-route");
  }, []);

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
      setRestoreMsg("Code copied");
    } catch {
      setRestoreMsg("Couldn't copy — long-press the code and tap Copy instead.");
    }
  };

  const doRestore = () => {
    try {
      const backup = decodeBackup(restoreText);
      onRestore(backup);
      setRestoreMsg("Progress restored on this device");
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
    if (authLockRemainingMs() > 0) {
      setAuthError(`Too many tries — wait about ${Math.ceil(authLockRemainingMs() / 60000)} min.`);
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
      await new Promise((r) => setTimeout(r, 200)); // let onUser update the app
      setBusy(false);
    } catch (err) {
      setBusy(false);
      recordAuthFailure();
      const errCode = (err && err.code) || "";
      if (mode === "signup" && errCode === "auth/email-already-in-use") {
        setAuthError("That username is taken — pick another one, or sign in instead.");
      } else if (errCode === "auth/invalid-credential" || errCode === "auth/user-not-found" || errCode === "auth/wrong-password") {
        setAuthError("Wrong username or PIN.");
      } else if (errCode === "auth/operation-not-allowed") {
        setAuthError("Accounts aren't enabled in Firebase yet — enable Email/Password sign-in, then try again.");
      } else if (errCode === "auth/unauthorized-domain") {
        setAuthError("This site isn't an authorized domain in Firebase yet.");
      } else {
        setAuthError("Something went wrong (" + (errorName(err) || errCode || "unknown") + "). Check your connection and try again.");
      }
    }
  };

  return (
    <div className="st-page">
      <div className="st-columns">
        <div className="st-col">
          {/* how you practise */}
          <section className="st-card">
            <CardHead Icon={LuHeart} tone="green">How you practise</CardHead>
            <div className="st-seg">
              <button
                className={"st-option" + (studyMode === "practice" ? " is-on" : "")}
                onClick={() => onSetStudyMode("practice")}
              >
                Practice<small>No heart loss</small>
              </button>
              <button
                className={"st-option" + (studyMode === "challenge" ? " is-on" : "")}
                onClick={() => onSetStudyMode("challenge")}
              >
                Challenge<small>Wrong = lose a heart</small>
              </button>
            </div>
            <p className="st-hint">
              Practice mode never takes hearts, so you can keep trying until you
              get it. Challenge mode turns the old heart rules back on: wrong
              answers cost a life.
            </p>
          </section>

          {/* daily goal & reminder */}
          <section className="st-card">
            <CardHead Icon={LuClock} tone="purple">Daily goal &amp; reminder</CardHead>
            <span className="st-label">Daily time goal</span>
            <div className="st-chips">
              {[30, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  className={"st-chip" + (goalMin === m ? " is-on" : "")}
                  onClick={() => {
                    setGoalMin(m);
                    if (onGoalSecs) onGoalSecs(m * 60);
                  }}
                >
                  {m} min
                </button>
              ))}
            </div>
            <p className="st-hint">
              StudyBuddy streaks and the daily card are measured against this goal.
            </p>
            <span className="st-label">Reminder</span>
            <input
              className="st-input"
              type="time"
              aria-label="Reminder time"
              value={notifHour || ""}
              onChange={(e) => {
                setNotifHour(e.target.value);
                if (onNotifHour) onNotifHour(e.target.value || null);
              }}
            />
            <p className="st-hint">
              Set a time and this device will nudge you each day if your goal isn&rsquo;t
              done yet (browser permission required the first time).
            </p>
          </section>

          {/* sound & vibration */}
          <section className="st-card">
            <CardHead Icon={LuVolume2} tone="orange">Sound &amp; vibration</CardHead>
            <div className="st-row">
              <b>Sound effects</b>
              <Switch
                label="Sound effects"
                checked={soundOn}
                onChange={(v) => { setSoundOn(v); setSoundEnabled(v); }}
              />
            </div>
            <div className="st-row">
              <b>Vibrations</b>
              <Switch
                label="Vibrations"
                checked={hapOn}
                onChange={(v) => { setHapOn(v); setHapticsEnabled(v); }}
              />
            </div>
          </section>

          {/* account */}
          <section className="st-card">
            <CardHead Icon={LuUserRound} tone="pink">Account</CardHead>
            {account ? (
              <>
                <p className="st-line">
                  Signed in as <strong>{account.username}</strong>
                </p>
                <p className="st-hint">
                  {syncStatus
                    ? syncStatus
                    : "Your progress is saved in the cloud. Sign in with the same username and PIN on any device to carry it over."}
                </p>
                <button className="st-btn st-btn-outline" onClick={onSyncNow}>
                  <LuRefreshCw size={17} /> Sync now
                </button>
                <button className="st-btn st-btn-outline" onClick={() => (onSignOut ? onSignOut() : signOut())}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <p className="st-hint">
                  Create an account so your progress follows you to any device.
                  Just pick a username and a 6-digit PIN.
                </p>
                {!isConfigured() && (
                  <p className="st-warn">Cloud sync isn&rsquo;t configured on this build yet, so accounts aren&rsquo;t available.</p>
                )}
                <div className="st-chips">
                  <span className="st-chip is-on">Create account</span>
                  <span className="st-chip">Sign in</span>
                </div>
                <div className="st-two">
                  <input
                    className="st-input"
                    type="text"
                    placeholder="Username (e.g. ama12)"
                    aria-label="Username"
                    value={username}
                    autoCapitalize="none"
                    autoCorrect="off"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <input
                    className="st-input"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit PIN"
                    aria-label="6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                {pin.length > 0 && pinError(pin, { signup: true }) && (
                  <p className="st-warn">{pinError(pin, { signup: true })}</p>
                )}
                {authError && <p className="st-warn">{authError}</p>}
                <button className="st-btn" disabled={busy} onClick={() => doAuth("signup")}>
                  {busy ? "Working…" : "Create account"}
                </button>
                <button className="st-btn st-btn-outline" disabled={busy} onClick={() => doAuth("signin")}>
                  Sign in to existing account
                </button>
              </>
            )}
          </section>
        </div>

        <div className="st-col">
          {/* reading & voice */}
          <section className="st-card">
            <CardHead Icon={LuVolume2} tone="blue">Reading &amp; voice</CardHead>
            {!isSpeechSupported() ? (
              <p className="st-hint">Your device doesn&rsquo;t support text-to-speech.</p>
            ) : (
              <>
                <span className="st-label">Voice</span>
                <div className="st-voices">
                  {voices.length === 0 && <p className="st-hint">Loading voices...</p>}
                  {voices.filter((v) => v.lang.startsWith("en")).map((v) => (
                    <div
                      key={v.name}
                      className={"st-voice" + (selected && selected.name === v.name ? " is-on" : "")}
                      onClick={() => saveVoice(v)}
                    >
                      <button
                        className="st-play"
                        aria-label={`Preview ${v.name}`}
                        onClick={(e) => { e.stopPropagation(); saveVoice(v); }}
                      >
                        <LuPlay size={14} fill="currentColor" />
                      </button>
                      <span>{v.name}</span>
                      <em>{v.lang}</em>
                    </div>
                  ))}
                </div>
                <div className="st-row">
                  <div>
                    <b>Kid-friendly voice</b>
                    <p className="st-hint">Younger tone</p>
                  </div>
                  <Switch
                    label="Kid-friendly voice"
                    checked={childPitch}
                    onChange={(v) => { setPitch(v); setChildPitch(v); }}
                  />
                </div>
                <p className="st-hint">
                  Tap a voice to hear a preview. Choices save automatically.
                </p>
              </>
            )}
          </section>

          {/* leaderboard */}
          <section className="st-card">
            <CardHead Icon={LuTrophy} tone="yellow">Leaderboard</CardHead>
            <div className="st-row">
              <b>Join the global leaderboard</b>
              <Switch
                label="Join the global leaderboard"
                checked={leaderOpt}
                onChange={(v) => {
                  setLeaderOpt(v);
                  if (onPrefs) onPrefs({ leaderboardOptIn: v });
                }}
              />
            </div>
            {leaderOpt && (
              <input
                className="st-input"
                type="text"
                maxLength={16}
                placeholder="Display name (e.g. Ama12)"
                aria-label="Display name"
                value={nickname}
                autoCapitalize="none"
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (onPrefs) onPrefs({ nickname: e.target.value });
                }}
              />
            )}
            <p className="st-hint">
              Your total XP competes weekly on the global board. Sign in with an
              account to save your spot; otherwise the board is saved locally.
            </p>
          </section>

          {/* backup & restore */}
          <section className="st-card">
            <CardHead Icon={LuCloud} tone="teal">Backup &amp; restore</CardHead>
            <p className="st-hint">
              Carry your progress to another device with a backup code. No account
              needed, works fully offline.
            </p>
            <div className="st-two">
              <div>
                <button className="st-btn" onClick={makeCode}>
                  <LuUpload size={18} /> Make backup code
                </button>
                <p className="st-hint">Make a code here, then paste it on the other device.</p>
              </div>
              <div>
                <textarea
                  className="st-input st-textarea"
                  rows={2}
                  placeholder="Paste a backup code here to restore on this device..."
                  aria-label="Backup code"
                  value={restoreText}
                  onChange={(e) => setRestoreText(e.target.value)}
                />
                <button className="st-btn st-btn-off" disabled={!restoreText.trim()} onClick={doRestore}>
                  Restore progress here
                </button>
              </div>
            </div>
            {code && (
              <>
                <p className="st-backup-code">{code}</p>
                <button className="st-btn st-btn-outline" onClick={copyCode}>
                  <LuCopy size={17} /> Copy code
                </button>
              </>
            )}
            {restoreMsg && (
              <p className={"st-hint" + (restoreMsg.includes("restored") || restoreMsg.includes("copied") ? "" : " st-warn")}>
                {restoreMsg}
              </p>
            )}
          </section>
        </div>
      </div>

      {/* more options */}
      <details className="st-more">
        <summary>
          <span className="st-head-icon st-tone-indigo" aria-hidden="true"><LuSettings2 size={18} /></span>
          More options<small>Welcome tour, About, Preview</small>
        </summary>
        <div className="st-advanced">
          <div>
            <b>Getting started</b>
            <p className="st-hint">Replay the welcome screen and the guided tour. Your progress is not affected.</p>
            <button className="st-btn st-btn-outline" onClick={() => onResetOnboarding && onResetOnboarding()}>
              <LuRotateCcw size={17} /> Show the welcome again
            </button>
          </div>
          <div>
            <b>About</b>
            <p className="st-hint">
              <strong>StudyBuddy — BECE Prep</strong><br />
              Version 4.0<br />
              Learn the words of your BECE exams the easy way, on any device, even offline.
            </p>
          </div>
          <div>
            <div className="st-row">
              <div>
                <b>Preview (temporary)</b>
                <p className="st-hint">Open locked screens</p>
              </div>
              <Switch
                label="Open locked screens"
                checked={previewOn}
                onChange={(v) => { setPreviewOn(v); setPreviewAll(v); }}
              />
            </div>
            <p className="st-hint">
              Unlock Mock Exam, Past Papers, Study Sprint, Review Mistakes and the
              subject Flashcards on a weekday. For checking screens only. Turn it
              back off when you&rsquo;re done.
            </p>
          </div>
        </div>
      </details>

      {/* danger zone */}
      <section className="st-danger">
        <div>
          <b>Danger zone</b>
          <p>Clears your XP, levels, learned terms, scores and stair progress. This cannot be undone.</p>
        </div>
        {!confirmReset ? (
          <button className="st-btn st-btn-danger" onClick={() => setConfirmReset(true)}>
            Reset progress
          </button>
        ) : (
          <div className="st-confirm">
            <p className="st-warn">Are you sure? This deletes everything on this device.</p>
            <button className="st-btn st-btn-danger" onClick={onReset}>Yes, reset everything</button>
            <button className="st-btn st-btn-outline" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        )}
      </section>
    </div>
  );
}
