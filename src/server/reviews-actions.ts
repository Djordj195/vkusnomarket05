"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/server/admin-auth";
import {
  createReview,
  deleteReview,
  setReviewStatus,
  type ReviewTargetType,
} from "@/server/reviews-store";

export type SubmitReviewInput = {
  userPhone: string;
  userName: string;
  targetType: ReviewTargetType;
  targetId: string;
  orderId?: string;
  rating: number;
  comment: string;
};

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

export async function submitReviewAction(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  if (!input.userPhone) {
    return { ok: false, error: "Чтобы оставить отзыв, войдите по номеру телефона." };
  }
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Укажите рейтинг от 1 до 5 звёзд." };
  }
  if (input.comment.length > 2000) {
    return { ok: false, error: "Комментарий слишком длинный (до 2000 знаков)." };
  }

  const created = await createReview({
    userPhone: input.userPhone,
    userName: input.userName,
    targetType: input.targetType,
    targetId: input.targetId,
    orderId: input.orderId,
    rating: input.rating,
    comment: input.comment.trim(),
  });

  if (!created) {
    return {
      ok: false,
      error: "Вы уже оставляли отзыв на этот товар. Повторный отзыв невозможен.",
    };
  }

  // Revalidate relevant pages
  if (input.targetType === "product") {
    revalidatePath(`/product/${input.targetId}`);
  } else {
    revalidatePath(`/shop/${input.targetId}`);
  }
  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin moderation
// ---------------------------------------------------------------------------

async function ensureAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Не авторизован.");
  }
}

export async function approveReviewAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не указан id.");
  await setReviewStatus(id, "approved", "admin");
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function rejectReviewAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не указан id.");
  await setReviewStatus(id, "rejected", "admin");
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не указан id.");
  await deleteReview(id);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}
