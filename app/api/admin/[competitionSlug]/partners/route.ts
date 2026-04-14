import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api";
import { randomizePartners } from "@/lib/store/file-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ competitionSlug: string }> },
) {
  const { competitionSlug } = await params;
  const unauthorized = await requireAdmin(competitionSlug);
  if (unauthorized) {
    return unauthorized;
  }

  await randomizePartners(competitionSlug);
  return NextResponse.json({ ok: true });
}
