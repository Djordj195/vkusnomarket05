import "server-only";

import { getSupabaseAdmin } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────

export type SourceType = "url_feed" | "api" | "sftp" | "manual_file";
export type SyncMode = "full" | "delta";
export type JobStatus = "queued" | "fetching" | "validating" | "processing" | "completed" | "partial" | "failed" | "cancelled";
export type JobMode = "dry_run" | "live";
export type TriggerType = "manual" | "schedule" | "retry";

export type CatalogSource = {
  id: string;
  vendor_id: string;
  type: SourceType;
  name: string;
  is_active: boolean;
  file_format: string | null;
  sync_mode: SyncMode;
  schedule_cron: string | null;
  feed_url: string | null;
  feed_method: string | null;
  feed_headers: Record<string, string>;
  api_base_url: string | null;
  api_catalog_endpoint: string | null;
  api_auth_type: string | null;
  api_credentials: Record<string, string>;
  api_delta_endpoint: string | null;
  sftp_host: string | null;
  sftp_port: number;
  sftp_username: string | null;
  sftp_path: string | null;
  mapping_preset: string;
  auto_activate_products: boolean;
  deactivate_missing_products: boolean;
  last_success_at: string | null;
  last_error_at: string | null;
  last_job_id: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type SyncJob = {
  id: string;
  source_id: string;
  vendor_id: string;
  status: JobStatus;
  mode: JobMode;
  sync_mode: SyncMode;
  idempotency_key: string | null;
  trigger_type: TriggerType;
  rows_total: number;
  rows_valid: number;
  rows_created: number;
  rows_updated: number;
  rows_skipped: number;
  rows_failed: number;
  error_summary: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type SyncError = {
  id: string;
  job_id: string;
  row_number: number | null;
  sku: string | null;
  field_name: string | null;
  error_code: string;
  error_message: string;
  raw_value: string | null;
  created_at: string;
};

export type FieldMapping = {
  id: string;
  source_id: string;
  source_field: string;
  target_field: string;
  transform_rule: string | null;
  is_required: boolean;
  sort_order: number;
};

// ─── CRUD Sources ────────────────────────────────────────────────────

export async function listSources(vendorId: string): Promise<CatalogSource[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("vendor_catalog_sources")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CatalogSource[];
}

export async function getSource(id: string, vendorId: string): Promise<CatalogSource | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("vendor_catalog_sources")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .single();
  return data as CatalogSource | null;
}

export async function createSource(vendorId: string, input: Partial<CatalogSource>): Promise<CatalogSource | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("vendor_catalog_sources")
    .insert({ ...input, vendor_id: vendorId })
    .select()
    .single();
  return data as CatalogSource | null;
}

export async function updateSource(id: string, vendorId: string, input: Partial<CatalogSource>): Promise<CatalogSource | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("vendor_catalog_sources")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .select()
    .single();
  return data as CatalogSource | null;
}

export async function deleteSource(id: string, vendorId: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { error } = await sb
    .from("vendor_catalog_sources")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendorId);
  return !error;
}

// ─── Field Mappings ──────────────────────────────────────────────────

export async function getMappings(sourceId: string): Promise<FieldMapping[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("vendor_catalog_field_mappings")
    .select("*")
    .eq("source_id", sourceId)
    .order("sort_order");
  return (data ?? []) as FieldMapping[];
}

export async function saveMappings(sourceId: string, mappings: Array<{ source_field: string; target_field: string; transform_rule?: string; is_required?: boolean }>): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from("vendor_catalog_field_mappings").delete().eq("source_id", sourceId);
  if (mappings.length > 0) {
    await sb.from("vendor_catalog_field_mappings").insert(
      mappings.map((m, i) => ({ source_id: sourceId, ...m, sort_order: i }))
    );
  }
}

// ─── Sync Jobs ───────────────────────────────────────────────────────

export async function createJob(input: {
  source_id: string;
  vendor_id: string;
  mode: JobMode;
  sync_mode: SyncMode;
  trigger_type?: TriggerType;
  idempotency_key?: string;
}): Promise<SyncJob | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("vendor_catalog_sync_jobs")
    .insert(input)
    .select()
    .single();
  return data as SyncJob | null;
}

export async function updateJob(jobId: string, updates: Partial<SyncJob>): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from("vendor_catalog_sync_jobs").update(updates).eq("id", jobId);
}

export async function getJob(jobId: string, vendorId: string): Promise<SyncJob | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("vendor_catalog_sync_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("vendor_id", vendorId)
    .single();
  return data as SyncJob | null;
}

export async function listJobs(sourceId: string, vendorId: string, limit = 20): Promise<SyncJob[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("vendor_catalog_sync_jobs")
    .select("*")
    .eq("source_id", sourceId)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SyncJob[];
}

export async function hasActiveJob(sourceId: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data } = await sb
    .from("vendor_catalog_sync_jobs")
    .select("id")
    .eq("source_id", sourceId)
    .in("status", ["queued", "fetching", "validating", "processing"])
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// ─── Sync Errors ─────────────────────────────────────────────────────

export async function insertErrors(errors: Array<{
  job_id: string;
  vendor_id: string;
  row_number?: number;
  sku?: string;
  field_name?: string;
  error_code: string;
  error_message: string;
  raw_value?: string;
}>): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb || errors.length === 0) return;
  await sb.from("vendor_catalog_sync_errors").insert(errors);
}

export async function listErrors(jobId: string, limit = 50): Promise<SyncError[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("vendor_catalog_sync_errors")
    .select("*")
    .eq("job_id", jobId)
    .order("row_number")
    .limit(limit);
  return (data ?? []) as SyncError[];
}

// ─── Update source status ────────────────────────────────────────────

export async function markSourceSuccess(sourceId: string, jobId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from("vendor_catalog_sources")
    .update({ last_success_at: new Date().toISOString(), last_job_id: jobId, last_error_message: null, updated_at: new Date().toISOString() })
    .eq("id", sourceId);
}

export async function markSourceError(sourceId: string, jobId: string, message: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from("vendor_catalog_sources")
    .update({ last_error_at: new Date().toISOString(), last_job_id: jobId, last_error_message: message, updated_at: new Date().toISOString() })
    .eq("id", sourceId);
}
