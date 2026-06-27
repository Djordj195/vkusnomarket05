import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async redirects() {
    const buyerSegments = [
      "auth", "cart", "catalog", "category", "checkout", "faq", "favorites",
      "feedback", "orders", "product", "profile", "reviews", "search",
      "section", "shops", "shop", "support", "vertical", "weekly",
    ];
    return buyerSegments.map((seg) => ({
      source: `/${seg}/:path*`,
      destination: `/market/${seg}/:path*`,
      permanent: false,
    }));
  },
};

export default nextConfig;
