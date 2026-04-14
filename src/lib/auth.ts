import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getCompetitionBySlug } from "@/lib/store/file-store";

const COOKIE_NAME = "go_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  const configured = process.env.GO_ADMIN_SESSION_SECRET;
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("GO_ADMIN_SESSION_SECRET must be set in production");
  }

  return "local-dev-secret";
}

export function hashPasscode(passcode: string) {
  return createHash("sha256").update(passcode).digest("hex");
}

export function buildSessionValue(slug: string, passcodeHash: string, expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000) {
  const signature = createHmac("sha256", getSecret())
    .update(`${slug}:${passcodeHash}:${expiresAt}`)
    .digest("hex");

  return `${slug}.${expiresAt}.${signature}`;
}

export function isSessionValueValid(
  cookieValue: string,
  slug: string,
  passcodeHash: string,
  now = Date.now(),
) {
  const [cookieSlug, expiresAtRaw, actualSignature] = cookieValue.split(".");
  if (!cookieSlug || !expiresAtRaw || !actualSignature || cookieSlug !== slug) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return false;
  }

  const expected = buildSessionValue(slug, passcodeHash, expiresAt);
  const actualBuffer = Buffer.from(cookieValue);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function createAdminSession(slug: string) {
  const competition = await getCompetitionBySlug(slug);
  if (!competition) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, buildSessionValue(slug, competition.adminPasscodeHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated(slug: string) {
  const competition = await getCompetitionBySlug(slug);
  if (!competition) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieValue) {
    return false;
  }

  return isSessionValueValid(cookieValue, slug, competition.adminPasscodeHash);
}

export async function verifyAdminPasscode(slug: string, passcode: string) {
  const competition = await getCompetitionBySlug(slug);
  if (!competition) {
    return false;
  }

  return competition.adminPasscodeHash === hashPasscode(passcode);
}
