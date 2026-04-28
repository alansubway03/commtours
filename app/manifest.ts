import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CommTours",
    short_name: "CommTours",
    description: "香港出發長線及特色團體行程比價平台",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#ffb35c",
    icons: [
      {
        src: "/logo-brand.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-brand.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
