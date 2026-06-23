import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "ВМ Продавец", template: "%s · ВМ Продавец" },
  manifest: "/api/manifest/vendor",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-vendor-apple.png",
  },
  appleWebApp: {
    capable: true,
    title: "ВМ Продавец",
    statusBarStyle: "black-translucent",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function VendorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
