"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login as adminLogin, logout as adminLogout } from "./admin-auth";

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
  const ok = await adminLogin(login, password);
  if (!ok) {
    return { error: "Неверный логин или пароль" };
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await adminLogout();
  revalidatePath("/admin");
  redirect("/admin/login");
}
