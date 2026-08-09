import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "newex — 매일 새로운 경험",
    short_name: "newex",
    description: "하루에 하나씩, 새로운 경험을 기록하세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#1a1f36",
    orientation: "portrait",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
