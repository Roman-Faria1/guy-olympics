import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { setLiveEvent } from "@/lib/store/file-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  const { eventId } = (await request.json()) as { eventId?: string | null };
  await setLiveEvent(competitionSlug, eventId ?? null);
  return NextResponse.json({ ok: true });
}
