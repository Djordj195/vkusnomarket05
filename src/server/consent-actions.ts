"use server";

import { isAdminAuthenticated } from "./admin-auth";
import { listConsentsByPhone, countConsents } from "./consent-store";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

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

export async function listConsentsAction(
  phoneFilter?: string
): Promise<ConsentRow[]> {
  if (!(await isAdminAuthenticated())) return [];

  if (phoneFilter) {
    const entries = await listConsentsByPhone(phoneFilter);
    return entries.map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      userPhone: e.userPhone,
      context: e.context,
      docSlugs: e.docSlugs,
      docVersions: e.docVersions,
      ip: e.ip,
      userAgent: e.userAgent,
    }));
  }

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin()!;
    const { data } = await sb
      .from("consent_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []).map(
      (r: {
        id: string;
        created_at: string;
        user_phone: string;
        context: string;
        doc_slugs: string;
        doc_versions: string;
        ip: string | null;
        user_agent: string | null;
      }) => ({
        id: r.id,
        createdAt: r.created_at,
        userPhone: r.user_phone,
        context: r.context,
        docSlugs: r.doc_slugs,
        docVersions: r.doc_versions,
        ip: r.ip,
        userAgent: r.user_agent,
      })
    );
  }

  return [];
}

export async function getConsentCountAction(): Promise<number> {
  if (!(await isAdminAuthenticated())) return 0;
  return countConsents();
}
