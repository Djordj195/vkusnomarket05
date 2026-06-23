import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "ВМ Админ", template: "%s · ВМ Админ" },
  manifest: "/api/manifest/admin",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-admin-apple.png",
  },
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "ВМ Админ",
    statusBarStyle: "black-translucent",
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
