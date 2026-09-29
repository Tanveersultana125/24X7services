import type { NextConfig } from 'next'

/**
 * The technician app ships the same way the customer app does: a static
 * export that runs as a PWA and can be wrapped in a WebView later. Anything
 * that needs a Node server stays out — so detail screens take `?id=` instead
 * of a dynamic segment.
 */
const nextConfig: NextConfig = {
  output: 'export',

  // A verification build must not overwrite the dev server's `.next`
  // (see the customer app's config for the long version of why).
  distDir: process.env.NEXT_DIST_DIR || '.next',

  turbopack: {
    // The repo root has its own lockfile for the marketing site; left to
    // infer, Turbopack would resolve modules from that tree.
    root: __dirname,
  },

  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  typedRoutes: true,
  experimental: { prefetchInlining: true },
}

export default nextConfig
