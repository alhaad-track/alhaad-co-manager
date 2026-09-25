import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const traccarUrl = process.env.NEXT_PUBLIC_TRACCAR_API_URL;
    if (!traccarUrl) return [];
    return [
      {
        source: '/api/proxy/socket',
        destination: `${traccarUrl}/api/socket`,
      },
    ];
  },
};

export default nextConfig;
