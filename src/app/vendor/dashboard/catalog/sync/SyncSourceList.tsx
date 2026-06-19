"use client";

import Link from "next/link";
import type { CatalogSource } from "@/server/catalog-sync-store";

const TYPE_LABELS: Record<string, string> = {
  url_feed: "Ссылка (URL)",
  api: "API",
  sftp: "SFTP",
  manual_file: "Файл",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-600",
};

function getStatus(source: CatalogSource): { label: string; color: string } {
  if (!source.is_active) return { label: "Отключён", color: STATUS_COLORS.inactive };
  if (source.last_error_at && (!source.last_success_at || source.last_error_at > source.last_success_at)) {
    return { label: "Ошибка", color: STATUS_COLORS.error };
  }
  if (source.last_success_at) return { label: "Работает", color: STATUS_COLORS.active };
  return { label: "Новый", color: "bg-blue-100 text-blue-800" };
}

export function SyncSourceList({ sources }: { sources: CatalogSource[] }) {
  return (
    <div className="space-y-3">
      {sources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 p-6 text-center">
          <p className="text-[14px] text-ink-600 font-medium">Нет подключённых источников</p>
          <p className="text-[12px] text-ink-400 mt-1">
            Подключите каталог из 1С, CMS или любого другого сервиса
          </p>
        </div>
      )}

      {sources.map((source) => {
        const status = getStatus(source);
        return (
          <Link
            key={source.id}
            href={`/vendor/dashboard/catalog/sync/${source.id}`}
            className="block rounded-2xl border border-ink-100 bg-white p-4 hover:border-brand-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-ink-900">
                  {source.name || TYPE_LABELS[source.type] || source.type}
                </p>
                <p className="text-[12px] text-ink-500 mt-0.5">
                  {TYPE_LABELS[source.type]} • {source.sync_mode === "delta" ? "Обновления" : "Полная синхронизация"}
                </p>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            {source.last_error_message && (
              <p className="text-[11px] text-red-600 mt-2 line-clamp-1">{source.last_error_message}</p>
            )}
          </Link>
        );
      })}

      <Link
        href="/vendor/dashboard/catalog/sync/new"
        className="block w-full rounded-2xl bg-brand-600 text-white text-center py-3 text-[14px] font-semibold hover:bg-brand-700 transition-colors"
      >
        Подключить каталог
      </Link>
    </div>
  );
}
