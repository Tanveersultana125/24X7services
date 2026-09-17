import type { NextConfig } from 'next'

/**
 * The app ships two ways from one build: a PWA on the web, and a Capacitor
 * WebView on Android. Both serve plain files, so this config exists mostly to
 * keep anything that needs a Node server out of the output.
 *
 * What that rules out, and what the code must therefore avoid: server actions,
 * route handlers that read the request, proxy, redirects, rewrites, headers,
 * cookies, and dynamic route segments without generateStaticParams. Booking and
 * detail screens use query params for that last reason.
 */
const nextConfig: NextConfig = {
  output: 'export',

  // A WebView loads the bundle over file://, where a request for /home cannot
  // fall back to /home.html the way a web server would. Trailing slashes emit
  // /home/index.html, which resolves under both file:// and a static host.
  trailingSlash: true,

  // There is no image optimizer behind a static export. Images are sized and
  // compressed before they are committed, or at upload time.
  images: {
    unoptimized: true,
  },

  // Every internal href is checked against the routes that actually exist. With
  // no server to 404 gracefully, a typo'd link in a WebView is a dead end.
  typedRoutes: true,
}

export default nextConfig
