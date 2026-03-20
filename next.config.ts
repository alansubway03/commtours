import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/logo.png",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.wwpkg.com.hk",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.wingon-travel.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.egltours.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.goldjoy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.jetour.com.hk",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
