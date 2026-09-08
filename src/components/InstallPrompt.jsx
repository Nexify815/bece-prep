import { useState, useEffect } from "react";

// Shows an "Add to Home Screen" banner when the browser offers PWA install.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(() => window.__sbInstallPrompt || null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      window.__sbInstallPrompt = e;
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="card install-banner">
      <span className="install-icon">&#128241;</span>
      <div className="install-main">
        <b>Install StudyBuddy</b>
        <span className="muted">Add to your home screen — works offline, like a real app.</span>
      </div>
      <button
        className="btn btn-primary btn-sm"
        onClick={async () => {
          deferred.prompt();
          setDeferred(null);
        }}
      >
        Install
      </button>
      <button className="install-close" aria-label="Dismiss" onClick={() => setDismissed(true)}>
        &#10005;
      </button>
    </div>
  );
}