"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  addCourier as addCourierInStore,
  removeCourier as removeCourierInStore,
  updateCourier as updateCourierInStore,
} from "./couriers-store";

export async function addCourierAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Доступ запрещён" };
  }
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!name || !phone) {
    return { ok: false, error: "Заполните имя и телефон" };
  }
  await addCourierInStore({ name, phone, isActive: true });
  revalidatePath("/admin/couriers");
  return { ok: true };
}

export async function toggleCourierAction(
  id: string,
  isActive: boolean
): Promise<{ ok: boolean }> {
  if (!(await isAdminAuthenticated())) return { ok: false };
  await updateCourierInStore(id, { isActive });
  revalidatePath("/admin/couriers");
  return { ok: true };
}

export async function removeCourierAction(
  id: string
): Promise<{ ok: boolean }> {
  if (!(await isAdminAuthenticated())) return { ok: false };
  await removeCourierInStore(id);
  revalidatePath("/admin/couriers");
  return { ok: true };
}
