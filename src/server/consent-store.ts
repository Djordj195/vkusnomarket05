import "server-only";
import { headers } from "next/headers";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { LEGAL_DOCS } from "@/data/legal";

export type ConsentEntry = {
  id: string;
  createdAt: string;
  userPhone: string;
  context: ConsentContext;
  docSlugs: string;
  docVersions: string;
  checkboxText: string;
  ip: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
};

export type ConsentContext =
  | "client_login"
  | "vendor_login"
  | "courier_login"
  | "checkout"
  | "signup";

type Row = {
  id: string;
  created_at: string;
  user_phone: string;
  context: ConsentContext;
  doc_slugs: string;
  doc_versions: string;
  checkbox_text: string;
  ip: string | null;
  user_agent: string | null;
  device_info: string | null;
};

function rowToEntry(r: Row): ConsentEntry {
  return {
    id: r.id,
    createdAt: r.created_at,
    userPhone: r.user_phone,
    context: r.context,
    docSlugs: r.doc_slugs,
    docVersions: r.doc_versions,
    checkboxText: r.checkbox_text,
    ip: r.ip,
    userAgent: r.user_agent,
    deviceInfo: r.device_info,
  };
}

type Store = { entries: ConsentEntry[] };
const GLOBAL_KEY = "__VKUSNOMARKET_CONSENT_STORE__";

function getMemoryStore(): Store {
  const g = globalThis as unknown as Record<string, Store | undefined>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { entries: [] };
  return g[GLOBAL_KEY]!;
}

function buildDocVersions(slugs: string[]): string {
  const versions: Record<string, string> = {};
  for (const slug of slugs) {
    const doc = LEGAL_DOCS.find((d) => d.slug === slug);
    versions[slug] = doc?.revision ?? "v1";
  }
  return JSON.stringify(versions);
}

async function getRequestMeta(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const userAgent = h.get("user-agent");
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export async function logConsent(input: {
  userPhone: string;
  context: ConsentContext;
  docSlugs: string[];
  checkboxText: string;
}): Promise<void> {
  const id = `cns-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const docVersions = buildDocVersions(input.docSlugs);
  const { ip, userAgent } = await getRequestMeta();

  const entry: ConsentEntry = {
    id,
    createdAt: new Date().toISOString(),
    userPhone: input.userPhone,
    context: input.context,
    docSlugs: input.docSlugs.join(","),
    docVersions,
    checkboxText: input.checkboxText,
    ip,
    userAgent,
    deviceInfo: null,
  };

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    await sb.from("consent_log").insert({
      id: entry.id,
      user_phone: entry.userPhone,
      context: entry.context,
      doc_slugs: entry.docSlugs,
      doc_versions: entry.docVersions,
      checkbox_text: entry.checkboxText,
      ip: entry.ip,
      user_agent: entry.userAgent,
      device_info: entry.deviceInfo,
    });
  } else {
    getMemoryStore().entries.push(entry);
  }
}

export async function listConsentsByPhone(
  phone: string
): Promise<ConsentEntry[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data } = await sb
      .from("consent_log")
      .select("*")
      .eq("user_phone", phone)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []).map((r: Row) => rowToEntry(r));
  }
  return getMemoryStore()
    .entries.filter((e) => e.userPhone === phone)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function countConsents(): Promise<number> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { count } = await sb
      .from("consent_log")
      .select("id", { count: "exact", head: true });
    return count ?? 0;
  }
  return getMemoryStore().entries.length;
}
