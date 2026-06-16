import type { MetadataRoute } from "next";
import { buildManifest } from "@/lib/manifests";

export default function manifest(): MetadataRoute.Manifest {
  const base = buildManifest("client");
  return {
    ...base,
    screenshots: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow",
        label: "Главная страница ВкусМаркет",
      },
    ],
  };
}
