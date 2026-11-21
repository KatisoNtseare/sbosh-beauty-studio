import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["app-dev.proit.dev"],
  cacheComponents: true,
  partialPrefetching: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
