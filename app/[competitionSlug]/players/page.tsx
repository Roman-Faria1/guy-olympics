import { notFound } from "next/navigation";

import { PlayersClient } from "@/components/players-client";
import { getCompetitionSnapshot } from "@/lib/store/file-store";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ competitionSlug: string }>;
}) {
  const { competitionSlug } = await params;
  const snapshot = await getCompetitionSnapshot(competitionSlug);

  if (!snapshot) {
    notFound();
  }

  return <PlayersClient competitionSlug={competitionSlug} initialSnapshot={snapshot} />;
}
