import { useState, useEffect, useCallback } from "react";

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
  window.location.hash = hash;
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
