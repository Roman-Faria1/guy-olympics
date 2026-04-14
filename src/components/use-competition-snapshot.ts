"use client";

import { useEffect, useRef, useState } from "react";

import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from "@/lib/supabase";
import type { CompetitionSnapshot } from "@/lib/types";

export function useCompetitionSnapshot(
  competitionSlug: string,
  initialSnapshot: CompetitionSnapshot,
  intervalMs = 4000,
) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const refreshTimeoutRef = useRef<number | null>(null);

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

    const timer = window.setInterval(() => {
      if (!active) {
        return;
      }

      void refresh();
    }, intervalMs);

    return () => {
      active = false;
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      window.clearInterval(timer);
    };
  }, [competitionSlug, intervalMs]);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) {
      return undefined;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      return undefined;
    }

    function scheduleRefresh() {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        refreshTimeoutRef.current = null;

        const response = await fetch(`/api/competition/${competitionSlug}/snapshot`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const nextSnapshot = (await response.json()) as CompetitionSnapshot;
        setSnapshot(nextSnapshot);
      }, 180);
    }

    const channel = supabase
      .channel(`competition-${competitionSlug}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "competitions",
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partner_groups",
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partner_group_members",
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "results",
        },
        () => scheduleRefresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [competitionSlug]);

  return [snapshot, setSnapshot] as const;
}
