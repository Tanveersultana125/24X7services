import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A production build overwrites .next while `next dev` is serving out of it,
  // and the dev server goes down mid-page — the browser then reports the CSS
  // and images as ERR_CONNECTION_REFUSED. Set NEXT_DIST_DIR to build somewhere
  // else while the dev server keeps running. Deploys leave it unset.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // firebase-admin uses Node built-ins and shouldn't be bundled by the server compiler.
  serverExternalPackages: ["firebase-admin"],
  // The dev-only badge sat over the page's bottom-left corner while reviewing
  // layouts. Compile and runtime errors are still surfaced without it.
  devIndicators: false,
};

export default nextConfig;
