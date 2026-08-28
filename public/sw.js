// Offline support for CartWise.
//
// The build emits content-hashed filenames, so there's no fixed asset list to
// precache. Instead: navigations are network-first (you get the new build the
// moment you're online), and hashed assets are cache-first (their name changes
// whenever their content does, so a cached copy is never stale).
//
// All state lives in localStorage, which needs no help from here — this is
// purely about the app shell loading without a connection.

const VERSION = 'cartwise-v2'
const SHELL = `${VERSION}-shell`

// Derived from the worker's own scope rather than hard-coded, so the same
// file works at the root and under a /repo-name/ subpath on GitHub Pages.
const BASE = new URL(self.registration?.scope ?? '/', self.location.origin).pathname
const at = (path) => `${BASE}${path}`.replace(/\/{2,}/g, '/')

const OFFLINE_FALLBACK = at('index.html')

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        // Cached individually rather than with addAll: addAll is all-or-nothing,
        // so one 404 would abort the whole install and leave no offline support
        // at all.
        Promise.all(
          [OFFLINE_FALLBACK, at('manifest.webmanifest'), at('icon.svg')].map((url) =>
            cache.add(url).catch(() => {}),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

const isHashedAsset = (url) =>
  url.pathname.startsWith(at('assets/')) || url.pathname.startsWith(at('fonts/'))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Anything off-origin — only map tiles now — is left to the browser.
  if (url.origin !== self.location.origin) return

  // Navigations: try the network, fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(SHELL).then((cache) => cache.put(OFFLINE_FALLBACK, copy))
          }
          return response
        })
        .catch(async () => {
          // respondWith rejects if handed undefined, which would show the
          // browser's own error page instead of ours.
          const hit = await caches.match(OFFLINE_FALLBACK)
          return hit ?? offlineResponse()
        }),
    )
    return
  }

  // Hashed build output: cache-first, since the name changes with the content.
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(SHELL).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
    return
  }

  // Everything else (icons, manifest): network, falling back to cache.
  event.respondWith(
    fetch(request).catch(async () => {
      const hit = await caches.match(request)
      return hit ?? new Response('', { status: 504, statusText: 'Offline' })
    }),
  )
})

function offlineResponse() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>CartWise — offline</title>' +
      '<body style="font-family:system-ui;padding:2rem;text-align:center">' +
      '<h1>Offline</h1><p>Open CartWise once while connected and it will work ' +
      'offline from then on.</p></body>',
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
