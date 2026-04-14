import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { clearEventResults, saveEventResults } from "@/lib/store/file-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await request.json()) as {
    eventId?: string;
    placements?: Array<{ playerId: string; placement: number }>;
  };

  if (!payload.eventId || !Array.isArray(payload.placements)) {
    return NextResponse.json({ error: "eventId and placements are required" }, { status: 400 });
  }

  await saveEventResults(competitionSlug, payload.eventId, payload.placements);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await request.json()) as { eventId?: string };
  if (!payload.eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  await clearEventResults(competitionSlug, payload.eventId);
  return NextResponse.json({ ok: true });
}
