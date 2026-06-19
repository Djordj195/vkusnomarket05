import "server-only";

import { createHash } from "crypto";
import { getSupabaseAdmin } from "./supabase";
import type { MappedProduct } from "./catalog-sync-mapper";

export type UpsertResult = {
  created: number;
  updated: number;
  skipped: number;
};

function computeHash(product: MappedProduct): string {
  const payload = JSON.stringify(product);
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export async function upsertProducts(
  vendorId: string,
  sourceId: string,
  products: MappedProduct[],
  options: { autoActivate?: boolean; deactivateMissing?: boolean } = {}
): Promise<UpsertResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { created: 0, updated: 0, skipped: 0 };

  const result: UpsertResult = { created: 0, updated: 0, skipped: 0 };
  const processedSkus = new Set<string>();
  const BATCH_SIZE = 50;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    for (const product of batch) {
      if (!product.external_sku) continue;
      processedSkus.add(product.external_sku);

      const hash = computeHash(product);

      // Check existing
      const { data: existing } = await sb
        .from("products")
        .select("id, sync_hash")
        .eq("vendor_id", vendorId)
        .eq("external_sku", product.external_sku)
        .limit(1)
        .single();

      if (existing && existing.sync_hash === hash) {
        result.skipped++;
        continue;
      }

      const row = buildProductRow(vendorId, sourceId, product, hash);

      if (existing) {
        await sb
          .from("products")
          .update(row)
          .eq("id", existing.id);
        result.updated++;
      } else {
        await sb
          .from("products")
          .insert({ ...row, slug: generateSlug(product.name, product.external_sku) });
        result.created++;
      }
    }
  }

  // Deactivate missing products (only for full sync)
  if (options.deactivateMissing && processedSkus.size > 0) {
    const { data: allProducts } = await sb
      .from("products")
      .select("id, external_sku")
      .eq("vendor_id", vendorId)
      .eq("external_source_id", sourceId)
      .not("external_sku", "is", null);

    if (allProducts) {
      const toDeactivate = allProducts.filter((p) => !processedSkus.has(p.external_sku));
      for (const p of toDeactivate) {
        await sb.from("products").update({ in_stock: false }).eq("id", p.id);
      }
    }
  }

  return result;
}

function buildProductRow(vendorId: string, sourceId: string, product: MappedProduct, hash: string): Record<string, unknown> {
  const row: Record<string, unknown> = {
    vendor_id: vendorId,
    external_source_id: sourceId,
    external_sku: product.external_sku,
    sync_hash: hash,
    last_synced_at: new Date().toISOString(),
    external_payload: product,
    name: product.name,
  };

  if (product.description) row.description = product.description;
  if (product.price != null) row.price = product.price;
  if (product.old_price != null) row.old_price = product.old_price;
  if (product.is_available != null) row.in_stock = product.is_available;
  if (product.weight_value != null) row.weight = `${product.weight_value}${product.weight_unit || "г"}`;
  if (product.image_urls?.[0]) row.image = product.image_urls[0];

  return row;
}

function generateSlug(name: string, sku: string): string {
  const ts = Date.now();
  const base = (name || sku)
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base}-${ts}-${Math.random().toString(36).slice(2, 6)}`;
}
