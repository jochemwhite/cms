import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  output: "standalone",
  // Turbopack mis-resolves prettier subpaths (prettier/plugins/html) when bundled;
  // @react-email/render depends on them for HTML formatting.
  serverExternalPackages: ["prettier", "@react-email/render"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.amrio.nl",
      },
    ],
  },
};

export default nextConfig;
