"use server";

import { getCurrentVendor } from "./vendor-auth";
import {
  listSources,
  getSource,
  createSource,
  updateSource,
  deleteSource,
  getMappings,
  saveMappings,
  createJob,
  getJob,
  listJobs,
  listErrors,
  hasActiveJob,
  type CatalogSource,
  type SourceType,
} from "./catalog-sync-store";
import { runSync, runDryRunPreview, type DryRunResult } from "./catalog-sync-runner";
import { after } from "next/server";

// ─── Source actions ──────────────────────────────────────────────────

export async function listSourcesAction() {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const sources = await listSources(vendor.id);
  return { ok: true as const, sources };
}

export async function getSourceAction(sourceId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const source = await getSource(sourceId, vendor.id);
  if (!source) return { ok: false as const, error: "Источник не найден" };
  return { ok: true as const, source };
}

export async function createSourceAction(input: {
  type: SourceType;
  name: string;
  feed_url?: string;
  feed_method?: string;
  file_format?: string;
  api_base_url?: string;
  api_catalog_endpoint?: string;
  api_auth_type?: string;
  api_credentials?: Record<string, string>;
  sftp_host?: string;
  sftp_port?: number;
  sftp_username?: string;
  sftp_path?: string;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const source = await createSource(vendor.id, input as Partial<CatalogSource>);
  if (!source) return { ok: false as const, error: "Не удалось создать источник" };
  return { ok: true as const, source };
}

export async function updateSourceAction(sourceId: string, input: Partial<CatalogSource>) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const source = await updateSource(sourceId, vendor.id, input);
  if (!source) return { ok: false as const, error: "Не удалось обновить" };
  return { ok: true as const, source };
}

export async function deleteSourceAction(sourceId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const success = await deleteSource(sourceId, vendor.id);
  return success ? { ok: true as const } : { ok: false as const, error: "Не удалось удалить" };
}

// ─── Mapping actions ─────────────────────────────────────────────────

export async function getMappingsAction(sourceId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const mappings = await getMappings(sourceId);
  return { ok: true as const, mappings };
}

export async function saveMappingsAction(sourceId: string, mappings: Array<{ source_field: string; target_field: string; transform_rule?: string; is_required?: boolean }>) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  await saveMappings(sourceId, mappings);
  return { ok: true as const };
}

// ─── Test connection / dry-run ───────────────────────────────────────

export async function testConnectionAction(sourceId: string): Promise<{ ok: boolean; error?: string; preview?: DryRunResult }> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "Не авторизован" };
  const source = await getSource(sourceId, vendor.id);
  if (!source) return { ok: false, error: "Источник не найден" };

  const preview = await runDryRunPreview(source);
  return preview.ok ? { ok: true, preview } : { ok: false, error: preview.error };
}

export async function runDryRunAction(sourceId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const source = await getSource(sourceId, vendor.id);
  if (!source) return { ok: false as const, error: "Источник не найден" };

  if (await hasActiveJob(sourceId)) {
    return { ok: false as const, error: "Уже выполняется синхронизация — дождитесь завершения" };
  }

  const job = await createJob({
    source_id: sourceId,
    vendor_id: vendor.id,
    mode: "dry_run",
    sync_mode: source.sync_mode ?? "full",
    trigger_type: "manual",
  });
  if (!job) return { ok: false as const, error: "Не удалось создать задачу" };

  after(async () => { await runSync(job); });

  return { ok: true as const, jobId: job.id };
}

// ─── Live sync ───────────────────────────────────────────────────────

export async function runLiveSyncAction(sourceId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const source = await getSource(sourceId, vendor.id);
  if (!source) return { ok: false as const, error: "Источник не найден" };

  if (await hasActiveJob(sourceId)) {
    return { ok: false as const, error: "Уже выполняется синхронизация — дождитесь завершения" };
  }

  const job = await createJob({
    source_id: sourceId,
    vendor_id: vendor.id,
    mode: "live",
    sync_mode: source.sync_mode ?? "full",
    trigger_type: "manual",
  });
  if (!job) return { ok: false as const, error: "Не удалось создать задачу" };

  after(async () => { await runSync(job); });

  return { ok: true as const, jobId: job.id };
}

// ─── Job status / history ────────────────────────────────────────────

export async function getJobStatusAction(jobId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const job = await getJob(jobId, vendor.id);
  if (!job) return { ok: false as const, error: "Задача не найдена" };
  return { ok: true as const, job };
}

export async function listJobsAction(sourceId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const jobs = await listJobs(sourceId, vendor.id);
  return { ok: true as const, jobs };
}

export async function listJobErrorsAction(jobId: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const errors = await listErrors(jobId);
  return { ok: true as const, errors };
}

// ─── Manual file upload ──────────────────────────────────────────────

export async function uploadFileAndPreviewAction(sourceId: string, fileContent: string, fileName: string) {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false as const, error: "Не авторизован" };
  const source = await getSource(sourceId, vendor.id);
  if (!source) return { ok: false as const, error: "Источник не найден" };

  const format = fileName.endsWith(".csv") ? "csv" : fileName.endsWith(".json") ? "json" : fileName.endsWith(".xml") ? "xml" : null;
  const sourceWithFormat = { ...source, file_format: format } as CatalogSource;

  const preview = await runDryRunPreview(sourceWithFormat, fileContent);
  return preview.ok ? { ok: true as const, preview } : { ok: false as const, error: preview.error };
}
