import { NextRequest, NextResponse } from "next/server";
import { getCurrentVendor } from "@/server/vendor-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/server/supabase";

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function extFor(type: string, name: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  const fromMime = map[type];
  if (fromMime) return fromMime;
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "jpg";
}

function rand(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(req: NextRequest) {
  try {
    const vendor = await getCurrentVendor();
    if (!vendor) {
      return NextResponse.json(
        { ok: false, error: "Войдите в кабинет продавца." },
        { status: 401 }
      );
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Хранилище не настроено." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Файл не выбран." },
        { status: 400 }
      );
    }
    if (file.size <= 0) {
      return NextResponse.json(
        { ok: false, error: "Файл пустой." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: `Файл слишком большой (макс. 8 МБ).` },
        { status: 400 }
      );
    }
    if (file.type && !ALLOWED_IMAGE.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Поддерживаются JPEG/PNG/WEBP/GIF." },
        { status: 400 }
      );
    }

    const bucket = "media";
    const path = `vendors/${vendor.id}/gallery/${Date.now()}-${rand()}.${extFor(file.type, file.name)}`;
    const sb = getSupabaseAdmin()!;
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await sb.storage
      .from(bucket)
      .upload(path, new Uint8Array(arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      if (/bucket.*not.*found/i.test(error.message)) {
        return NextResponse.json(
          { ok: false, error: "Хранилище не настроено (bucket не найден)." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { ok: false, error: `Ошибка загрузки: ${error.message}` },
        { status: 500 }
      );
    }

    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data.publicUrl, path });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Ошибка загрузки файла.",
      },
      { status: 500 }
    );
  }
}
