import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "ВМ Курьер", template: "%s · ВМ Курьер" },
  manifest: "/api/manifest/courier",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-courier-apple.png",
  },
  appleWebApp: {
    capable: true,
    title: "ВМ Курьер",
    statusBarStyle: "black-translucent",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
};

export default function CourierRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
