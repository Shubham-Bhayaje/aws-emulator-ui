import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1", "localhost", "127.0.0.1:3000", "localhost:3000"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/pca",
        destination: "/acm/pca",
        permanent: false,
      },
      {
        source: "/pca/:path*",
        destination: "/acm/pca/:path*",
        permanent: false,
      },
      {
        source: "/acm-pca",
        destination: "/acm/pca",
        permanent: false,
      },
      {
        source: "/acm-pca/:path*",
        destination: "/acm/pca/:path*",
        permanent: false,
      },
      {
        source: "/private-ca",
        destination: "/acm/pca",
        permanent: false,
      },
      {
        source: "/private-ca/:path*",
        destination: "/acm/pca/:path*",
        permanent: false,
      },
      {
        source: "/systems%20manager/session%20manager",
        destination: "/systems-manager/session-manager",
        permanent: false,
      },
      {
        source: "/systems%20manager/parameter%20store",
        destination: "/systems-manager/parameter-store",
        permanent: false,
      },
      {
        source: "/systems%20manager/:path*",
        destination: "/systems-manager/:path*",
        permanent: false,
      },
      {
        source: "/systems%20manager",
        destination: "/systems-manager",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
