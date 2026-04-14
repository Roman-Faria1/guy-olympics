import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getCompetitionBySlug } from "@/lib/store/file-store";

const COOKIE_NAME = "go_admin_session";

function getSecret() {
  return process.env.GO_ADMIN_SESSION_SECRET || "local-dev-secret";
}

export function hashPasscode(passcode: string) {
  return createHash("sha256").update(passcode).digest("hex");
}

export function buildSessionValue(slug: string, passcodeHash: string) {
  const signature = createHmac("sha256", getSecret())
    .update(`${slug}:${passcodeHash}`)
    .digest("hex");

  return `${slug}.${signature}`;
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
    maxAge: 60 * 60 * 12,
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
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

  const expected = buildSessionValue(slug, competition.adminPasscodeHash);
  const actualBuffer = Buffer.from(cookieValue);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function verifyAdminPasscode(slug: string, passcode: string) {
  const competition = await getCompetitionBySlug(slug);
  if (!competition) {
    return false;
  }

  return competition.adminPasscodeHash === hashPasscode(passcode);
}
