import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin uses Node built-ins and shouldn't be bundled by the server compiler.
  serverExternalPackages: ["firebase-admin"],
  // The dev-only badge sat over the page's bottom-left corner while reviewing
  // layouts. Compile and runtime errors are still surfaced without it.
  devIndicators: false,
};

export default nextConfig;
