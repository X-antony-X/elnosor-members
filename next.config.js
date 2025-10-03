const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  sw: "custom-sw.js", // Use custom service worker
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com/,
      handler: "StaleWhileRevalidate", // Changed to allow offline access
      options: {
        cacheName: "firestore-cache",
        expiration: {
          maxEntries: 100, // Increased entries
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year for offline access
        },
      },
    },
    {
      urlPattern: /^https:\/\/firebase\.googleapis\.com/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "firebase-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    // Cache profile and member data for offline access
    {
      urlPattern: /\/api\/member|\/api\/members/,
      handler: "NetworkFirst",
      options: {
        cacheName: "member-data-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        networkTimeoutSeconds: 10, // Fallback to cache after 10 seconds
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["firebasestorage.googleapis.com", "lh3.googleusercontent.com"],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
