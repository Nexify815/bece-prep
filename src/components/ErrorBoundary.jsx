import { Component } from "react";

// A render error anywhere below this boundary used to blank the whole app
// (React unmounts the tree — no boundary existed). Wrap the shell AND every
// route so one bad screen can never take the app down, and recover cleanly.
const CHUNK_RELOAD_KEY = "sb_chunk_reload_at";
const CHUNK_RELOAD_COOLDOWN_MS = 10 * 1000;

function isChunkError(err) {
  const msg = String((err && (err.message || err.name)) || err || "");
  return (
    /dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /loading chunk/i.test(msg) ||
    /chunkloaderror/i.test(msg)
  );
}

async function clearCaches() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, recovering: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // A stale service worker serving an old asset manifest throws a chunk
    // error. Reload once (within a cooldown so we never loop) to fetch the
    // fresh build before showing the fallback.
    if (isChunkError(error)) {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
      } catch {
        /* ignore */
      }
      if (Date.now() - last > CHUNK_RELOAD_COOLDOWN_MS) {
        try {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
        window.location.reload();
        return;
      }
    }
    // eslint-disable-next-line no-console
    console.error("StudyBuddy crashed:", error, info);
  }

  // Reset the boundary when the route changes so navigating away from a broken
  // screen brings the app back without a full reload.
  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = async () => {
    this.setState({ recovering: true });
    await clearCaches();
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="center error-boundary">
        <span className="mascot-big" aria-hidden="true">{"\u{1F989}"}</span>
        <h2 className="results-title">Something went wrong</h2>
        <p className="muted">
          No worries — your progress is safe. Reload to keep studying.
        </p>
        <button className="btn btn-primary mt" onClick={this.handleReload} disabled={this.state.recovering}>
          Reload
        </button>
        <button className="btn btn-secondary mt" onClick={this.handleReset} disabled={this.state.recovering}>
          {this.state.recovering ? "Fixing\u2026" : "Fix \u0026 reload"}
        </button>
        {this.props.onHome && (
          <button className="btn btn-secondary mt" onClick={this.props.onHome} disabled={this.state.recovering}>
            Back to start
          </button>
        )}
      </div>
    );
  }
}
