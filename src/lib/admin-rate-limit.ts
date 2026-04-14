import { createHash } from "node:crypto";

import { createAdminSupabaseClient, hasSupabaseServerConfig } from "@/lib/supabase";

const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type RateLimitRow = {
  competition_slug: string;
  key_hash: string;
  failed_count: number;
  first_failed_at: string;
  last_failed_at: string;
  blocked_until: string | null;
};

type LocalRateLimitState = {
  failedCount: number;
  firstFailedAt: number;
  lastFailedAt: number;
  blockedUntil: number | null;
};

export type LoginRateLimitStatus = {
  allowed: boolean;
  retryAfterSeconds: number | null;
  remainingAttempts: number;
};

const localRateLimitStore = new Map<string, LocalRateLimitState>();

function getRateLimitSecret() {
  return process.env.GO_ADMIN_SESSION_SECRET || "local-dev-secret";
}

function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function buildRateLimitKey(slug: string, request: Request) {
  const fingerprint = `${slug}:${getClientAddress(request)}`;
  return createHash("sha256")
    .update(`${getRateLimitSecret()}:${fingerprint}`)
    .digest("hex");
}

export function evaluateRateLimitState(
  state: LocalRateLimitState | null,
  now = Date.now(),
): LoginRateLimitStatus {
  if (!state) {
    return {
      allowed: true,
      retryAfterSeconds: null,
      remainingAttempts: MAX_FAILURES,
    };
  }

  if (state.blockedUntil && state.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
      remainingAttempts: 0,
    };
  }

  const isWindowExpired = now - state.firstFailedAt > WINDOW_MS;
  if (isWindowExpired) {
    return {
      allowed: true,
      retryAfterSeconds: null,
      remainingAttempts: MAX_FAILURES,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: null,
    remainingAttempts: Math.max(0, MAX_FAILURES - state.failedCount),
  };
}

export function applyFailureToRateLimit(
  state: LocalRateLimitState | null,
  now = Date.now(),
): LocalRateLimitState {
  if (!state || now - state.firstFailedAt > WINDOW_MS) {
    return {
      failedCount: 1,
      firstFailedAt: now,
      lastFailedAt: now,
      blockedUntil: null,
    };
  }

  const failedCount = state.failedCount + 1;
  return {
    failedCount,
    firstFailedAt: state.firstFailedAt,
    lastFailedAt: now,
    blockedUntil: failedCount >= MAX_FAILURES ? now + BLOCK_MS : null,
  };
}

async function getSupabaseRateLimitStatus(slug: string, request: Request) {
  const supabase = createAdminSupabaseClient();
  const keyHash = buildRateLimitKey(slug, request);
  const { data, error } = await supabase
    .from("admin_login_attempts")
    .select("competition_slug,key_hash,failed_count,first_failed_at,last_failed_at,blocked_until")
    .eq("competition_slug", slug)
    .eq("key_hash", keyHash)
    .maybeSingle<RateLimitRow>();

  if (error) {
    throw error;
  }

  return evaluateRateLimitState(
    data
      ? {
          failedCount: data.failed_count,
          firstFailedAt: new Date(data.first_failed_at).getTime(),
          lastFailedAt: new Date(data.last_failed_at).getTime(),
          blockedUntil: data.blocked_until ? new Date(data.blocked_until).getTime() : null,
        }
      : null,
  );
}

async function getLocalRateLimitStatus(slug: string, request: Request) {
  return evaluateRateLimitState(localRateLimitStore.get(buildRateLimitKey(slug, request)) ?? null);
}

export async function getAdminLoginRateLimitStatus(slug: string, request: Request) {
  if (hasSupabaseServerConfig()) {
    return getSupabaseRateLimitStatus(slug, request);
  }

  return getLocalRateLimitStatus(slug, request);
}

async function recordSupabaseFailure(slug: string, request: Request) {
  const supabase = createAdminSupabaseClient();
  const keyHash = buildRateLimitKey(slug, request);
  const { data, error } = await supabase
    .from("admin_login_attempts")
    .select("competition_slug,key_hash,failed_count,first_failed_at,last_failed_at,blocked_until")
    .eq("competition_slug", slug)
    .eq("key_hash", keyHash)
    .maybeSingle<RateLimitRow>();

  if (error) {
    throw error;
  }

  const next = applyFailureToRateLimit(
    data
      ? {
          failedCount: data.failed_count,
          firstFailedAt: new Date(data.first_failed_at).getTime(),
          lastFailedAt: new Date(data.last_failed_at).getTime(),
          blockedUntil: data.blocked_until ? new Date(data.blocked_until).getTime() : null,
        }
      : null,
  );

  const { error: upsertError } = await supabase.from("admin_login_attempts").upsert(
    {
      competition_slug: slug,
      key_hash: keyHash,
      failed_count: next.failedCount,
      first_failed_at: new Date(next.firstFailedAt).toISOString(),
      last_failed_at: new Date(next.lastFailedAt).toISOString(),
      blocked_until: next.blockedUntil ? new Date(next.blockedUntil).toISOString() : null,
    },
    {
      onConflict: "competition_slug,key_hash",
    },
  );

  if (upsertError) {
    throw upsertError;
  }

  return evaluateRateLimitState(next);
}

async function recordLocalFailure(slug: string, request: Request) {
  const key = buildRateLimitKey(slug, request);
  const next = applyFailureToRateLimit(localRateLimitStore.get(key) ?? null);
  localRateLimitStore.set(key, next);
  return evaluateRateLimitState(next);
}

export async function recordAdminLoginFailure(slug: string, request: Request) {
  if (hasSupabaseServerConfig()) {
    return recordSupabaseFailure(slug, request);
  }

  return recordLocalFailure(slug, request);
}

async function clearSupabaseFailures(slug: string, request: Request) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("admin_login_attempts")
    .delete()
    .eq("competition_slug", slug)
    .eq("key_hash", buildRateLimitKey(slug, request));

  if (error) {
    throw error;
  }
}

async function clearLocalFailures(slug: string, request: Request) {
  localRateLimitStore.delete(buildRateLimitKey(slug, request));
}

export async function clearAdminLoginFailures(slug: string, request: Request) {
  if (hasSupabaseServerConfig()) {
    return clearSupabaseFailures(slug, request);
  }

  return clearLocalFailures(slug, request);
}
