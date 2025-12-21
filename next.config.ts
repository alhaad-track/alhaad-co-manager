import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/socket',
        destination: 'http://144.21.50.12/api/socket',
      },
    ];
  },
};

export default nextConfig;
