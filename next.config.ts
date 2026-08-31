import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 writes development output to .next/dev, so `next build` no longer
  // overwrites what `next dev` is serving and the two can run side by side.
  // NEXT_DIST_DIR stays as the escape hatch for a throwaway verification build
  // (.next-verify) beside a live dev server: with its own tree, deleting one
  // cannot disturb the other's caches. Deploys leave it unset.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // firebase-admin uses Node built-ins and shouldn't be bundled by the server compiler.
  serverExternalPackages: ["firebase-admin"],

  /**
   * Serve Firebase's sign-in helper from our own domain.
   *
   * Google's sign-in window hands the result back through a handler page, and
   * by default that page lives on <project>.firebaseapp.com. Safari and every
   * other browser that partitions storage gives a page on another domain its
   * own sessionStorage, so the handler cannot see the state the sign-in
   * started with and fails with "missing initial state".
   *
   * Proxying /__/auth puts the handler — and the scripts it pulls in beside
   * itself — on this origin, where it shares storage with the page that opened
   * it.
   *
   * The proxy is always mounted; whether the SDK uses it is decided by
   * NEXT_PUBLIC_FIREBASE_AUTH_PROXY, because Google must be told about the new
   * redirect URI first. See lib/firebase/client.ts for what to add and where.
   */
  async rewrites() {
    const handler = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    if (!handler) return [];
    return [{ source: "/__/auth/:path*", destination: `https://${handler}/__/auth/:path*` }];
  },
  /**
   * The field app is at /tech, and nobody types that first.
   *
   * A technician handed the address says "technician", and typing it got a 404
   * — a dead end at the one door somebody standing on a doorstep needs to get
   * through. The obvious spellings land on the real one instead.
   */
  async redirects() {
    return ["/technician", "/technicians", "/technician-login", "/tech-login"].map((source) => ({
      source,
      destination: "/tech",
      permanent: false,
    }));
  },

  // The dev-only badge sat over the page's bottom-left corner while reviewing
  // layouts. Compile and runtime errors are still surfaced without it.
  devIndicators: false,
};

export default nextConfig;
