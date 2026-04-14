import { randomUUID } from "node:crypto";

import { DEFAULT_INDIVIDUAL_EVENTS, DEFAULT_TEAM_EVENTS } from "@/lib/constants";
import type {
  Event,
  LegacyBackup,
  PartnerGroup,
  PlayerProfile,
  ResultEntry,
} from "@/lib/types";

type LegacyImportResult = {
  players: PlayerProfile[];
  events: Event[];
  partnerGroups: PartnerGroup[];
  resultsByEventId: Record<string, ResultEntry[]>;
  nowPlayingEventId: string | null;
};

export function transformLegacyBackup(
  backup: LegacyBackup,
  competitionId: string,
): LegacyImportResult {
  const sourcePlayers = Array.isArray(backup.players) ? backup.players : [];
  const playerIdMap = new Map<string, string>();

  const players: PlayerProfile[] = sourcePlayers.map((player, index) => {
    const id = randomUUID();
    playerIdMap.set(String(player.id ?? index), id);

    return {
      id,
      competitionId,
      name: player.name?.trim() || `Player ${index + 1}`,
      nickname: player.nick?.trim() || "",
      fact: player.fact?.trim() || "",
      height: String(player.height ?? "").trim(),
      weight: String(player.weight ?? "").trim(),
      vertical: String(player.vertical ?? "").trim(),
      forty: player.forty?.trim() || "",
      bench: String(player.bench ?? "").trim(),
      grip: String(player.grip ?? "").trim(),
      trashTalk: player.trash?.trim() || "",
      soreLoser: player.loser?.trim() || "",
      biggestThreat: player.threat?.trim() || "",
      weakness: player.weakness?.trim() || "",
      photoPath: player.photo ?? null,
      active: true,
      sortOrder: index,
    };
  });

  const individual = backup.individual?.length
    ? backup.individual
    : DEFAULT_INDIVIDUAL_EVENTS;
  const team = backup.team?.length ? backup.team : DEFAULT_TEAM_EVENTS;

  const events: Event[] = [...individual, ...team].map((name, index) => ({
    id: randomUUID(),
    competitionId,
    name,
    kind: index < individual.length ? "individual" : "team",
    orderIndex: index,
    status:
      backup.nowPlaying === name
        ? "live"
        : backup.scores?.[name] && Object.keys(backup.scores[name] ?? {}).length
          ? "completed"
          : "upcoming",
  }));

  const eventIdByName = new Map(events.map((event) => [event.name, event.id]));
  const nowPlayingEventId = backup.nowPlaying
    ? eventIdByName.get(backup.nowPlaying) ?? null
    : null;

  const partnerGroups: PartnerGroup[] = (backup.partners ?? []).map((group, index) => ({
    id: randomUUID(),
    groupNumber: index + 1,
    playerIds: group
      .map((legacyId) => playerIdMap.get(String(legacyId)))
      .filter((playerId): playerId is string => Boolean(playerId)),
  }));

  const resultsByEventId: Record<string, ResultEntry[]> = {};

  for (const [legacyEventName, placements] of Object.entries(backup.scores ?? {})) {
    const eventId = eventIdByName.get(legacyEventName);
    if (!eventId) {
      continue;
    }

    resultsByEventId[eventId] = Object.entries(placements)
      .map(([legacyPlayerId, placement]) => {
        const playerId = playerIdMap.get(String(legacyPlayerId));
        if (!playerId) {
          return null;
        }

        return {
          playerId,
          placement,
          points: 0,
        };
      })
      .filter((entry): entry is ResultEntry => Boolean(entry))
      .sort((left, right) => left.placement - right.placement);
  }

  return {
    players,
    events,
    partnerGroups,
    resultsByEventId,
    nowPlayingEventId,
  };
}
