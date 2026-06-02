import "server-only";

import { getSupabaseAdmin, isSupabaseConfigured, isMissingTableError } from "./supabase";

export type LegalVersion = {
  id: string;
  docSlug: string;
  revision: string;
  publishedAt: string;
  publishedBy: string;
  changeSummary: string;
  isCurrent: boolean;
};

type Row = {
  id: string;
  doc_slug: string;
  revision: string;
  published_at: string;
  published_by: string;
  change_summary: string;
  is_current: boolean;
};

function rowToVersion(r: Row): LegalVersion {
  return {
    id: r.id,
    docSlug: r.doc_slug,
    revision: r.revision,
    publishedAt: r.published_at,
    publishedBy: r.published_by,
    changeSummary: r.change_summary,
    isCurrent: r.is_current,
  };
}

export async function listVersionsByDoc(docSlug: string): Promise<LegalVersion[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("legal_versions")
    .select("*")
    .eq("doc_slug", docSlug)
    .order("published_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`listVersionsByDoc: ${error.message}`);
  }
  return (data as Row[]).map(rowToVersion);
}

export async function listAllVersions(): Promise<LegalVersion[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("legal_versions")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(200);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`listAllVersions: ${error.message}`);
  }
  return (data as Row[]).map(rowToVersion);
}

export async function publishVersion(input: {
  docSlug: string;
  revision: string;
  changeSummary: string;
  publishedBy?: string;
}): Promise<LegalVersion> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;

  // Mark previous versions as not current
  await sb
    .from("legal_versions")
    .update({ is_current: false })
    .eq("doc_slug", input.docSlug);

  const id = `lv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await sb
    .from("legal_versions")
    .insert({
      id,
      doc_slug: input.docSlug,
      revision: input.revision,
      change_summary: input.changeSummary,
      published_by: input.publishedBy ?? "admin",
      is_current: true,
    })
    .select()
    .single();
  if (error) throw new Error(`publishVersion: ${error.message}`);
  return rowToVersion(data as Row);
}
