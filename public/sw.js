const CACHE = "studybuddy-v3";

// On install, precache just the shell + manifest so the app works offline
// immediately. We do NOT pin index.html here — navigations refresh it from the
// network on every deploy (see the navigate branch below).
const CORE = ["./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Clean out old cache versions (v2 pinned the old build forever).
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;

  // App navigation: NETWORK-FIRST. Fetch the newest index.html from the
  // server, cache it for offline use, and fall back to the cached shell only
  // when the network is unavailable. This is what lets updates appear without
  // clearing site data.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match("./index.html")
            .then((cached) => cached || new Response("Offline", { status: 503 }))
        )
    );
    return;
  }

  // Everything else: STALE-WHILE-REVALIDATE. Serve the cached copy instantly,
  // refresh it from the network in the background, so new builds and refreshed
  // hashed assets propagate without a manual cache wipe.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const refresh = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      if (cached) {
        event.waitUntil(refresh.then(() => {}).catch(() => {}));
        return cached;
      }
      return refresh;
    })
  );
});