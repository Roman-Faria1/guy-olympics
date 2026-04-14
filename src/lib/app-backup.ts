import type { AppBackup, Event, PartnerGroup, PlayerProfile, ResultEntry } from "@/lib/types";

type AppBackupImportResult = {
  competition: AppBackup["competition"];
  players: PlayerProfile[];
  events: Event[];
  partnerGroups: PartnerGroup[];
  resultsByEventId: Record<string, ResultEntry[]>;
  nowPlayingEventId: string | null;
};

export function isAppBackup(backup: unknown): backup is AppBackup {
  if (!backup || typeof backup !== "object") {
    return false;
  }

  const candidate = backup as Partial<AppBackup>;
  return (
    typeof candidate.version === "number" &&
    !!candidate.competition &&
    Array.isArray(candidate.players) &&
    Array.isArray(candidate.events) &&
    Array.isArray(candidate.partnerGroups) &&
    !!candidate.resultsByEventId &&
    typeof candidate.resultsByEventId === "object"
  );
}

export function transformAppBackup(
  backup: AppBackup,
  competitionId: string,
  slug: string,
): AppBackupImportResult {
  const activeEventIds = new Set(backup.events.map((event) => event.id));
  const resultsByEventId = Object.fromEntries(
    Object.entries(backup.resultsByEventId)
      .filter(([eventId]) => activeEventIds.has(eventId))
      .map(([eventId, entries]) => [
        eventId,
        entries
          .filter(
            (entry) =>
              typeof entry.playerId === "string" &&
              Number.isInteger(entry.placement) &&
              entry.placement > 0,
          )
          .map((entry) => ({
            playerId: entry.playerId,
            placement: entry.placement,
            points: entry.points,
          }))
          .sort((left, right) => left.placement - right.placement),
      ]),
  ) as Record<string, ResultEntry[]>;

  const events = backup.events.map((event) => ({
    ...event,
    competitionId,
  }));

  return {
    competition: {
      ...backup.competition,
      id: competitionId,
      slug,
    },
    players: backup.players.map((player, index) => ({
      ...player,
      competitionId,
      sortOrder: Number.isInteger(player.sortOrder) ? player.sortOrder : index,
      active: player.active ?? true,
    })),
    events,
    partnerGroups: backup.partnerGroups.map((group) => ({
      id: group.id,
      groupNumber: group.groupNumber,
      playerIds: group.playerIds.filter((playerId) => typeof playerId === "string"),
    })),
    resultsByEventId,
    nowPlayingEventId: events.find((event) => event.status === "live")?.id ?? null,
  };
}
