import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/admin/:path*",
        destination: "/404",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imdoro.com",
        pathname: "/assets/doro-spin.gif",
      },
    ],
  },
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
};

export default nextConfig;
