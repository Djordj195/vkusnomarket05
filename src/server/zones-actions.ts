"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import { logAudit } from "./audit-store";
import {
  deleteZone as deleteZoneInStore,
  getZone,
  saveZone as saveZoneInStore,
} from "./zones-store";
import type { DeliveryZonePoint } from "@/lib/types";

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Доступ запрещён");
  }
}

export type SaveZoneResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function parsePolygon(raw: unknown): DeliveryZonePoint[] | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const pts: DeliveryZonePoint[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as { lat?: unknown }).lat === "number" &&
        typeof (item as { lng?: unknown }).lng === "number"
      ) {
        pts.push({
          lat: (item as { lat: number }).lat,
          lng: (item as { lng: number }).lng,
        });
      }
    }
    return pts;
  } catch {
    return null;
  }
}

function intOrDefault(value: FormDataEntryValue | null, fallback: number): number {
  const n = Number(String(value ?? "").replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export async function saveZoneAction(
  formData: FormData
): Promise<SaveZoneResult> {
  await requireAdmin();
  const idRaw = String(formData.get("id") ?? "").trim();
  const id = idRaw.length > 0 ? idRaw : undefined;
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || "Зона доставки";
  const polygon = parsePolygon(formData.get("polygon"));

  if (!vendorId) return { ok: false, error: "Выберите продавца." };
  if (!polygon || polygon.length < 3) {
    return { ok: false, error: "Полигон должен содержать минимум 3 точки." };
  }

  const minOrder = Math.max(0, intOrDefault(formData.get("minOrder"), 0));
  const deliveryFee = Math.max(0, intOrDefault(formData.get("deliveryFee"), 0));
  const freeFromRaw = String(formData.get("freeFrom") ?? "").trim();
  const freeFrom = freeFromRaw.length === 0 ? null : Math.max(0, intOrDefault(freeFromRaw, 0));
  const etaMin = Math.max(1, intOrDefault(formData.get("etaMin"), 30));
  const etaMax = Math.max(etaMin, intOrDefault(formData.get("etaMax"), 60));
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  try {
    const saved = await saveZoneInStore({
      id,
      vendorId,
      name,
      polygon,
      minOrder,
      deliveryFee,
      freeFrom,
      etaMin,
      etaMax,
      isActive,
    });
    await logAudit({
      actorType: "admin",
      action: id ? "zone.update" : "zone.create",
      targetType: "delivery_zone",
      targetId: saved.id,
      payload: {
        vendorId,
        name,
        points: polygon.length,
        minOrder,
        deliveryFee,
        freeFrom,
        etaMin,
        etaMax,
        isActive,
      },
    });
    revalidatePath("/admin/zones");
    revalidatePath(`/admin/zones/${saved.id}`);
    return { ok: true, id: saved.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось сохранить зону.",
    };
  }
}

export async function deleteZoneAction(
  formData: FormData
): Promise<SaveZoneResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Не указан id зоны." };
  const existing = await getZone(id);
  if (!existing) return { ok: false, error: "Зона не найдена." };
  try {
    await deleteZoneInStore(id);
    await logAudit({
      actorType: "admin",
      action: "zone.delete",
      targetType: "delivery_zone",
      targetId: id,
      payload: { vendorId: existing.vendorId, name: existing.name },
    });
    revalidatePath("/admin/zones");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Не удалось удалить зону.",
    };
  }
}
