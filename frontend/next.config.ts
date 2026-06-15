import type { NextConfig } from "next";

// Backend base URL (Cloud Run). Set API_BASE_URL in the environment.
// Falls back to the local Spring Boot port for development.
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // Proxy /api/* to the Spring Boot backend so the browser calls same-origin
  // (no CORS) and the backend URL stays server-side.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
