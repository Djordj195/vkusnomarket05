"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  type Banner,
} from "./banners-store";

export type BannerFormInput = {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  cityId: string | null;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

type Result = { ok: true; banner?: Banner } | { ok: false; error: string };

export async function createBannerAction(input: BannerFormInput): Promise<Result> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  if (!input.title.trim()) return { ok: false, error: "Укажите заголовок" };
  try {
    const banner = await createBanner(input);
    revalidatePath("/admin/banners");
    return { ok: true, banner };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function updateBannerAction(id: string, input: BannerFormInput): Promise<Result> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  if (!input.title.trim()) return { ok: false, error: "Укажите заголовок" };
  try {
    const banner = await updateBanner(id, input);
    if (!banner) return { ok: false, error: "Баннер не найден" };
    revalidatePath("/admin/banners");
    return { ok: true, banner };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function deleteBannerAction(id: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  try {
    await deleteBanner(id);
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
