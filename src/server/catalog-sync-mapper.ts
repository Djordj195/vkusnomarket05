import "server-only";

import type { FieldMapping } from "./catalog-sync-store";
import type { ParsedRow } from "./catalog-sync-parser";

export type MappedProduct = {
  external_sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  price?: number;
  old_price?: number;
  discount_percent?: number;
  stock_quantity?: number;
  is_available?: boolean;
  weight_value?: number;
  weight_unit?: string;
  volume_value?: number;
  volume_unit?: string;
  image_urls?: string[];
  country_of_origin?: string;
  composition?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  storage_conditions?: string;
  shelf_life?: string;
  is_age_restricted?: boolean;
};

// Auto-mapping rules: common column names → target fields
const AUTO_MAP: Record<string, string> = {
  sku: "external_sku",
  article: "external_sku",
  артикул: "external_sku",
  vendor_code: "external_sku",
  код_товара: "external_sku",
  external_sku: "external_sku",
  title: "name",
  name: "name",
  product_name: "name",
  наименование: "name",
  название: "name",
  description: "description",
  описание: "description",
  category: "category",
  категория: "category",
  brand: "brand",
  бренд: "brand",
  barcode: "barcode",
  штрихкод: "barcode",
  price: "price",
  цена: "price",
  retail_price: "price",
  old_price: "old_price",
  старая_цена: "old_price",
  compare_at_price: "old_price",
  discount_percent: "discount_percent",
  скидка: "discount_percent",
  stock: "stock_quantity",
  qty: "stock_quantity",
  quantity: "stock_quantity",
  остаток: "stock_quantity",
  is_available: "is_available",
  в_наличии: "is_available",
  image: "image_urls",
  image_url: "image_urls",
  images: "image_urls",
  изображение: "image_urls",
  фото: "image_urls",
  weight: "weight_value",
  вес: "weight_value",
  weight_unit: "weight_unit",
  volume: "volume_value",
  объём: "volume_value",
  volume_unit: "volume_unit",
  country: "country_of_origin",
  страна: "country_of_origin",
  composition: "composition",
  состав: "composition",
  calories: "calories",
  калории: "calories",
  protein: "protein",
  белки: "protein",
  fat: "fat",
  жиры: "fat",
  carbs: "carbs",
  углеводы: "carbs",
  storage_conditions: "storage_conditions",
  хранение: "storage_conditions",
  shelf_life: "shelf_life",
  срок_годности: "shelf_life",
  is_age_restricted: "is_age_restricted",
};

export function autoDetectMappings(columns: string[]): Array<{ source_field: string; target_field: string }> {
  const result: Array<{ source_field: string; target_field: string }> = [];
  const usedTargets = new Set<string>();

  for (const col of columns) {
    const normalized = col.toLowerCase().replace(/[\s-]/g, "_");
    const target = AUTO_MAP[normalized];
    if (target && !usedTargets.has(target)) {
      result.push({ source_field: col, target_field: target });
      usedTargets.add(target);
    }
  }
  return result;
}

export function applyMappings(rows: ParsedRow[], mappings: FieldMapping[] | Array<{ source_field: string; target_field: string }>): MappedProduct[] {
  return rows.map((row) => {
    const product: Record<string, unknown> = {};
    for (const m of mappings) {
      const rawVal = row[m.source_field] ?? "";
      if (!rawVal) continue;
      const target = "target_field" in m ? m.target_field : "";
      product[target] = castValue(target, rawVal);
    }
    return product as unknown as MappedProduct;
  });
}

function castValue(field: string, raw: string): unknown {
  const numericFields = ["price", "old_price", "discount_percent", "stock_quantity", "weight_value", "volume_value", "calories", "protein", "fat", "carbs"];
  const boolFields = ["is_available", "is_age_restricted"];

  if (numericFields.includes(field)) {
    const cleaned = raw.replace(/\s/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  if (boolFields.includes(field)) {
    const lower = raw.toLowerCase();
    return lower === "true" || lower === "1" || lower === "да" || lower === "yes";
  }

  if (field === "image_urls") {
    if (raw.includes(",")) return raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (raw.includes(";")) return raw.split(";").map((s) => s.trim()).filter(Boolean);
    return [raw.trim()];
  }

  return raw;
}
