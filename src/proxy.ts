import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The legacy admin login URL was /admin/login. It is no longer used — the
// real entrypoint is at a separate path that only the owner knows. Anyone
// hitting /admin/login (or any sub-path of it) gets a 404 so the admin
// surface is invisible to clients.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/login", "/admin/login/:path*"],
};
