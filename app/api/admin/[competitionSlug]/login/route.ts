import { NextResponse } from "next/server";

import {
  clearAdminLoginFailures,
  getAdminLoginRateLimitStatus,
  recordAdminLoginFailure,
} from "@/lib/admin-rate-limit";
import { createAdminSession, verifyAdminPasscode } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const { passcode } = (await request.json()) as { passcode?: string };
  const rateLimitStatus = await getAdminLoginRateLimitStatus(competitionSlug, request);

  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${rateLimitStatus.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: rateLimitStatus.retryAfterSeconds
          ? {
              "Retry-After": String(rateLimitStatus.retryAfterSeconds),
            }
          : undefined,
      },
    );
  }

  if (!passcode || !(await verifyAdminPasscode(competitionSlug, passcode))) {
    const failureStatus = await recordAdminLoginFailure(competitionSlug, request);
    if (!failureStatus.allowed) {
      return NextResponse.json(
        {
          error: `Too many attempts. Try again in ${failureStatus.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: failureStatus.retryAfterSeconds
            ? {
                "Retry-After": String(failureStatus.retryAfterSeconds),
              }
            : undefined,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          failureStatus.remainingAttempts > 0
            ? `Invalid passcode. ${failureStatus.remainingAttempts} attempts remaining before cooldown.`
            : "Invalid passcode.",
      },
      { status: 401 },
    );
  }

  await clearAdminLoginFailures(competitionSlug, request);
  await createAdminSession(competitionSlug);
  return NextResponse.json({ ok: true });
}
