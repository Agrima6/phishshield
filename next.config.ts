import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Proxies API calls through this app's own origin instead of the browser
  // hitting the Flask backend cross-site directly. The backend's session
  // cookie is what actually authenticates dashboard requests, and browsers
  // increasingly block or restrict cookies set by a different top-level
  // domain (vercel.app vs onrender.com) even with SameSite=None. Routing
  // through this server-side proxy makes every request same-origin from
  // the browser's perspective, so the cookie works normally.
  async rewrites() {
    const backend = process.env.BACKEND_URL;
    if (!backend) return [];
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
