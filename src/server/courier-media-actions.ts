"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCourier } from "./courier-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

const MAX_BYTES_DOC = 16 * 1024 * 1024; // 16 MB — паспорт/мед.книжка могут быть тяжёлыми
const MAX_BYTES_AVATAR = 4 * 1024 * 1024;

const ALLOWED_DOC = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
]);

const ALLOWED_AVATAR = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type CourierMediaSlot =
  | "avatar"
  | "passport"
  | "id_card"
  | "med_book"
  | "driver_license"
  | "self_employed_cert";

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

const VALID_SLOTS: CourierMediaSlot[] = [
  "avatar",
  "passport",
  "id_card",
  "med_book",
  "driver_license",
  "self_employed_cert",
];

function extFor(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "application/pdf": "pdf",
  };
  const fromMime = map[file.type];
  if (fromMime) return fromMime;
  const m = file.name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "bin";
}

function rand(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Загрузка курьерских документов / аватара. Аватар идёт в публичный bucket
 * `media` (его видит клиент при доставке). Остальные документы — приватный
 * `vkusnomarket-docs` с подписанными ссылками.
 */
export async function uploadCourierMediaAction(
  formData: FormData
): Promise<UploadResult> {
  const courier = await getCurrentCourier();
  if (!courier) {
    return { ok: false, error: "Войдите в курьерское приложение." };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "База данных не подключена. Загрузка файла недоступна.",
    };
  }
  const slot = String(formData.get("slot") ?? "") as CourierMediaSlot;
  if (!VALID_SLOTS.includes(slot)) {
    return { ok: false, error: "Неизвестный тип документа." };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Файл не выбран." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "Файл пустой." };
  }

  const maxBytes = slot === "avatar" ? MAX_BYTES_AVATAR : MAX_BYTES_DOC;
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `Файл слишком большой (макс. ${Math.round(maxBytes / 1024 / 1024)} МБ).`,
    };
  }
  const allowed = slot === "avatar" ? ALLOWED_AVATAR : ALLOWED_DOC;
  if (file.type && !allowed.has(file.type)) {
    return {
      ok: false,
      error:
        slot === "avatar"
          ? "Поддерживаются JPEG/PNG/WEBP/AVIF."
          : "Поддерживаются JPEG/PNG/WEBP/PDF.",
    };
  }

  const bucket = slot === "avatar" ? "media" : "vkusnomarket-docs";
  const path =
    slot === "avatar"
      ? `couriers/${courier.id}/avatar/${Date.now()}-${rand()}.${extFor(file)}`
      : `couriers/${courier.id}/${slot}/${Date.now()}-${rand()}.${extFor(file)}`;
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
    revalidatePath("/courier/dashboard/profile");
    return { ok: true, url: data.publicUrl, path };
  }
  const { data, error: signError } = await sb.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signError || !data) {
    return {
      ok: false,
      error: `Не удалось получить ссылку: ${signError?.message ?? "unknown"}`,
    };
  }
  revalidatePath("/courier/dashboard/documents");
  return { ok: true, url: data.signedUrl, path };
}
