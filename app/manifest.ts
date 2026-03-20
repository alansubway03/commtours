import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CommTours",
    short_name: "CommTours",
    description: "香港出發長線及特色團體行程比價平台",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#545b6a",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
