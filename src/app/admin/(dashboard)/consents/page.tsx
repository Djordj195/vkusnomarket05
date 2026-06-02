"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { listConsentsAction } from "@/server/consent-actions";

type ConsentRow = {
  id: string;
  createdAt: string;
  userPhone: string;
  context: string;
  docSlugs: string;
  docVersions: string;
  ip: string | null;
  userAgent: string | null;
};

const CTX_LABELS: Record<string, string> = {
  client_login: "Клиент (вход)",
  vendor_login: "Продавец (вход)",
  courier_login: "Курьер (вход)",
  checkout: "Оформление заказа",
  signup: "Регистрация",
};

export default function ConsentsPage() {
  const [rows, setRows] = useState<ConsentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listConsentsAction(search || undefined);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield size={20} className="text-brand-600" />
        <h2 className="text-[18px] font-bold text-ink-900">Журнал согласий</h2>
      </div>

      <p className="text-[12px] text-ink-500">
        Фиксация согласий пользователей (152-ФЗ). Каждая запись содержит версию
        документа, IP-адрес и устройство на момент согласия.
      </p>

      <input
        type="text"
        placeholder="Поиск по номеру телефона..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-ink-200 px-3 py-2 text-[14px]"
      />

      {loading ? (
        <p className="py-10 text-center text-[13px] text-ink-500">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink-500">
          {search ? "Ничего не найдено" : "Записей пока нет"}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-ink-200 p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ink-900">
                  {r.userPhone}
                </span>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-600">
                  {CTX_LABELS[r.context] ?? r.context}
                </span>
              </div>
              <div className="text-[12px] text-ink-500">
                Документы: {r.docSlugs.split(",").join(", ")}
              </div>
              {r.docVersions && r.docVersions !== "{}" && (
                <div className="text-[11px] text-ink-400">
                  Версии: {r.docVersions}
                </div>
              )}
              <div className="flex items-center gap-3 text-[11px] text-ink-400">
                <span>
                  {new Date(r.createdAt).toLocaleString("ru-RU")}
                </span>
                {r.ip && <span>IP: {r.ip}</span>}
              </div>
              {r.userAgent && (
                <div className="truncate text-[10px] text-ink-300">
                  {r.userAgent}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
