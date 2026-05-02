import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service_role key.
 *
 * IMPORTANT: this client bypasses Row Level Security. It must NEVER be
 * imported from a client component. Use it only inside server actions,
 * route handlers, and other server-side modules.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return null;
  }

  cached = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * `true` once the deploy has both Supabase URL and service-role key configured.
 * Used as a feature flag while migrating stores from in-memory to Supabase.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseAdmin() !== null;
}
