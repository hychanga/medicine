import type { NextConfig } from "next";

// /api/* is handled by the BFF route handler (src/app/api/[...path]/route.ts),
// which authenticates the session and forwards a signed token to the backend.
const nextConfig: NextConfig = {};

export default nextConfig;
