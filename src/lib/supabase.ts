import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = process.env.GO_SUPABASE_STORAGE_BUCKET || "player-photos";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function hasSupabaseServerConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function hasSupabaseBrowserConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function getSupabaseStorageBucket() {
  return STORAGE_BUCKET;
}

export function createAdminSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
