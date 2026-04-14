import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { validateScorePlacements } from "@/lib/score-entry";
import { clearEventResults, getCompetitionSnapshot, saveEventResults } from "@/lib/store/file-store";

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

  const snapshot = await getCompetitionSnapshot(competitionSlug);
  if (!snapshot) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const event = snapshot.events.find((entry) => entry.id === payload.eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const validation = validateScorePlacements({
    placements: payload.placements,
    players: snapshot.players,
    event,
    partnerGroups: snapshot.partnerGroups,
  });

  if (validation.errors.length > 0) {
    return NextResponse.json(
      { error: validation.errors[0], errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    await saveEventResults(competitionSlug, payload.eventId, validation.placements);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save scores" }, { status: 500 });
  }
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

  try {
    await clearEventResults(competitionSlug, payload.eventId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not clear scores" }, { status: 500 });
  }
}
