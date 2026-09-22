/**
 * The worker that receives a push while the app is closed.
 *
 * It is a second service worker, beside `sw.js`, because Firebase Messaging
 * needs its own: the two have nothing to say to each other, and putting the
 * offline shell and the push handler in one file means a change to either one
 * reinstalls both.
 *
 * It cannot read `process.env` — it is a static file served as it is, not part
 * of the bundle — so the Firebase config arrives in the query string when the
 * app registers it. None of that config is secret; every value in it is
 * already compiled into the bundle and readable by anyone who installs the
 * app. See `lib/push.ts`, which does the registering.
 *
 * Two jobs and no more:
 *
 *   - Show the notification when one arrives with the app closed. Messages
 *     that arrive while it is open are handled in the page, not here.
 *   - Open the right screen when one is tapped, focusing a tab that is already
 *     on it rather than opening a second one — a customer who has the app open
 *     behind their browser does not want a duplicate of it.
 */

importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'
)

const params = new URL(self.location).searchParams
let config = null
try {
  const raw = params.get('config')
  if (raw) config = JSON.parse(raw)
} catch {
  config = null
}

if (config && config.projectId) {
  firebase.initializeApp(config)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? '24X7'
    const body = payload.notification?.body ?? ''
    const href = payload.data?.href ?? '/bookings'

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-48.png',
      // So a second message about the same booking replaces the first rather
      // than stacking another banner on a lock screen.
      tag: payload.data?.bookingId ?? title,
      data: { href },
    })
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const href = event.notification.data?.href ?? '/bookings'
  const url = new URL(href, self.location.origin).href

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        for (const window of windows) {
          if (window.url === url && 'focus' in window) return window.focus()
        }
        return self.clients.openWindow(url)
      })
  )
})
