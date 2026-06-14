import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // XSS protection (legacy browsers)
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer policy — don't leak full URL to external sites
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Prevent browser from sniffing MIME types
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // Permissions policy — restrict dangerous browser APIs
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)"
  );

  // Strict Transport Security (HTTPS only in production)
  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon-.*\\.png$|apple-touch-icon\\.png$|sw\\.js$|favicon\\.ico$).*)",
  ],
};
