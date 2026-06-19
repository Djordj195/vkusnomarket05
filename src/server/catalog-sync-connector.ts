import "server-only";

import type { CatalogSource } from "./catalog-sync-store";

export type FetchResult = {
  ok: boolean;
  content?: string;
  contentType?: string;
  error?: string;
};

const TIMEOUT_MS = 15000;

export async function fetchFromSource(source: CatalogSource): Promise<FetchResult> {
  switch (source.type) {
    case "url_feed":
      return fetchUrlFeed(source);
    case "api":
      return fetchApi(source);
    case "sftp":
      return { ok: false, error: "SFTP пока не поддерживается — будет доступен в следующем обновлении" };
    case "manual_file":
      return { ok: false, error: "Для файла используйте загрузку вручную" };
    default:
      return { ok: false, error: "Неизвестный тип источника" };
  }
}

async function fetchUrlFeed(source: CatalogSource): Promise<FetchResult> {
  const url = source.feed_url;
  if (!url) return { ok: false, error: "Не указана ссылка на каталог" };

  try {
    const headers: Record<string, string> = { ...(source.feed_headers ?? {}) };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch(url, {
      method: source.feed_method || "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      return { ok: false, error: `Ошибка загрузки: HTTP ${resp.status}` };
    }

    const content = await resp.text();
    const contentType = resp.headers.get("content-type") ?? undefined;
    return { ok: true, content, contentType };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    if (msg.includes("abort")) {
      return { ok: false, error: "Время ожидания истекло — источник не отвечает" };
    }
    return { ok: false, error: `Не удалось подключиться: ${msg}` };
  }
}

async function fetchApi(source: CatalogSource): Promise<FetchResult> {
  const baseUrl = source.api_base_url;
  const endpoint = source.api_catalog_endpoint;
  if (!baseUrl || !endpoint) return { ok: false, error: "Не указан URL API" };

  const url = `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  try {
    const headers: Record<string, string> = { Accept: "application/json" };

    if (source.api_auth_type === "bearer" && source.api_credentials?.token) {
      headers["Authorization"] = `Bearer ${source.api_credentials.token}`;
    } else if (source.api_auth_type === "basic" && source.api_credentials?.username) {
      const b64 = Buffer.from(`${source.api_credentials.username}:${source.api_credentials.password ?? ""}`).toString("base64");
      headers["Authorization"] = `Basic ${b64}`;
    } else if (source.api_auth_type === "api_key" && source.api_credentials?.key) {
      headers[source.api_credentials.header_name || "X-API-Key"] = source.api_credentials.key;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) {
        return { ok: false, error: "Ошибка авторизации API — проверьте данные доступа" };
      }
      return { ok: false, error: `API вернул ошибку: HTTP ${resp.status}` };
    }

    const content = await resp.text();
    return { ok: true, content, contentType: "application/json" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
    if (msg.includes("abort")) {
      return { ok: false, error: "Время ожидания истекло — API не отвечает" };
    }
    return { ok: false, error: `Не удалось подключиться к API: ${msg}` };
  }
}
