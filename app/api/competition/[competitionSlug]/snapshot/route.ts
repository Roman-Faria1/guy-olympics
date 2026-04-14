import { NextResponse } from "next/server";

import { getCompetitionSnapshot } from "@/lib/store/file-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const snapshot = await getCompetitionSnapshot(competitionSlug);

  if (!snapshot) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
