import "server-only";
import {
  getSupabaseAdmin,
  isMissingTableError,
  isSupabaseConfigured,
} from "./supabase";

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewTargetType = "product" | "shop";

export type Review = {
  id: string;
  createdAt: string;
  userPhone: string;
  userName: string;
  targetType: ReviewTargetType;
  targetId: string;
  orderId: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  reviewedAt: string | null;
  reviewer: string | null;
};

export type PublicReview = {
  id: string;
  createdAt: string;
  userName: string;
  rating: number;
  comment: string;
};

export type RatingStats = {
  avg: number;
  count: number;
};

type ReviewRow = {
  id: string;
  created_at: string;
  user_phone: string;
  user_name: string;
  target_type: ReviewTargetType;
  target_id: string;
  order_id: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  reviewed_at: string | null;
  reviewer: string | null;
};

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    createdAt: r.created_at,
    userPhone: r.user_phone,
    userName: r.user_name,
    targetType: r.target_type,
    targetId: r.target_id,
    orderId: r.order_id,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    reviewedAt: r.reviewed_at,
    reviewer: r.reviewer,
  };
}

function rowToPublic(r: ReviewRow): PublicReview {
  return {
    id: r.id,
    createdAt: r.created_at,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createReview(input: {
  userPhone: string;
  userName: string;
  targetType: ReviewTargetType;
  targetId: string;
  orderId?: string;
  rating: number;
  comment: string;
}): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin()!;
  const id = `rev-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const { error } = await sb.from("reviews").insert({
    id,
    user_phone: input.userPhone,
    user_name: input.userName,
    target_type: input.targetType,
    target_id: input.targetId,
    order_id: input.orderId ?? null,
    rating: input.rating,
    comment: input.comment,
    status: "pending",
  });
  if (error) {
    if (isMissingTableError(error)) return null;
    // Duplicate review → unique constraint violation
    if (error.code === "23505") return null;
    throw new Error(`createReview: ${error.message}`);
  }
  return { id };
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export async function listApprovedReviews(
  targetType: ReviewTargetType,
  targetId: string,
  limit = 50
): Promise<PublicReview[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`listApprovedReviews: ${error.message}`);
  }
  return (data as ReviewRow[]).map(rowToPublic);
}

export async function listAllApprovedReviews(
  limit = 50
): Promise<(PublicReview & { targetType: ReviewTargetType; targetId: string })[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`listAllApprovedReviews: ${error.message}`);
  }
  return (data as ReviewRow[]).map((r) => ({
    ...rowToPublic(r),
    targetType: r.target_type,
    targetId: r.target_id,
  }));
}

export async function getRatingStats(
  targetType: ReviewTargetType,
  targetId: string
): Promise<RatingStats> {
  if (!isSupabaseConfigured()) return { avg: 0, count: 0 };
  const sb = getSupabaseAdmin()!;

  const { data, error } = await sb
    .from("reviews")
    .select("rating")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "approved");

  if (error) {
    if (isMissingTableError(error)) return { avg: 0, count: 0 };
    throw new Error(`getRatingStats: ${error.message}`);
  }

  const rows = data as { rating: number }[];
  if (rows.length === 0) return { avg: 0, count: 0 };

  const sum = rows.reduce((s, r) => s + r.rating, 0);
  return {
    avg: Math.round((sum / rows.length) * 10) / 10,
    count: rows.length,
  };
}

export async function hasUserReviewed(
  userPhone: string,
  targetType: ReviewTargetType,
  targetId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const sb = getSupabaseAdmin()!;
  const { count, error } = await sb
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_phone", userPhone)
    .eq("target_type", targetType)
    .eq("target_id", targetId);
  if (error) {
    if (isMissingTableError(error)) return false;
    throw new Error(`hasUserReviewed: ${error.message}`);
  }
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export async function listReviewsForAdmin(
  status?: ReviewStatus | "all"
): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin()!;
  let q = sb
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(`listReviewsForAdmin: ${error.message}`);
  }
  return (data as ReviewRow[]).map(rowToReview);
}

export async function countPendingReviews(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const sb = getSupabaseAdmin()!;
  const { count, error } = await sb
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw new Error(`countPendingReviews: ${error.message}`);
  }
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Admin writes
// ---------------------------------------------------------------------------

export async function setReviewStatus(
  id: string,
  status: ReviewStatus,
  reviewer?: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb
    .from("reviews")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewer: reviewer ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(`setReviewStatus: ${error.message}`);
}

export async function deleteReview(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("База данных не подключена.");
  }
  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("reviews").delete().eq("id", id);
  if (error) throw new Error(`deleteReview: ${error.message}`);
}
