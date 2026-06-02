"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  createTariff,
  updateTariff,
  deleteTariff,
  type Tariff,
} from "./tariffs-store";

export type TariffFormInput = {
  name: string;
  feePercent: number;
  description: string;
  minRevenue: number | null;
  isDefault: boolean;
  sortOrder: number;
};

type Result = { ok: true; tariff?: Tariff } | { ok: false; error: string };

function validate(input: TariffFormInput): string | null {
  if (!input.name.trim()) return "Укажите название тарифа.";
  if (!Number.isFinite(input.feePercent) || input.feePercent < 0 || input.feePercent > 100)
    return "Комиссия должна быть от 0 до 100%.";
  return null;
}

export async function createTariffAction(input: TariffFormInput): Promise<Result> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const tariff = await createTariff(input);
    revalidatePath("/admin/tariffs");
    return { ok: true, tariff };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка создания" };
  }
}

export async function updateTariffAction(id: string, input: TariffFormInput): Promise<Result> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const tariff = await updateTariff(id, input);
    if (!tariff) return { ok: false, error: "Тариф не найден" };
    revalidatePath("/admin/tariffs");
    return { ok: true, tariff };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка обновления" };
  }
}

export async function deleteTariffAction(id: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  try {
    await deleteTariff(id);
    revalidatePath("/admin/tariffs");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка удаления" };
  }
}
