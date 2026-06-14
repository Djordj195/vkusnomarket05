"use server";

import { revalidatePath } from "next/cache";
import { getCurrentVendor } from "./vendor-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { updateVendorStorefront } from "./vendors-store";

/**
 * Allowed image MIME types for vendor uploads (logo / banner / gallery / docs).
 * Aligned with what next/image can render and Supabase Storage accepts.
 */
const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES_LOGO = 4 * 1024 * 1024; // 4 MB — логотип маленький
const MAX_BYTES_BANNER = 8 * 1024 * 1024; // 8 MB — баннер крупнее
const MAX_BYTES_GALLERY = 8 * 1024 * 1024;
const MAX_BYTES_DOC = 16 * 1024 * 1024; // 16 MB — допускаем PDF лицензий

const ALLOWED_DOC = new Set<string>([
  ...ALLOWED_IMAGE,
  "application/pdf",
]);

export type VendorMediaSlot = "logo" | "banner" | "gallery" | "document";

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

function extFor(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
    "application/pdf": "pdf",
  };
  const fromMime = map[file.type];
  if (fromMime) return fromMime;
  const m = file.name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "jpg";
}

function rand(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Uploads a file from the vendor dashboard to Supabase Storage. The file is
 * validated server-side (mime + size) and placed under
 * `media/vendors/<vendor_id>/<slot>/...` so the file is namespaced by tenant.
 *
 * Returns the public URL — the caller is expected to persist it on the
 * vendor record (logo_url / banner_url) via a separate action.
 */
export async function uploadVendorMediaAction(
  formData: FormData
): Promise<UploadResult> {
  const vendor = await getCurrentVendor();
  if (!vendor) {
    return { ok: false, error: "Войдите в кабинет продавца." };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "База данных не подключена. Загрузка фото недоступна.",
    };
  }
  const slot = String(formData.get("slot") ?? "") as VendorMediaSlot;
  if (
    slot !== "logo" &&
    slot !== "banner" &&
    slot !== "gallery" &&
    slot !== "document"
  ) {
    return { ok: false, error: "Неизвестный тип файла." };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Файл не выбран." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "Файл пустой." };
  }

  const maxBytes = (() => {
    switch (slot) {
      case "logo":
        return MAX_BYTES_LOGO;
      case "banner":
        return MAX_BYTES_BANNER;
      case "gallery":
        return MAX_BYTES_GALLERY;
      case "document":
        return MAX_BYTES_DOC;
    }
  })();
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `Файл слишком большой (макс. ${Math.round(maxBytes / 1024 / 1024)} МБ).`,
    };
  }

  const allowed = slot === "document" ? ALLOWED_DOC : ALLOWED_IMAGE;
  if (file.type && !allowed.has(file.type)) {
    return {
      ok: false,
      error:
        slot === "document"
          ? "Поддерживаются JPEG/PNG/WEBP/PDF."
          : "Поддерживаются JPEG/PNG/WEBP/GIF/AVIF.",
    };
  }

  const bucket = slot === "document" ? "vkusnomarket-docs" : "media";
  const path = `vendors/${vendor.id}/${slot}/${Date.now()}-${rand()}.${extFor(file)}`;
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
      return {
        ok: false,
        error:
          "Хранилище не настроено. Запустите миграции 0003 и 0007 в Supabase.",
      };
    }
    return { ok: false, error: `Ошибка загрузки: ${error.message}` };
  }

  if (bucket === "media") {
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return { ok: true, url: data.publicUrl, path };
  }
  // Private bucket — выдаём подписанную ссылку на 7 дней.
  const { data, error: signError } = await sb.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signError || !data) {
    return {
      ok: false,
      error: `Не удалось получить ссылку: ${signError?.message ?? "unknown"}`,
    };
  }
  return { ok: true, url: data.signedUrl, path };
}

export type UpdateStorefrontResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persists вендорскую витрину: лого/баннер/название/описания. Только сам
 * продавец может редактировать свою запись (по куки-сессии).
 */
export async function updateVendorStorefrontAction(
  formData: FormData
): Promise<UpdateStorefrontResult> {
  const vendor = await getCurrentVendor();
  if (!vendor) {
    return { ok: false, error: "Войдите в кабинет продавца." };
  }

  const logoRaw = formData.get("logoUrl");
  const bannerRaw = formData.get("bannerUrl");
  const brandName = String(formData.get("brandName") ?? "").trim();
  const shortDescription = String(
    formData.get("shortDescription") ?? ""
  ).trim();
  const description = String(formData.get("description") ?? "").trim();

  if (brandName && brandName.length < 2) {
    return { ok: false, error: "Название бренда слишком короткое." };
  }
  if (shortDescription.length > 160) {
    return {
      ok: false,
      error: "Короткое описание не должно превышать 160 символов.",
    };
  }
  if (description.length > 4000) {
    return {
      ok: false,
      error: "Полное описание не должно превышать 4000 символов.",
    };
  }

  try {
    await updateVendorStorefront(vendor.id, {
      logoUrl: typeof logoRaw === "string" ? logoRaw || null : undefined,
      bannerUrl: typeof bannerRaw === "string" ? bannerRaw || null : undefined,
      brandName: brandName || undefined,
      shortDescription: shortDescription || null,
      description: description || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка.";
    return { ok: false, error: message };
  }

  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/dashboard/storefront");
  revalidatePath(`/vendor/${vendor.slug}`);
  return { ok: true };
}
