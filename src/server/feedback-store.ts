import "server-only";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "./supabase";

export type FeedbackStatus = "pending" | "approved" | "rejected";

export type FeedbackEntry = {
  id: string;
  createdAt: string;
  name: string;
  contact: string;
  message: string;
  status: FeedbackStatus;
  reviewedAt: string | null;
  reviewer: string | null;
};

export type ApprovedFeedback = {
  id: string;
  createdAt: string;
  name: string;
  message: string;
};

type FeedbackRow = {
  id: string;
  created_at: string;
  name: string;
  contact: string;
  message: string;
  status: FeedbackStatus;
  reviewed_at: string | null;
  reviewer: string | null;
};

function rowToEntry(r: FeedbackRow): FeedbackEntry {
  return {
    id: r.id,
    createdAt: r.created_at,
    name: r.name,
    contact: r.contact,
    message: r.message,
    status: r.status,
    reviewedAt: r.reviewed_at,
    reviewer: r.reviewer,
  };
}

function rowToApproved(r: FeedbackRow): ApprovedFeedback {
  return {
    id: r.id,
    createdAt: r.created_at,
    name: r.name,
    message: r.message,
  };
}

/**
 * Insert a new feedback entry with status='pending'.
 * Returns the entry id on success, or null when the table is missing /
 * Supabase is not configured. The caller is responsible for surfacing that
 * to the user (we still notify Telegram in those cases so feedback isn't
 * lost).
 */
export async function createFeedback(input: {
  name: string;
  contact: string;
  message: string;
}): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin()!;
  const id = `fb-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const { error } = await sb.from("feedback").insert({
    id,
    name: input.name,
    contact: input.contact,
    message: input.message,
    status: "pending",
  });
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(`createFeedback: ${error.message}`);
  }
  return { id };
}

export async function listApprovedFeedback(
  limit = 5
): Promise<ApprovedFeedback[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("feedback")
    .select("id, created_at, name, contact, message, status, reviewed_at, reviewer")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`listApprovedFeedback: ${error.message}`);
  }
  return (data as FeedbackRow[]).map(rowToApproved);
}

export async function countApprovedFeedback(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const sb = getSupabaseAdmin()!;
  const { count, error } = await sb
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw new Error(`countApprovedFeedback: ${error.message}`);
  }
  return count ?? 0;
}

export async function listFeedbackForAdmin(
  status?: FeedbackStatus | "all"
): Promise<FeedbackEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin()!;
  let q = sb
    .from("feedback")
    .select(
      "id, created_at, name, contact, message, status, reviewed_at, reviewer"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`listFeedbackForAdmin: ${error.message}`);
  }
  return (data as FeedbackRow[]).map(rowToEntry);
}

export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  reviewer?: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb
    .from("feedback")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewer: reviewer ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(`setFeedbackStatus: ${error.message}`);
}

export async function deleteFeedback(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("feedback").delete().eq("id", id);
  if (error) throw new Error(`deleteFeedback: ${error.message}`);
}

export async function countPendingFeedback(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const sb = getSupabaseAdmin()!;
  const { count, error } = await sb
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw new Error(`countPendingFeedback: ${error.message}`);
  }
  return count ?? 0;
}
