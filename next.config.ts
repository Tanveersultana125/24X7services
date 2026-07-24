import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin uses Node built-ins and shouldn't be bundled by the server compiler.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
