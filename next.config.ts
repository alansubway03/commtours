import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // 父目錄另有 package-lock.json 時，請在專案根目錄執行 dev/build，並固定 root 為目前工作目錄
    root: path.resolve(process.cwd()),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.commtours.com",
          },
        ],
        destination: "https://commtours.com/:path*",
        permanent: true,
      },
      {
        source: "/favicon.ico",
        destination: "/favicon.png?v=20260505a",
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
      {
        protocol: "https",
        hostname: "dewonder.travel",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
