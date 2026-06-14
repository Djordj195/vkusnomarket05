"use server";

import { isAdminAuthenticated } from "./admin-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Ensures the 'media' storage bucket exists and is properly configured.
 * Creates it if missing. Updates MIME types if the bucket has outdated config.
 */
async function ensureMediaBucket(
  sb: ReturnType<typeof getSupabaseAdmin> & object
): Promise<string | null> {
  const { data } = await sb.storage.getBucket("media");
  if (data) {
    // Update bucket to ensure all MIME types are allowed
    await sb.storage.updateBucket("media", {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: Array.from(ALLOWED),
    });
    return null;
  }

  const { error } = await sb.storage.createBucket("media", {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED),
  });
  if (error && !/already.*exist/i.test(error.message)) {
    return error.message;
  }
  return null;
}

export async function uploadMediaAction(
  formData: FormData,
  folder: "products" | "categories" | "shops" = "products"
): Promise<UploadResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "База данных не подключена. Загрузка фото недоступна.",
    };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Файл не выбран." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "Файл пустой." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `Файл слишком большой (макс. ${Math.round(MAX_BYTES / 1024 / 1024)} МБ).`,
    };
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return {
      ok: false,
      error: "Поддерживаются JPEG/PNG/WEBP/GIF/AVIF/HEIC.",
    };
  }

  const ext = (() => {
    if (file.type === "image/jpeg") return "jpg";
    if (file.type === "image/png") return "png";
    if (file.type === "image/webp") return "webp";
    if (file.type === "image/gif") return "gif";
    if (file.type === "image/avif") return "avif";
    if (file.type === "image/heic") return "heic";
    if (file.type === "image/heif") return "heif";
    const m = file.name.match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1].toLowerCase() : "jpg";
  })();

  const sb = getSupabaseAdmin()!;

  // Auto-create bucket if needed
  const bucketErr = await ensureMediaBucket(sb);
  if (bucketErr) {
    return { ok: false, error: `Ошибка хранилища: ${bucketErr}` };
  }

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await sb.storage
    .from("media")
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[media-upload] error:", error.message);
    return { ok: false, error: `Ошибка загрузки: ${error.message}` };
  }

  const { data } = sb.storage.from("media").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
