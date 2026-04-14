import type { Event, LeaderboardRow, PlayerProfile, ResultEntry } from "@/lib/types";
import { SCORE_POINTS } from "@/lib/constants";

export function pointsForPlacement(place: number) {
  if (place < 1) {
    return 0;
  }

  return SCORE_POINTS[place - 1] ?? 1;
}

export function buildResultsByEventId(
  events: Event[],
  rawResults: Record<string, Array<{ playerId: string; placement: number }>>,
) {
  const resultsByEventId: Record<string, ResultEntry[]> = {};

  for (const event of events) {
    resultsByEventId[event.id] = (rawResults[event.id] ?? [])
      .map((entry) => ({
        playerId: entry.playerId,
        placement: entry.placement,
        points: pointsForPlacement(entry.placement),
      }))
      .sort((a, b) => a.placement - b.placement);
  }

  return resultsByEventId;
}

export function buildLeaderboard(
  players: PlayerProfile[],
  events: Event[],
  resultsByEventId: Record<string, ResultEntry[]>,
): LeaderboardRow[] {
  const totals = new Map<string, number>();
  const breakdown = new Map<string, Record<string, number>>();

  for (const player of players.filter((item) => item.active)) {
    totals.set(player.id, 0);
    breakdown.set(player.id, {});
  }

  for (const event of events) {
    for (const result of resultsByEventId[event.id] ?? []) {
      if (!totals.has(result.playerId)) {
        continue;
      }

      totals.set(result.playerId, (totals.get(result.playerId) ?? 0) + result.points);
      breakdown.set(result.playerId, {
        ...(breakdown.get(result.playerId) ?? {}),
        [event.id]: result.points,
      });
    }
  }

  const eventLookup = new Map(events.map((event) => [event.id, event]));
  const rows = players
    .filter((player) => player.active)
    .map((player) => {
      const eventBreakdown = breakdown.get(player.id) ?? {};
      const bestEntry = Object.entries(eventBreakdown).sort((a, b) => b[1] - a[1])[0];

      return {
        playerId: player.id,
        rank: 0,
        totalPoints: totals.get(player.id) ?? 0,
        eventsPlayed: Object.keys(eventBreakdown).length,
        bestEvent: bestEntry ? eventLookup.get(bestEntry[0])?.name ?? null : null,
        bestEventPoints: bestEntry?.[1] ?? null,
        eventBreakdown,
      };
    })
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) {
        return right.totalPoints - left.totalPoints;
      }

      if (right.eventsPlayed !== left.eventsPlayed) {
        return right.eventsPlayed - left.eventsPlayed;
      }

      return left.playerId.localeCompare(right.playerId);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));

  return rows;
}
