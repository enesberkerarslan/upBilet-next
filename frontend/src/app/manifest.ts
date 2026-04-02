import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UpBilet — Etkinlik biletleri",
    short_name: "UpBilet",
    description:
      "Futbol, konser, tiyatro ve daha fazlası için güvenli etkinlik bileti. Güncel etkinlikler ve kolay alışveriş.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F4F4F5",
    theme_color: "#18181B",
    lang: "tr",
    categories: ["entertainment", "shopping"],
    icons: [
      {
        src: "/img/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
