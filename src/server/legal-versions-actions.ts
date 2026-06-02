"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "./admin-auth";
import {
  listVersionsByDoc,
  listAllVersions,
  publishVersion,
  type LegalVersion,
} from "./legal-versions-store";

type Result = { ok: true; version?: LegalVersion } | { ok: false; error: string };

export async function listVersionsByDocAction(docSlug: string): Promise<LegalVersion[]> {
  if (!(await isAdminAuthenticated())) return [];
  return listVersionsByDoc(docSlug);
}

export async function listAllVersionsAction(): Promise<LegalVersion[]> {
  if (!(await isAdminAuthenticated())) return [];
  return listAllVersions();
}

export async function publishVersionAction(input: {
  docSlug: string;
  revision: string;
  changeSummary: string;
}): Promise<Result> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Доступ запрещён" };
  if (!input.revision.trim()) return { ok: false, error: "Укажите номер версии" };
  if (!input.changeSummary.trim()) return { ok: false, error: "Опишите изменения" };
  try {
    const version = await publishVersion(input);
    revalidatePath("/admin/legal-docs");
    return { ok: true, version };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка" };
  }
}
