import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 31536000,
  },
  // experimental: {
  //   optimizeCss: true,
  // },
};

export default nextConfig;
