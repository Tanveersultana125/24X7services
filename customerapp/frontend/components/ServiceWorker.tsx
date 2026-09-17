'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Register the service worker, on the web only.
 *
 * Inside the Android WebView the bundle is already on the device and served
 * over `file://`, where a service worker cannot register and would not help if
 * it could. Registering there produces a console error on every launch and
 * nothing else.
 *
 * Registration waits for `load`. A service worker installing while the first
 * screen is still fetching competes with it for the same connection, which
 * makes the first visit — the one that decides whether anyone comes back —
 * slower for a benefit that only arrives on the second.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }
    // A worker registered from the dev server would cache a build that changes
    // every save, which is a whole afternoon of debugging something that is not
    // broken.
    if (process.env.NODE_ENV !== 'production') return

    function register(): void {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' })
    }

    if (document.readyState === 'complete') {
      register()
      return
    }

    window.addEventListener('load', register)
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
