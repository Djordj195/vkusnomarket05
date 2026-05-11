"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  createVendorApplication,
  isSlugAvailable,
  updateVendorFeatured,
  updateVendorStatus,
  type CreateVendorInput,
} from "./vendors-store";
import type { LegalEntityType, Vertical, VendorStatus } from "@/lib/types";

const VALID_VERTICALS: Vertical[] = [
  "food",
  "grocery",
  "pharmacy",
  "chemistry",
];
const VALID_LEGAL: LegalEntityType[] = ["IP", "OOO", "SAMOZ", "NONE"];

function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };
  return input
    .toLowerCase()
    .trim()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function isValidInn(value: string): boolean {
  return /^\d{10}$/.test(value) || /^\d{12}$/.test(value);
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"));
}

export type SubmitApplicationResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function submitVendorApplicationAction(
  formData: FormData
): Promise<SubmitApplicationResult> {
  const brandName = String(formData.get("brandName") ?? "").trim();
  const verticalPrimary = String(formData.get("verticalPrimary") ?? "") as Vertical;
  const verticalsRaw = formData.getAll("verticals").map(String);
  const cityId = String(formData.get("cityId") ?? "");
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const legalEntityType = String(
    formData.get("legalEntityType") ?? ""
  ) as LegalEntityType;
  const legalName = String(formData.get("legalName") ?? "").trim();
  const inn = String(formData.get("inn") ?? "").replace(/\D/g, "");
  const legalAddress = String(formData.get("legalAddress") ?? "").trim();
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactTelegram = String(formData.get("contactTelegram") ?? "").trim();
  const contactWhatsapp = String(formData.get("contactWhatsapp") ?? "").trim();

  if (brandName.length < 2) {
    return { ok: false, error: "Укажите название бренда (минимум 2 символа)." };
  }
  if (!VALID_VERTICALS.includes(verticalPrimary)) {
    return { ok: false, error: "Выберите основную вертикаль." };
  }
  const verticals = Array.from(
    new Set([
      verticalPrimary,
      ...verticalsRaw.filter((v): v is Vertical =>
        VALID_VERTICALS.includes(v as Vertical)
      ),
    ])
  );
  if (!cityId) {
    return { ok: false, error: "Выберите город." };
  }
  if (!VALID_LEGAL.includes(legalEntityType)) {
    return { ok: false, error: "Выберите форму юр.лица." };
  }
  if (legalEntityType !== "NONE" && legalName.length < 2) {
    return { ok: false, error: "Укажите юридическое название." };
  }
  if (legalEntityType !== "NONE" && !isValidInn(inn)) {
    return { ok: false, error: "ИНН должен содержать 10 или 12 цифр." };
  }
  if (verticalPrimary === "pharmacy" && licenseNumber.length < 3) {
    return {
      ok: false,
      error: "Для аптеки нужен номер лицензии Росздравнадзора.",
    };
  }
  if (!isValidPhone(contactPhone)) {
    return { ok: false, error: "Введите корректный телефон (+7...)." };
  }

  const baseSlug = slugify(brandName) || `vendor-${Date.now()}`;
  let slug = baseSlug;
  let attempt = 1;
  while (!(await isSlugAvailable(slug)) && attempt < 50) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const input: CreateVendorInput = {
    id: `vnd-${slug}`,
    slug,
    brandName,
    verticalPrimary,
    verticals,
    cityId,
    shortDescription: shortDescription || undefined,
    description: description || undefined,
    legalEntityType,
    legalName: legalEntityType !== "NONE" ? legalName : undefined,
    inn: legalEntityType !== "NONE" ? inn : undefined,
    legalAddress: legalAddress || undefined,
    licenseNumber: licenseNumber || undefined,
    contactPhone,
    contactEmail: contactEmail || undefined,
    contactTelegram: contactTelegram || undefined,
    contactWhatsapp: contactWhatsapp || undefined,
  };

  try {
    await createVendorApplication(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка.";
    return { ok: false, error: message };
  }

  revalidatePath("/admin/vendors");
  return { ok: true, slug };
}

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Доступ запрещён.");
  }
}

const VALID_STATUSES: VendorStatus[] = [
  "draft",
  "pending",
  "approved",
  "suspended",
  "blocked",
];

export async function updateVendorStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as VendorStatus;
  if (!id || !VALID_STATUSES.includes(status)) return;
  await updateVendorStatus(id, status);
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${id}`);
  revalidatePath("/", "layout");
}

export async function toggleVendorFeaturedAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "true";
  if (!id) return;
  await updateVendorFeatured(id, featured);
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${id}`);
  revalidatePath("/", "layout");
}
