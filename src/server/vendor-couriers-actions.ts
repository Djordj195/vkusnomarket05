"use server";

import { revalidatePath } from "next/cache";
import { getCurrentVendor } from "./vendor-auth";
import {
  addCourier,
  updateCourier,
  removeCourier,
  listCouriers,
  getCourierById,
} from "./couriers-store";
import type { Courier } from "@/lib/types";

type Result =
  | { ok: true; courier?: Courier }
  | { ok: false; error: string };

export async function vendorListCouriersAction(): Promise<Courier[]> {
  const vendor = await getCurrentVendor();
  if (!vendor) return [];
  const all = await listCouriers();
  return all.filter((c) => c.shopId === vendor.id);
}

export async function vendorAddCourierAction(
  name: string,
  phone: string
): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  if (!name.trim()) return { ok: false, error: "Укажите имя курьера." };
  if (!phone.trim()) return { ok: false, error: "Укажите телефон курьера." };

  try {
    const courier = await addCourier({
      name: name.trim(),
      phone: phone.trim(),
      isActive: true,
      courierType: "shop",
      shopId: vendor.id,
    });
    revalidatePath("/vendor/dashboard/couriers");
    return { ok: true, courier };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось добавить курьера",
    };
  }
}

export async function vendorUpdateCourierAction(
  id: string,
  name: string,
  phone: string
): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  const existing = await getCourierById(id);
  if (!existing || existing.shopId !== vendor.id) {
    return { ok: false, error: "Курьер не найден или не принадлежит вам." };
  }

  if (!name.trim()) return { ok: false, error: "Укажите имя курьера." };
  if (!phone.trim()) return { ok: false, error: "Укажите телефон курьера." };

  try {
    const courier = await updateCourier(id, {
      name: name.trim(),
      phone: phone.trim(),
    });
    if (!courier) return { ok: false, error: "Курьер не найден" };
    revalidatePath("/vendor/dashboard/couriers");
    return { ok: true, courier };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось обновить данные",
    };
  }
}

export async function vendorToggleCourierAction(
  id: string,
  isActive: boolean
): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  const existing = await getCourierById(id);
  if (!existing || existing.shopId !== vendor.id) {
    return { ok: false, error: "Курьер не найден или не принадлежит вам." };
  }

  try {
    const courier = await updateCourier(id, { isActive });
    if (!courier) return { ok: false, error: "Курьер не найден" };
    revalidatePath("/vendor/dashboard/couriers");
    return { ok: true, courier };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Ошибка обновления",
    };
  }
}

export async function vendorRemoveCourierAction(id: string): Promise<Result> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Войдите в кабинет продавца." };

  const existing = await getCourierById(id);
  if (!existing || existing.shopId !== vendor.id) {
    return { ok: false, error: "Курьер не найден или не принадлежит вам." };
  }

  try {
    const ok = await removeCourier(id);
    if (!ok) return { ok: false, error: "Курьер не найден" };
    revalidatePath("/vendor/dashboard/couriers");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось удалить курьера",
    };
  }
}
