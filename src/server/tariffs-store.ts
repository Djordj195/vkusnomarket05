import "server-only";

import { getSupabaseAdmin, isSupabaseConfigured, isMissingTableError } from "./supabase";

export type Tariff = {
  id: string;
  name: string;
  feePercent: number;
  description: string;
  minRevenue: number | null;
  isDefault: boolean;
  sortOrder: number;
};

type TariffRow = {
  id: string;
  name: string;
  fee_percent: number;
  description: string;
  min_revenue: number | null;
  is_default: boolean;
  sort_order: number;
};

function rowToTariff(r: TariffRow): Tariff {
  return {
    id: r.id,
    name: r.name,
    feePercent: r.fee_percent,
    description: r.description,
    minRevenue: r.min_revenue,
    isDefault: r.is_default,
    sortOrder: r.sort_order,
  };
}

const STATIC_TARIFFS: Tariff[] = [
  {
    id: "tariff-basic",
    name: "Базовый",
    feePercent: 12,
    description: "Стандартная комиссия маркетплейса",
    minRevenue: null,
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: "tariff-premium",
    name: "Премиум",
    feePercent: 8,
    description: "Для крупных продавцов с оборотом > 1 млн ₽/мес",
    minRevenue: 1_000_000,
    isDefault: false,
    sortOrder: 1,
  },
  {
    id: "tariff-partner",
    name: "Партнёр",
    feePercent: 5,
    description: "Индивидуальные условия для якорных партнёров",
    minRevenue: null,
    isDefault: false,
    sortOrder: 2,
  },
];

export async function listTariffs(): Promise<Tariff[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("tariffs")
      .select("*")
      .order("sort_order");
    if (error) {
      if (isMissingTableError(error)) return [...STATIC_TARIFFS];
      throw new Error(`listTariffs: ${error.message}`);
    }
    return (data as TariffRow[]).map(rowToTariff);
  }
  return [...STATIC_TARIFFS];
}

export async function getTariffById(id: string): Promise<Tariff | undefined> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data, error } = await sb
      .from("tariffs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return STATIC_TARIFFS.find((t) => t.id === id);
      throw new Error(`getTariffById: ${error.message}`);
    }
    return data ? rowToTariff(data as TariffRow) : undefined;
  }
  return STATIC_TARIFFS.find((t) => t.id === id);
}

export async function createTariff(
  input: Omit<Tariff, "id">
): Promise<Tariff> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;
  const id = `tariff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await sb
    .from("tariffs")
    .insert({
      id,
      name: input.name,
      fee_percent: input.feePercent,
      description: input.description,
      min_revenue: input.minRevenue,
      is_default: input.isDefault,
      sort_order: input.sortOrder,
    })
    .select()
    .single();
  if (error) throw new Error(`createTariff: ${error.message}`);
  return rowToTariff(data as TariffRow);
}

export async function updateTariff(
  id: string,
  input: Partial<Omit<Tariff, "id">>
): Promise<Tariff | null> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.feePercent !== undefined) row.fee_percent = input.feePercent;
  if (input.description !== undefined) row.description = input.description;
  if (input.minRevenue !== undefined) row.min_revenue = input.minRevenue;
  if (input.isDefault !== undefined) row.is_default = input.isDefault;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;

  const { data, error } = await sb
    .from("tariffs")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`updateTariff: ${error.message}`);
  return data ? rowToTariff(data as TariffRow) : null;
}

export async function deleteTariff(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("tariffs").delete().eq("id", id);
  if (error) throw new Error(`deleteTariff: ${error.message}`);
  return true;
}
