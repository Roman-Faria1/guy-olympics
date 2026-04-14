import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { deleteEvent, reorderEvent, upsertEvent } from "@/lib/store/file-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await request.json();
  if (!payload?.name?.trim() || !payload?.kind) {
    return NextResponse.json({ error: "Event name and kind are required" }, { status: 400 });
  }

  await upsertEvent(competitionSlug, payload);
  return NextResponse.json({ ok: true });
}

export async function PUT(
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
    direction?: "up" | "down";
  };
  if (!payload.eventId || !payload.direction) {
    return NextResponse.json({ error: "eventId and direction are required" }, { status: 400 });
  }

  await reorderEvent(competitionSlug, payload.eventId, payload.direction);
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

  const { eventId } = (await request.json()) as { eventId?: string };
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  await deleteEvent(competitionSlug, eventId);
  return NextResponse.json({ ok: true });
}
