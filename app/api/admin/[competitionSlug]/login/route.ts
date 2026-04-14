import { NextResponse } from "next/server";

import { createAdminSession, verifyAdminPasscode } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const { passcode } = (await request.json()) as { passcode?: string };

  if (!passcode || !(await verifyAdminPasscode(competitionSlug, passcode))) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  await createAdminSession(competitionSlug);
  return NextResponse.json({ ok: true });
}
