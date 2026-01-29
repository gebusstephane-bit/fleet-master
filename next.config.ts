import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* On ignore les erreurs TypeScript pour le build */
  typescript: {
    ignoreBuildErrors: true,
  },
  /* On ignore les erreurs ESLint pour le build */
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
