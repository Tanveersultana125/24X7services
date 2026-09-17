import type { MetadataRoute } from 'next'
import { brand } from '@/config/brand'

/**
 * What the browser needs to install this as an app.
 *
 * `start_url` is the splash, not Home, because the splash is the screen that
 * knows whether there is a saved location and where to send someone. Opening
 * straight into Home would show an empty location pill to anyone installing
 * before they have chosen one.
 *
 * `display: standalone` rather than `fullscreen`: the status bar carries the
 * clock and the battery, and an app somebody uses while waiting for a
 * technician is an app they want to check the time in.
 *
 * The trailing slashes are deliberate — `trailingSlash: true` is what makes the
 * export resolve under `file://` in the Android WebView, and a start_url
 * without one would be a redirect on every launch.
 */
/**
 * A generated manifest is a route handler, and a route handler in a static
 * export has to say it is static. Without this the build fails outright rather
 * than quietly shipping an app with no manifest.
 */
export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.fullName} — ${brand.tagline}`,
    short_name: brand.name,
    description:
      'Book appliance repair, service, installation and maintenance. Transparent pricing, verified technicians, and repairs only after your approval.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // The palette has exactly two surfaces, and these are them.
    background_color: '#ffffff',
    theme_color: '#2547d0',
    categories: ['business', 'utilities'],
    lang: 'en-IN',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Drawn with the wordmark inside the safe area, because a launcher crops
      // a maskable icon to its own shape.
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Book a service',
        short_name: 'Book',
        url: '/services/',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Your bookings',
        short_name: 'Bookings',
        url: '/bookings/',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
