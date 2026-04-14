import { notFound } from "next/navigation";

import { LiveBoardClient } from "@/components/live-board-client";
import { getCompetitionSnapshot } from "@/lib/store/file-store";

export const dynamic = "force-dynamic";

export default async function LivePage({
  params,
}: {
  params: Promise<{ competitionSlug: string }>;
}) {
  const { competitionSlug } = await params;
  const snapshot = await getCompetitionSnapshot(competitionSlug);

  if (!snapshot) {
    notFound();
  }

  return <LiveBoardClient competitionSlug={competitionSlug} initialSnapshot={snapshot} />;
}
