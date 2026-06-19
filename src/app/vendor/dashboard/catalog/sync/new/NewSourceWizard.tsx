"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSourceAction, testConnectionAction } from "@/server/catalog-sync-actions";
import type { SourceType } from "@/server/catalog-sync-store";

type Step = "type" | "config" | "test";

const SOURCE_TYPES: Array<{ value: SourceType; label: string; desc: string; icon: string }> = [
  { value: "url_feed", label: "Ссылка (URL)", desc: "CSV, JSON или XML файл по ссылке", icon: "🔗" },
  { value: "api", label: "API", desc: "REST API вашей системы", icon: "⚡" },
  { value: "sftp", label: "SFTP", desc: "Файл на SFTP-сервере", icon: "📁" },
  { value: "manual_file", label: "Файл вручную", desc: "Загрузите CSV/JSON файл", icon: "📄" },
];

export function NewSourceWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiAuthType, setApiAuthType] = useState("none");
  const [apiToken, setApiToken] = useState("");
  const [sftpHost, setSftpHost] = useState("");
  const [sftpUser, setSftpUser] = useState("");
  const [sftpPath, setSftpPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ rows: number; valid: number } | null>(null);

  const handleSelectType = useCallback((type: SourceType) => {
    setSourceType(type);
    setStep("config");
  }, []);

  const handleCreate = useCallback(async () => {
    if (!sourceType) return;
    setLoading(true);
    setError(null);

    const input: Record<string, unknown> = { type: sourceType, name: name || SOURCE_TYPES.find((t) => t.value === sourceType)?.label || "" };

    if (sourceType === "url_feed") {
      if (!feedUrl) { setError("Укажите ссылку на каталог"); setLoading(false); return; }
      input.feed_url = feedUrl;
    } else if (sourceType === "api") {
      if (!apiBaseUrl || !apiEndpoint) { setError("Укажите URL и endpoint API"); setLoading(false); return; }
      input.api_base_url = apiBaseUrl;
      input.api_catalog_endpoint = apiEndpoint;
      input.api_auth_type = apiAuthType;
      if (apiToken) input.api_credentials = { token: apiToken };
    } else if (sourceType === "sftp") {
      if (!sftpHost) { setError("Укажите хост SFTP"); setLoading(false); return; }
      input.sftp_host = sftpHost;
      input.sftp_username = sftpUser;
      input.sftp_path = sftpPath;
    }

    const res = await createSourceAction(input as Parameters<typeof createSourceAction>[0]);
    if (!res.ok) { setError(res.error); setLoading(false); return; }

    // Test connection
    const test = await testConnectionAction(res.source!.id);
    setLoading(false);

    if (test.ok && test.preview) {
      setTestResult({ rows: test.preview.rows_total, valid: test.preview.rows_valid });
      setStep("test");
      setTimeout(() => router.push(`/vendor/dashboard/catalog/sync/${res.source!.id}`), 1500);
    } else {
      setError(test.error || "Не удалось проверить подключение");
      router.push(`/vendor/dashboard/catalog/sync/${res.source!.id}`);
    }
  }, [sourceType, name, feedUrl, apiBaseUrl, apiEndpoint, apiAuthType, apiToken, sftpHost, sftpUser, sftpPath, router]);

  if (step === "test" && testResult) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
        <div className="text-3xl">✅</div>
        <p className="text-[15px] font-medium text-green-900">Подключение успешно!</p>
        <p className="text-[13px] text-green-700">
          Найдено {testResult.rows} товаров, из них валидных: {testResult.valid}
        </p>
        <p className="text-[12px] text-green-600">Переход к настройке...</p>
      </div>
    );
  }

  if (step === "type") {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-ink-600">Выберите способ подключения каталога:</p>
        {SOURCE_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => handleSelectType(t.value)}
            className="w-full text-left rounded-2xl border border-ink-100 bg-white p-4 hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-[14px] font-medium text-ink-900">{t.label}</p>
                <p className="text-[12px] text-ink-500">{t.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        label="Название источника (необязательно)"
        placeholder="Мой каталог из 1С"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {sourceType === "url_feed" && (
        <Input
          label="Ссылка на каталог"
          placeholder="https://example.com/products.csv"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
        />
      )}

      {sourceType === "api" && (
        <>
          <Input label="URL API" placeholder="https://api.myshop.ru" value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} />
          <Input label="Endpoint каталога" placeholder="/products" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} />
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-ink-700">Авторизация</label>
            <select
              value={apiAuthType}
              onChange={(e) => setApiAuthType(e.target.value)}
              className="w-full rounded-xl border border-ink-200 px-3 py-2 text-[13px]"
            >
              <option value="none">Без авторизации</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="api_key">API Key</option>
            </select>
          </div>
          {apiAuthType !== "none" && (
            <Input label="Токен / Ключ" placeholder="sk-..." value={apiToken} onChange={(e) => setApiToken(e.target.value)} />
          )}
        </>
      )}

      {sourceType === "sftp" && (
        <>
          <Input label="Хост SFTP" placeholder="sftp.myshop.ru" value={sftpHost} onChange={(e) => setSftpHost(e.target.value)} />
          <Input label="Пользователь" placeholder="upload" value={sftpUser} onChange={(e) => setSftpUser(e.target.value)} />
          <Input label="Путь к файлу" placeholder="/export/products.csv" value={sftpPath} onChange={(e) => setSftpPath(e.target.value)} />
        </>
      )}

      {sourceType === "manual_file" && (
        <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center">
          <p className="text-[13px] text-ink-500">Загрузка файла будет доступна после создания источника</p>
        </div>
      )}

      {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <Button fullWidth size="lg" onClick={handleCreate} disabled={loading}>
        {loading ? "Проверяем подключение..." : "Проверить и подключить"}
      </Button>

      <button onClick={() => setStep("type")} className="w-full text-center text-[13px] text-ink-500 hover:text-ink-800">
        ← Назад к выбору типа
      </button>
    </div>
  );
}
