"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login as adminLogin, logout as adminLogout } from "./admin-auth";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from "./rate-limit";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const login = String(formData.get("login") || "").trim();
  const password = String(formData.get("password") || "");
  if (!login || !password) {
    return { error: "Введите логин и пароль" };
  }

  const rl = checkRateLimit(`admin-login:${login}`);
  if (!rl.allowed) {
    return {
      error: `Слишком много попыток. Попробуйте через ${rl.retryAfterSec} сек.`,
    };
  }

  const ok = await adminLogin(login, password);
  if (!ok) {
    recordFailedAttempt(`admin-login:${login}`);
    return { error: "Неверный логин или пароль" };
  }

  resetAttempts(`admin-login:${login}`);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await adminLogout();
  revalidatePath("/admin");
  redirect("/admin/Maksud");
}
