import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { importCompetitionBackup } from "@/lib/store/file-store";
import type { AppBackup, LegacyBackup } from "@/lib/types";

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

  try {
    await importCompetitionBackup(competitionSlug, payload.backup as AppBackup | LegacyBackup);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 400 });
  }
}
