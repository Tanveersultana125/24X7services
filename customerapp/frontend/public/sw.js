/**
 * The service worker.
 *
 * Its job is narrow on purpose: keep the app shell available when the network
 * is not, and get out of the way otherwise. It caches nothing a customer would
 * be misled by — no booking, no invoice, no price. Firestore keeps its own
 * offline copy of that data and knows when it is stale; a service worker
 * serving a six-hour-old booking status from a cache does not.
 *
 * Three rules:
 *
 *   - Navigations go to the network first and fall back to the cache, then to
 *     the offline screen. Stale HTML is the one thing that makes an app look
 *     broken after a deploy.
 *   - Build assets are immutable by content hash, so they are cache-first and
 *     never revalidated.
 *   - Everything else — Firebase, Razorpay, Maps, the fonts — is left alone.
 *     Intercepting an API call is how a service worker starts answering
 *     questions it cannot answer correctly.
 *
 * Written by hand rather than generated. A generated worker precaches the whole
 * build and expires it on rules nobody in this repository can explain, which is
 * the wrong trade for fifty lines of behaviour.
 */

/* global caches */

// Bumped when the shell or these rules change; the activate handler deletes
// every cache that is not this one.
const VERSION = 'v1'
const SHELL = `shell-${VERSION}`
const ASSETS = `assets-${VERSION}`

const OFFLINE_URL = '/offline/'

/** The least that has to be there for the app to render something honest. */
const SHELL_URLS = [OFFLINE_URL, '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(SHELL_URLS))
      // A new worker should take over at the next navigation rather than
      // waiting for every tab to close.
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL && key !== ASSETS)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

/** Anything under here is content-hashed by the build and safe to keep. */
function isBuildAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/icons/'))
  )
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Someone else's server. Firebase in particular has its own retry and its
  // own offline behaviour, and both are better than anything here.
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(SHELL).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached ?? caches.match(OFFLINE_URL)
        })
    )
    return
  }

  if (isBuildAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            // Only a real answer is worth keeping. An opaque or failed response
            // cached here would be served forever.
            if (response.ok) {
              const copy = response.clone()
              void caches.open(ASSETS).then((cache) => cache.put(request, copy))
            }
            return response
          })
      )
    )
  }
})
