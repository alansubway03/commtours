import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CommTours",
    short_name: "CommTours",
    description: "香港出發長線及特色團體行程比價平台",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f2f2",
    theme_color: "#1a2b50",
    icons: [
      {
        src: "/icon-commtours-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-commtours-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
