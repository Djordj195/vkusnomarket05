import { NextResponse } from "next/server";
import { buildManifest, type AppRole } from "@/lib/manifests";

const VALID_ROLES = new Set<AppRole>(["client", "vendor", "courier", "admin"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  const { role } = await params;
  if (!VALID_ROLES.has(role as AppRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 404 });
  }
  const manifest = buildManifest(role as AppRole);
  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
