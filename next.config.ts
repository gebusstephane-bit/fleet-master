import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* On ignore les erreurs TypeScript pour le build */
  typescript: {
    ignoreBuildErrors: true,
  },
export default nextConfig;
