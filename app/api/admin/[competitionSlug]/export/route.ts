import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { exportCompetitionBackup } from "@/lib/store/file-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  const backup = await exportCompetitionBackup(competitionSlug);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${competitionSlug}-backup.json"`,
    },
  });
}
