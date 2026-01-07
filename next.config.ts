import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/socket',
        destination: `${process.env.NEXT_PUBLIC_TRACCAR_API_URL}/api/socket`,
      },
    ];
  },
};

export default nextConfig;
