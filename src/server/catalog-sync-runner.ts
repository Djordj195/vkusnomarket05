import "server-only";

import { fetchFromSource } from "./catalog-sync-connector";
import { parseContent } from "./catalog-sync-parser";
import { autoDetectMappings, applyMappings } from "./catalog-sync-mapper";
import { validateProducts } from "./catalog-sync-validator";
import { upsertProducts } from "./catalog-sync-upsert";
import {
  getSource,
  getMappings,
  updateJob,
  insertErrors,
  markSourceSuccess,
  markSourceError,
  type SyncJob,
  type CatalogSource,
} from "./catalog-sync-store";

export type DryRunResult = {
  ok: boolean;
  rows_total: number;
  rows_valid: number;
  rows_failed: number;
  preview: Array<Record<string, unknown>>;
  errors: Array<{ row_number: number; error_message: string; field_name?: string | null }>;
  columns: string[];
  detected_mappings: Array<{ source_field: string; target_field: string }>;
  error?: string;
};

export async function runSync(job: SyncJob): Promise<void> {
  const source = await getSource(job.source_id, job.vendor_id);
  if (!source) {
    await updateJob(job.id, { status: "failed", error_summary: "Источник не найден", finished_at: new Date().toISOString() });
    return;
  }

  // FETCH
  await updateJob(job.id, { status: "fetching", started_at: new Date().toISOString() });
  const fetchResult = await fetchFromSource(source);
  if (!fetchResult.ok || !fetchResult.content) {
    const errMsg = fetchResult.error || "Не удалось загрузить данные";
    await updateJob(job.id, { status: "failed", error_summary: errMsg, finished_at: new Date().toISOString() });
    await markSourceError(source.id, job.id, errMsg);
    return;
  }

  // PARSE
  await updateJob(job.id, { status: "validating" });
  const parsed = parseContent(fetchResult.content, source.file_format);
  if (!parsed.ok) {
    const errMsg = parsed.error || "Ошибка парсинга данных";
    await updateJob(job.id, { status: "failed", error_summary: errMsg, rows_total: 0, finished_at: new Date().toISOString() });
    await markSourceError(source.id, job.id, errMsg);
    return;
  }

  // MAP
  const mappings = await getMappings(source.id);
  const effectiveMappings = mappings.length > 0 ? mappings : autoDetectMappings(parsed.columns);
  const mapped = applyMappings(parsed.rows, effectiveMappings);

  // VALIDATE
  const validation = validateProducts(mapped, 2);
  const rowsTotal = parsed.rows.length;

  if (job.mode === "dry_run") {
    await updateJob(job.id, {
      status: validation.errors.length > 0 ? "partial" : "completed",
      rows_total: rowsTotal,
      rows_valid: validation.valid.length,
      rows_failed: validation.errors.length,
      finished_at: new Date().toISOString(),
    });
    if (validation.errors.length > 0) {
      await insertErrors(validation.errors.map((e) => ({
        job_id: job.id,
        vendor_id: job.vendor_id,
        row_number: e.row_number,
        sku: e.sku ?? undefined,
        field_name: e.field_name ?? undefined,
        error_code: e.error_code,
        error_message: e.error_message,
        raw_value: e.raw_value ?? undefined,
      })));
    }
    return;
  }

  // PROCESS (live sync)
  await updateJob(job.id, { status: "processing" });
  const upsertResult = await upsertProducts(job.vendor_id, source.id, validation.valid, {
    autoActivate: source.auto_activate_products,
    deactivateMissing: source.deactivate_missing_products,
  });

  // Save errors
  if (validation.errors.length > 0) {
    await insertErrors(validation.errors.map((e) => ({
      job_id: job.id,
      vendor_id: job.vendor_id,
      row_number: e.row_number,
      sku: e.sku ?? undefined,
      field_name: e.field_name ?? undefined,
      error_code: e.error_code,
      error_message: e.error_message,
      raw_value: e.raw_value ?? undefined,
    })));
  }

  const finalStatus = validation.errors.length > 0 ? "partial" : "completed";
  await updateJob(job.id, {
    status: finalStatus,
    rows_total: rowsTotal,
    rows_valid: validation.valid.length,
    rows_created: upsertResult.created,
    rows_updated: upsertResult.updated,
    rows_skipped: upsertResult.skipped,
    rows_failed: validation.errors.length,
    finished_at: new Date().toISOString(),
  });

  if (finalStatus === "completed") {
    await markSourceSuccess(source.id, job.id);
  } else {
    await markSourceError(source.id, job.id, `${validation.errors.length} ошибок из ${rowsTotal} строк`);
  }
}

export async function runDryRunPreview(source: CatalogSource, fileContent?: string): Promise<DryRunResult> {
  // Fetch data
  let content = fileContent;

  if (!content) {
    const fetchResult = await fetchFromSource(source);
    if (!fetchResult.ok || !fetchResult.content) {
      return { ok: false, rows_total: 0, rows_valid: 0, rows_failed: 0, preview: [], errors: [], columns: [], detected_mappings: [], error: fetchResult.error };
    }
    content = fetchResult.content;
  }

  // Parse
  const parsed = parseContent(content, source.file_format ?? undefined);
  if (!parsed.ok) {
    return { ok: false, rows_total: 0, rows_valid: 0, rows_failed: 0, preview: [], errors: [], columns: parsed.columns, detected_mappings: [], error: parsed.error };
  }

  // Map
  const mappings = await getMappings(source.id);
  const detected = mappings.length > 0
    ? mappings.map((m) => ({ source_field: m.source_field, target_field: m.target_field }))
    : autoDetectMappings(parsed.columns);
  const mapped = applyMappings(parsed.rows, detected as Array<{ source_field: string; target_field: string }>);

  // Validate
  const validation = validateProducts(mapped, 2);

  // Preview first 10
  const preview = validation.valid.slice(0, 10).map((p) => p as unknown as Record<string, unknown>);
  const errors = validation.errors.slice(0, 20).map((e) => ({
    row_number: e.row_number,
    error_message: e.error_message,
    field_name: e.field_name,
  }));

  return {
    ok: true,
    rows_total: parsed.rows.length,
    rows_valid: validation.valid.length,
    rows_failed: validation.errors.length,
    preview,
    errors,
    columns: parsed.columns,
    detected_mappings: detected,
  };
}
