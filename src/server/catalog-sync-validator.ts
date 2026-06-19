import "server-only";

import type { MappedProduct } from "./catalog-sync-mapper";

export type ValidationError = {
  row_number: number;
  sku: string | null;
  field_name: string | null;
  error_code: string;
  error_message: string;
  raw_value: string | null;
};

export type ValidationResult = {
  valid: MappedProduct[];
  errors: ValidationError[];
};

export function validateProducts(products: MappedProduct[], startRow = 1): ValidationResult {
  const valid: MappedProduct[] = [];
  const errors: ValidationError[] = [];
  const seenSkus = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const rowNum = startRow + i;
    const rowErrors: ValidationError[] = [];

    if (!p.external_sku || p.external_sku.trim().length === 0) {
      rowErrors.push({
        row_number: rowNum,
        sku: null,
        field_name: "external_sku",
        error_code: "MISSING_SKU",
        error_message: "Не указан артикул товара",
        raw_value: null,
      });
    }

    if (!p.name || p.name.trim().length === 0) {
      rowErrors.push({
        row_number: rowNum,
        sku: p.external_sku || null,
        field_name: "name",
        error_code: "MISSING_NAME",
        error_message: "Не указано название товара",
        raw_value: null,
      });
    }

    if (p.price != null && p.price < 0) {
      rowErrors.push({
        row_number: rowNum,
        sku: p.external_sku || null,
        field_name: "price",
        error_code: "NEGATIVE_PRICE",
        error_message: "Цена не может быть отрицательной",
        raw_value: String(p.price),
      });
    }

    if (p.stock_quantity != null && p.stock_quantity < 0) {
      rowErrors.push({
        row_number: rowNum,
        sku: p.external_sku || null,
        field_name: "stock_quantity",
        error_code: "NEGATIVE_STOCK",
        error_message: "Остаток не может быть отрицательным",
        raw_value: String(p.stock_quantity),
      });
    }

    if (p.external_sku && seenSkus.has(p.external_sku)) {
      rowErrors.push({
        row_number: rowNum,
        sku: p.external_sku,
        field_name: "external_sku",
        error_code: "DUPLICATE_SKU",
        error_message: "Дублирующийся артикул в файле",
        raw_value: p.external_sku,
      });
    }

    if (p.image_urls) {
      for (const url of p.image_urls) {
        if (url && !url.startsWith("http")) {
          rowErrors.push({
            row_number: rowNum,
            sku: p.external_sku || null,
            field_name: "image_urls",
            error_code: "INVALID_IMAGE_URL",
            error_message: "Некорректный URL изображения",
            raw_value: url,
          });
          break;
        }
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      if (p.external_sku) seenSkus.add(p.external_sku);
      valid.push(p);
    }
  }

  return { valid, errors };
}
