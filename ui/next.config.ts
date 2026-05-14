import type { NextConfig } from "next";

// API_URL is a server-side runtime env var — safe to inject via K8s/Docker at deploy time.
// The rewrite proxies all /api/* requests from the browser to the backend service.
const backendUrl = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
