// Persists an in-progress run screen so a refresh (soft or hard) lands the
// user back where they were instead of restarting the lesson/run.
// sessionStorage is used on purpose: it survives reloads within the tab but
// is gone when the tab closes, so stale run state never leaks into tomorrow.

export function saveRun(key, snap) {
  try {
    if (snap == null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(snap));
  } catch {
    // storage unavailable or full — snapshots are best-effort
  }
}

export function loadRun(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearRun(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
