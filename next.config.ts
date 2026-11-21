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
        source: "/certificatemanager",
        destination: "/acm",
        permanent: false,
      },
      {
        source: "/certificatemanager/:path*",
        destination: "/acm/:path*",
        permanent: false,
      },
      {
        source: "/certificate-manager",
        destination: "/acm",
        permanent: false,
      },
      {
        source: "/certificate-manager/:path*",
        destination: "/acm/:path*",
        permanent: false,
      },
      {
        source: "/certificate_manager",
        destination: "/acm",
        permanent: false,
      },
      {
        source: "/certificate_manager/:path*",
        destination: "/acm/:path*",
        permanent: false,
      },
      {
        source: "/acm/home",
        destination: "/acm",
        permanent: false,
      },
      {
        source: "/acm/home/:path*",
        destination: "/acm/:path*",
        permanent: false,
      },
      {
        source: "/directory-services",
        destination: "/directoryservice",
        permanent: false,
      },
      {
        source: "/directory-services/:path*",
        destination: "/directoryservice/:path*",
        permanent: false,
      },
      {
        source: "/cloudhsm/clusters",
        destination: "/cloudhsm",
        permanent: false,
      },
      {
        source: "/cloudhsm/clusters/create",
        destination: "/cloudhsm/create",
        permanent: false,
      },
      {
        source: "/cloudhsm/home",
        destination: "/cloudhsm",
        permanent: false,
      },
      {
        source: "/cloudhsm/home/:path*",
        destination: "/cloudhsm/:path*",
        permanent: false,
      },
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
        source: "/directoryservice/directories",
        destination: "/directoryservice",
        permanent: false,
      },
      {
        source: "/directoryservice/directories/new",
        destination: "/directoryservice/setup",
        permanent: false,
      },
      {
        source: "/directoryservice/create",
        destination: "/directoryservice/setup",
        permanent: false,
      },
      {
        source: "/directory-service",
        destination: "/directoryservice",
        permanent: false,
      },
      {
        source: "/directory-service/:path*",
        destination: "/directoryservice/:path*",
        permanent: false,
      },
      {
        source: "/ds",
        destination: "/directoryservice",
        permanent: false,
      },
      {
        source: "/ds/:path*",
        destination: "/directoryservice/:path*",
        permanent: false,
      },
      {
        source: "/systems-manager/session%20manager",
        destination: "/systems-manager/session-manager",
        permanent: false,
      },
      {
        source: "/systems-manager/parameter%20store",
        destination: "/systems-manager/parameter-store",
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
      {
        source: "/s3-glacier",
        destination: "/glacier",
        permanent: false,
      },
      {
        source: "/s3-glacier/:path*",
        destination: "/glacier/:path*",
        permanent: false,
      },
      {
        source: "/s3glacier",
        destination: "/glacier",
        permanent: false,
      },
      {
        source: "/s3glacier/:path*",
        destination: "/glacier/:path*",
        permanent: false,
      },
      {
        source: "/s3_glacier",
        destination: "/glacier",
        permanent: false,
      },
      {
        source: "/s3_glacier/:path*",
        destination: "/glacier/:path*",
        permanent: false,
      },
      {
        source: "/glacier/vaults",
        destination: "/glacier",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
