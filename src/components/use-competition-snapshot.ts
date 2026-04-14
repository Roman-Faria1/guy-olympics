"use client";

import { useEffect, useState } from "react";

import type { CompetitionSnapshot } from "@/lib/types";

export function useCompetitionSnapshot(
  competitionSlug: string,
  initialSnapshot: CompetitionSnapshot,
  intervalMs = 4000,
) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const response = await fetch(`/api/competition/${competitionSlug}/snapshot`, {
        cache: "no-store",
      });

      if (!response.ok || !active) {
        return;
      }

      const nextSnapshot = (await response.json()) as CompetitionSnapshot;
      if (active) {
        setSnapshot(nextSnapshot);
      }
    }

    const timer = window.setInterval(refresh, intervalMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [competitionSlug, intervalMs]);

  return [snapshot, setSnapshot] as const;
}
