import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { importLegacyBackup } from "@/lib/store/file-store";
import type { LegacyBackup } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = (await request.json()) as { backup?: object };
  if (!payload.backup) {
    return NextResponse.json({ error: "backup is required" }, { status: 400 });
  }

  await importLegacyBackup(competitionSlug, payload.backup as LegacyBackup);
  return NextResponse.json({ ok: true });
}
