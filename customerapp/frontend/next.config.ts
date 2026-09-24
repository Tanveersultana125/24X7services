import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * The version Profile prints at the bottom, so a customer telling support
 * "I'm on 0.1.0" is telling them something true. Read from package.json rather
 * than written out again here: two places to bump is one place to forget, and
 * the one nobody remembers is the one on screen.
 */
const { version } = JSON.parse(
  readFileSync(path.join(__dirname, 'package.json'), 'utf8')
) as { version: string }

/**
 * Whether this build is the backend-free demo (lib/demo.ts).
 *
 * An explicit NEXT_PUBLIC_DEMO_MODE always wins. Left unset, a Vercel build
 * with no Firebase key becomes the demo — that is a shared preview link with no
 * project behind it, and without this it opens on a crash
 * (`auth/invalid-api-key`) rather than on the app. Anywhere else a missing key
 * still fails loudly, as lib/firebase.ts intends.
 */
function demoMode(): string {
  const explicit = process.env.NEXT_PUBLIC_DEMO_MODE
  if (explicit) return explicit
  const onVercel = Boolean(process.env.VERCEL)
  const hasKey = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
  return String(onVercel && !hasKey)
}

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

  /**
   * `next build` and `next dev` both own `.next` by default, so a production
   * build run while the dev server is up overwrites the directory underneath
   * it. The dev server keeps serving — HTML and every chunk come back 200 —
   * but the client never hydrates, so every screen sits on its skeleton
   * forever with nothing in the console. It looks exactly like a broken page
   * and it is a broken build directory. Set NEXT_DIST_DIR to build somewhere
   * else — the static export lands there too, so a verification build can be
   * served and checked without touching either `.next` or `out`.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Inlined at build time, which is the only way a static export can carry it.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_DEMO_MODE: demoMode(),
  },

  turbopack: {
    // There is a second lockfile one directory up, for the marketing site that
    // shares this repo. Left to infer, Turbopack picks that one and resolves
    // modules from the wrong tree — @app/shared among them. The workspace root
    // is where this app's node_modules actually lives.
    root: path.join(__dirname, '..'),
  },

  // A WebView loads the bundle over file://, where a request for /home cannot
  // fall back to /home.html the way a web server would. Trailing slashes emit
  // /home/index.html, which resolves under both file:// and a static host.
  trailingSlash: true,

  // There is no image optimizer behind a static export. Images are sized and
  // compressed before they are committed, or at upload time.
  images: {
    unoptimized: true,
  },

  /**
   * Off. It is a dev-only badge and it sits bottom-left, which on this app is
   * on top of the Home tab in the bottom nav — the one control every screen
   * has. Anything checked over the dev server has it covering that tab, and a
   * screenshot taken to look at the nav has a Next.js logo in it instead.
   *
   * Nothing is lost: compile and runtime errors still surface on screen, and
   * the badge never shipped in the first place — a static export has no dev
   * server to draw it.
   */
  devIndicators: false,

  // Every internal href is checked against the routes that actually exist. With
  // no server to 404 gracefully, a typo'd link in a WebView is a dead end.
  typedRoutes: true,

  experimental: {
    // The router prefetches a per-segment payload for every link in view, at
    // `__next.<segment>.txt`. A static export does not emit those files, so on
    // a static host every one of them is a 404 — nine of them on the services
    // screen alone, and navigation silently falls back to a full load.
    //
    // Inlining puts those payloads in the HTML instead, so the router already
    // has what it would have asked for.
    prefetchInlining: true,
  },
}

export default nextConfig
