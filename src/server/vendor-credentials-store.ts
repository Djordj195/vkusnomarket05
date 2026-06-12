import "server-only";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type VendorCredentials = {
  id: string;
  vendorId: string;
  login: string;
  createdAt: string;
  updatedAt: string;
};

type CredentialsRow = {
  id: string;
  vendor_id: string;
  login: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

function rowToCredentials(r: CredentialsRow): VendorCredentials {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    login: r.login,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function getCredentialsByVendorId(
  vendorId: string
): Promise<VendorCredentials | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("vendor_credentials")
    .select("id, vendor_id, login, password_hash, created_at, updated_at")
    .eq("vendor_id", vendorId)
    .maybeSingle();
  if (error) {
    if (error.message.includes("does not exist")) return null;
    throw new Error(`getCredentialsByVendorId: ${error.message}`);
  }
  return data ? rowToCredentials(data as CredentialsRow) : null;
}

export async function getCredentialsByLogin(
  login: string
): Promise<{ vendorId: string; passwordHash: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("vendor_credentials")
    .select("vendor_id, password_hash")
    .eq("login", login)
    .maybeSingle();
  if (error) {
    if (error.message.includes("does not exist")) return null;
    throw new Error(`getCredentialsByLogin: ${error.message}`);
  }
  if (!data) return null;
  return {
    vendorId: (data as { vendor_id: string; password_hash: string }).vendor_id,
    passwordHash: (data as { vendor_id: string; password_hash: string })
      .password_hash,
  };
}

export async function createCredentials(
  vendorId: string,
  login: string,
  password: string
): Promise<VendorCredentials> {
  if (!isSupabaseConfigured()) {
    throw new Error("createCredentials: Supabase не настроен.");
  }
  const passwordHash = await hashPassword(password);
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("vendor_credentials")
    .insert({
      vendor_id: vendorId,
      login,
      password_hash: passwordHash,
    })
    .select("id, vendor_id, login, password_hash, created_at, updated_at")
    .single();
  if (error) {
    if (error.message.includes("vendor_credentials_login_unique")) {
      throw new Error("Этот логин уже занят. Выберите другой.");
    }
    if (error.message.includes("vendor_credentials_vendor_unique")) {
      throw new Error("Учётные данные для этого продавца уже существуют.");
    }
    throw new Error(`createCredentials: ${error.message}`);
  }
  return rowToCredentials(data as CredentialsRow);
}

export async function updatePassword(
  vendorId: string,
  newPassword: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("updatePassword: Supabase не настроен.");
  }
  const passwordHash = await hashPassword(newPassword);
  const sb = getSupabaseAdmin()!;
  const { error } = await sb
    .from("vendor_credentials")
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq("vendor_id", vendorId);
  if (error) throw new Error(`updatePassword: ${error.message}`);
}

export async function isLoginAvailable(login: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  const sb = getSupabaseAdmin()!;
  const { data, error } = await sb
    .from("vendor_credentials")
    .select("id")
    .eq("login", login)
    .maybeSingle();
  if (error) {
    if (error.message.includes("does not exist")) return true;
    throw new Error(`isLoginAvailable: ${error.message}`);
  }
  return !data;
}
