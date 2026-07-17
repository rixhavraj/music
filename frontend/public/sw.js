const STATIC_CACHE = "music-pwa-static-v1";
const AUDIO_CACHE = "music-pwa-audio-v2";
const STATIC_ASSETS = ["/", "/manifest.webmanifest", "/icons/icon.svg"];
const MAX_AUDIO_ITEMS = 24;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => ![STATIC_CACHE, AUDIO_CACHE].includes(key)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/stream/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});

async function cacheFirst(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
    if (maxItems) {
      await trimCache(cache, maxItems);
    }
  }

  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || Response.json({ error: "Offline" }, { status: 503 });
  }
}

async function trimCache(cache, maxItems) {
  const keys = await cache.keys();

  if (keys.length <= maxItems) {
    return;
  }

  await cache.delete(keys[0]);
  return trimCache(cache, maxItems);
}
