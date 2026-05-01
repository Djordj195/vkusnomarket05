import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ВКУСНОМАРКЕТ — доставка по Кизляру",
    short_name: "ВКУСНОМАРКЕТ",
    description:
      "Доставка свежих продуктов с рынка, товаров из лавок и готовой еды по г. Кизляр и району.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    lang: "ru",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
