import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { deletePlayer, upsertPlayer } from "@/lib/store/file-store";

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
  if (!payload?.name?.trim()) {
    return NextResponse.json({ error: "Player name is required" }, { status: 400 });
  }

  await upsertPlayer(competitionSlug, payload);
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

  const { playerId } = (await request.json()) as { playerId?: string };
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  await deletePlayer(competitionSlug, playerId);
  return NextResponse.json({ ok: true });
}
