import { useState, useEffect } from "react";

export function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = {};
  query.split("&").forEach((pair) => {
    const [k, v = ""] = pair.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return { parts, params };
}

// Remembers the hash we navigated away FROM (set on every navigate() call).
// Used to go "back to where you were" (e.g. Settings back button keeps
// context instead of always dumping you on the landing screen).
let fromHash = "/";

export function useHashRoute() {
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export function navigate(hash) {
  if (hash == null) return;
  fromHash = window.location.hash.replace(/^#/, "") || "/";
  window.location.hash = hash;
}

// The route we last navigated away from (falls back to the landing).
export function previousHash() {
  return fromHash || "/";
}

// Determine the "back" target from the current route, independent of browser
// history. Each screen maps to its logical parent.
export function goBack(parts) {
  if (!parts.length) return "/";
  if (parts[0] === "subject") {
    if (parts.length <= 2) return "/"; // subject home -> home
    return `/subject/${parts[1]}`; // learn/path/glossary/quiz -> subject
  }
  // past-papers, mock-exam, progress, settings -> home
  return "/";
}
