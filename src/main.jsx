import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    // updateViaCache: "none" re-downloads sw.js on every load, so deployed
    // updates reach users without waiting for the 24h service-worker update
    // check (and without ever needing to clear site data).
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        if (registration) registration.update().catch(() => {});
      })
      .catch(() => {});
  });

  // When a newer service worker takes control, reload once so the newest
  // build is shown immediately instead of leaving the user on a stale shell.
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}
