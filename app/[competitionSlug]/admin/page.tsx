import { notFound } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import { isAdminAuthenticated } from "@/lib/auth";
import { getCompetitionSnapshot } from "@/lib/store/file-store";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ competitionSlug: string }>;
}) {
  const { competitionSlug } = await params;
  const snapshot = await getCompetitionSnapshot(competitionSlug);

  if (!snapshot) {
    notFound();
  }

  const authenticated = await isAdminAuthenticated(competitionSlug);

  return (
    <AdminDashboard
      competitionSlug={competitionSlug}
      authenticated={authenticated}
      initialSnapshot={snapshot}
    />
  );
}
