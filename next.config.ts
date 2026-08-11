import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A production build overwrites .next while `next dev` is serving out of it,
  // and the dev server goes down mid-page — the browser then reports the CSS
  // and images as ERR_CONNECTION_REFUSED. Set NEXT_DIST_DIR to build somewhere
  // else while the dev server keeps running. Deploys leave it unset.
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
  // The dev-only badge sat over the page's bottom-left corner while reviewing
  // layouts. Compile and runtime errors are still surfaced without it.
  devIndicators: false,
};

export default nextConfig;
