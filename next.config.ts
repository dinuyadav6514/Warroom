import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/aviation',
        destination: '/radar',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
