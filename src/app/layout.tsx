import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Доставка свежих продуктов с рынка, товаров из лавок и готовой еды по г. Кизляр и району. Минимальный заказ 500 ₽.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Доставка свежих продуктов, товаров из лавок и готовой еды по г. Кизляр и району.",
    locale: "ru_RU",
    siteName: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-ink-50 min-h-full">
        <div className="mx-auto max-w-md min-h-screen bg-white shadow-[0_0_60px_rgba(15,23,42,0.05)]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
