/* eslint-disable no-restricted-globals */
// service-worker.js — hand-written service worker (no Workbox build step needed).
//
// FIX HISTORY:
// v2 -> v3: cache.match() failed to find entries due to Vary header
// mismatches. Fixed with { ignoreVary: true } on all lookups.
//
// v3 -> v4: fetch(request) for navigation used the original request object,
// which the browser marks redirect:'manual'. Tried fixing by fetching with
// a fresh redirect:'follow' Request instead.
//
// v4 -> v5: the REAL root cause — caching '/' separately from '/index.html'
// meant the response cached under '/' may have internally followed a
// redirect (many static servers 30x '/' -> '/index.html'), which marks
// that cached Response object with an internal "redirected" flag. Chrome
// refuses to serve an already-redirected response to ANY navigation
// FetchEvent, full stop — no matter how carefully we fetch it live, because
// the check is against the original event.request (always redirect:
// 'manual' for navigations), not how we constructed our own fetch. Fix:
// (a) stop caching '/' as a separate entry — only cache '/index.html'
//     directly, which returns 200 with no redirect involved.
// (b) when serving the cached shell as an offline fallback, rebuild a
//     brand new Response object from its body/headers — this strips any
//     leftover "redirected" metadata, since a freshly constructed Response
//     was never fetched over the network and carries no such flag.

const STATIC_CACHE = 'ghost-trail-static-v5';
const TILE_CACHE = 'ghost-trail-tiles-v1';
const API_CACHE = 'ghost-trail-api-v1';

// NOTE: '/' deliberately excluded — only cache '/index.html' directly to
// avoid ever storing a response that went through an internal redirect.
const BASE_ASSETS = ['/index.html', '/manifest.json', '/favicon.ico'];

const MATCH_OPTS = { ignoreVary: true, ignoreSearch: false };

const OFFLINE_FALLBACK_HTML = `<html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;">
<h2>You are offline</h2><p>This page has not been cached yet. Reconnect and revisit it once to enable offline access.</p>
</body></html>`;

async function precacheAppShell(cache) {
  await cache.addAll(BASE_ASSETS);
  try {
    const htmlResponse = await fetch('/index.html', { cache: 'reload' });
    const html = await htmlResponse.clone().text();
    const assetRegex = /(?:src|href)="(\/static\/(?:js|css)\/[^"]+)"/g;
    const assetUrls = new Set();
    let match;
    while ((match = assetRegex.exec(html)) !== null) assetUrls.add(match[1]);

    await Promise.all(
      [...assetUrls].map((url) =>
        fetch(url).then((res) => { if (res.ok) return cache.put(url, res); }).catch(() => {})
      )
    );
  } catch (err) {
    // Base assets are still cached even if this discovery step fails
  }
}

// Builds a completely fresh Response from a cached one, stripping any
// leftover redirected/opaque metadata so it's always safe to hand to
// respondWith() for a navigation FetchEvent.
async function cleanResponse(cachedResponse) {
  const body = await cachedResponse.clone().blob();
  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers: cachedResponse.headers
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => precacheAppShell(cache)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, TILE_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => !currentCaches.includes(name)).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // 1. Map tiles — cache-first
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) =>
        cache.match(request, MATCH_OPTS).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => { cache.put(request, response.clone()); return response; })
            .catch(() => cached || new Response('', { status: 504 }));
        })
      )
    );
    return;
  }

  // 2. Trail API data — network-first, cache fallback
  if (url.pathname.startsWith('/api/trails')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        fetch(request)
          .then((response) => { cache.put(request, response.clone()); return response; })
          .catch(() =>
            cache.match(request, MATCH_OPTS).then((cached) => cached || new Response(
              JSON.stringify({ error: 'Offline — no cached data for this request' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            ))
          )
      )
    );
    return;
  }

  // 3. Navigation requests — network first, fall back to a freshly-built
  // Response from the cached index.html (never the raw cached object, to
  // avoid the redirected-response restriction on navigation FetchEvents).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html', MATCH_OPTS).then((cached) => {
          if (cached) return cleanResponse(cached);
          return new Response(OFFLINE_FALLBACK_HTML, { status: 200, headers: { 'Content-Type': 'text/html' } });
        })
      )
    );
    return;
  }

  // 4. Everything else (JS/CSS bundles, static files) — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request, MATCH_OPTS).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => new Response('', { status: 504 }));
      })
    );
  }
});