"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  testConnectionAction,
  runDryRunAction,
  runLiveSyncAction,
  getJobStatusAction,
  deleteSourceAction,
} from "@/server/catalog-sync-actions";
import type { CatalogSource, SyncJob } from "@/server/catalog-sync-store";
import { useRouter } from "next/navigation";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  queued: { label: "В очереди", color: "bg-gray-100 text-gray-700" },
  fetching: { label: "Загрузка данных", color: "bg-blue-100 text-blue-700" },
  validating: { label: "Проверка", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Обработка", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Готово", color: "bg-green-100 text-green-800" },
  partial: { label: "Частично", color: "bg-amber-100 text-amber-800" },
  failed: { label: "Ошибка", color: "bg-red-100 text-red-800" },
  cancelled: { label: "Отменено", color: "bg-gray-100 text-gray-600" },
};

export function SourceDetail({ source, jobs: initialJobs }: { source: CatalogSource; jobs: SyncJob[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [previewData, setPreviewData] = useState<{
    rows_total: number;
    rows_valid: number;
    rows_failed: number;
    preview: Array<Record<string, unknown>>;
  } | null>(null);
  const [jobs, setJobs] = useState(initialJobs);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);

  const showMsg = (msg: string, type: "success" | "error" | "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  const pollJob = useCallback(async (jobId: string) => {
    setPollingJobId(jobId);
    let attempts = 0;
    const poll = async () => {
      const res = await getJobStatusAction(jobId);
      if (!res.ok) { setPollingJobId(null); return; }
      const job = res.job;
      if (["completed", "partial", "failed"].includes(job.status)) {
        setPollingJobId(null);
        setJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
        if (job.status === "completed") showMsg(`Синхронизация завершена: создано ${job.rows_created}, обновлено ${job.rows_updated}`, "success");
        else if (job.status === "partial") showMsg(`Частично: ${job.rows_created + job.rows_updated} обработано, ${job.rows_failed} ошибок`, "info");
        else showMsg(job.error_summary || "Ошибка синхронизации", "error");
        router.refresh();
        return;
      }
      attempts++;
      if (attempts < 30) setTimeout(poll, 2000);
      else setPollingJobId(null);
    };
    poll();
  }, [router]);

  const handleTest = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    setPreviewData(null);
    const res = await testConnectionAction(source.id);
    setLoading(false);
    if (res.ok && res.preview) {
      setPreviewData(res.preview);
      showMsg(`Подключение работает! Найдено ${res.preview.rows_total} товаров`, "success");
    } else {
      showMsg(res.error || "Ошибка подключения", "error");
    }
  }, [source.id]);

  const handleDryRun = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const res = await runDryRunAction(source.id);
    setLoading(false);
    if (res.ok) {
      showMsg("Тестовая проверка запущена...", "info");
      pollJob(res.jobId);
    } else {
      showMsg(res.error, "error");
    }
  }, [source.id, pollJob]);

  const handleLiveSync = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const res = await runLiveSyncAction(source.id);
    setLoading(false);
    if (res.ok) {
      showMsg("Синхронизация запущена — товары обновляются в фоне...", "info");
      pollJob(res.jobId);
    } else {
      showMsg(res.error, "error");
    }
  }, [source.id, pollJob]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Удалить этот источник? Товары останутся в каталоге.")) return;
    await deleteSourceAction(source.id);
    router.push("/vendor/dashboard/catalog/sync");
  }, [source.id, router]);

  const isPolling = !!pollingJobId;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      {message && (
        <div className={`rounded-xl p-3 text-[13px] ${
          messageType === "success" ? "bg-green-50 text-green-800 border border-green-200" :
          messageType === "error" ? "bg-red-50 text-red-800 border border-red-200" :
          "bg-blue-50 text-blue-800 border border-blue-200"
        }`}>
          {isPolling && <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse mr-2" />}
          {message}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={handleTest} disabled={loading || isPolling}>
          Проверить
        </Button>
        <Button size="sm" onClick={handleDryRun} disabled={loading || isPolling}>
          Тест-запуск
        </Button>
      </div>

      <Button fullWidth size="lg" onClick={handleLiveSync} disabled={loading || isPolling}>
        {isPolling ? "Выполняется..." : "Запустить синхронизацию"}
      </Button>

      {/* Preview */}
      {previewData && previewData.preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-ink-700">
            Предпросмотр ({previewData.rows_valid} из {previewData.rows_total} валидных):
          </p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {previewData.preview.map((item, i) => (
              <div key={i} className="rounded-xl border border-ink-100 p-2 text-[11px]">
                <p className="font-medium text-ink-900 truncate">{String(item.name || item.external_sku || `Строка ${i + 1}`)}</p>
                {"price" in item && item.price != null && <span className="text-ink-500">{String(item.price)} ₽</span>}
                {"external_sku" in item && item.external_sku != null && <span className="ml-2 text-ink-400">SKU: {String(item.external_sku)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job history */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-ink-700">История синхронизаций:</p>
          {jobs.map((job) => {
            const st = STATUS_MAP[job.status] || STATUS_MAP.queued;
            return (
              <div key={job.id} className="rounded-xl border border-ink-100 p-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.color}`}>
                    {st.label}
                  </span>
                  <span className="text-ink-400">
                    {new Date(job.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {job.rows_total > 0 && (
                  <p className="text-ink-500 mt-1">
                    {job.mode === "dry_run" ? "Проверка" : "Синхронизация"}: {job.rows_total} строк
                    {job.rows_created > 0 && <>, создано: {job.rows_created}</>}
                    {job.rows_updated > 0 && <>, обновлено: {job.rows_updated}</>}
                    {job.rows_failed > 0 && <span className="text-red-600">, ошибок: {job.rows_failed}</span>}
                  </p>
                )}
                {job.error_summary && <p className="text-red-600 mt-1">{job.error_summary}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Source info */}
      <div className="rounded-xl border border-ink-100 p-3 text-[12px] text-ink-500 space-y-1">
        <p>Тип: {source.type === "url_feed" ? "URL-ссылка" : source.type === "api" ? "API" : source.type === "sftp" ? "SFTP" : "Файл"}</p>
        {source.feed_url && <p className="truncate">URL: {source.feed_url}</p>}
        {source.api_base_url && <p className="truncate">API: {source.api_base_url}{source.api_catalog_endpoint}</p>}
        <p>Режим: {source.sync_mode === "delta" ? "Только изменения" : "Полная синхронизация"}</p>
      </div>

      {/* Delete */}
      <button onClick={handleDelete} className="w-full text-center text-[12px] text-red-500 hover:text-red-700 py-2">
        Удалить источник
      </button>
    </div>
  );
}
