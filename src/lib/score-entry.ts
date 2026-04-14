import type { Event, PartnerGroup, PlayerProfile } from "@/lib/types";

type PlacementRecord = {
  playerId: string;
  placement: number;
};

type ScoreUnit = {
  key: string;
  label: string;
  playerIds: string[];
};

export type ScoreValidationResult = {
  placements: PlacementRecord[];
  errors: string[];
  warnings: string[];
  invalidPlayerIds: string[];
  filledUnits: number;
  expectedUnits: number;
  unitLabel: "players" | "groups";
};

function countDuplicatePlacements(placements: PlacementRecord[]) {
  const counts = new Map<number, number>();
  for (const entry of placements) {
    counts.set(entry.placement, (counts.get(entry.placement) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([placement]) => placement)
    .sort((left, right) => left - right);
}

function buildTeamUnits(players: PlayerProfile[], partnerGroups: PartnerGroup[]): ScoreUnit[] {
  const activePlayers = players.filter((player) => player.active);
  const activePlayerIds = new Set(activePlayers.map((player) => player.id));
  const units = partnerGroups
    .map((group) => ({
      key: group.id,
      label: `Group ${group.groupNumber}`,
      playerIds: group.playerIds.filter((playerId) => activePlayerIds.has(playerId)),
    }))
    .filter((group) => group.playerIds.length > 0);

  const groupedPlayerIds = new Set(units.flatMap((group) => group.playerIds));
  const singles = activePlayers
    .filter((player) => !groupedPlayerIds.has(player.id))
    .map((player) => ({
      key: player.id,
      label: player.name,
      playerIds: [player.id],
    }));

  return [...units, ...singles];
}

function validatePlacementRecords({
  placements,
  players,
  event,
  partnerGroups,
}: {
  placements: PlacementRecord[];
  players: PlayerProfile[];
  event: Event;
  partnerGroups: PartnerGroup[];
}): ScoreValidationResult {
  const activePlayers = players.filter((player) => player.active);
  const activePlayerIds = new Set(activePlayers.map((player) => player.id));
  const errors: string[] = [];
  const warnings: string[] = [];
  const invalidPlayerIds = new Set<string>();
  const seenPlayers = new Set<string>();
  const normalized: PlacementRecord[] = [];

  for (const entry of placements) {
    if (!activePlayerIds.has(entry.playerId)) {
      errors.push("Only active players can receive placements.");
      invalidPlayerIds.add(entry.playerId);
      continue;
    }

    if (!Number.isInteger(entry.placement) || entry.placement < 1) {
      errors.push("Placements must be whole numbers greater than 0.");
      invalidPlayerIds.add(entry.playerId);
      continue;
    }

    if (seenPlayers.has(entry.playerId)) {
      errors.push("Each player can only be entered once per event.");
      invalidPlayerIds.add(entry.playerId);
      continue;
    }

    seenPlayers.add(entry.playerId);
    normalized.push(entry);
  }

  if (!normalized.length) {
    errors.push("Enter at least one placement before saving.");
  }

  if (event.kind === "team") {
    const units = buildTeamUnits(players, partnerGroups);
    let filledUnits = 0;
    const missingUnits: string[] = [];

    for (const unit of units) {
      const unitPlacements = normalized.filter((entry) => unit.playerIds.includes(entry.playerId));
      if (!unitPlacements.length) {
        missingUnits.push(unit.label);
        continue;
      }

      filledUnits += 1;
      const distinctPlacements = new Set(unitPlacements.map((entry) => entry.placement));
      if (distinctPlacements.size > 1) {
        errors.push(`${unit.label} has conflicting placements. Enter one matching finish for teammates.`);
        for (const playerId of unit.playerIds) {
          invalidPlayerIds.add(playerId);
        }
      }
    }

    if (missingUnits.length > 0) {
      warnings.push(
        `${missingUnits.length} ${missingUnits.length === 1 ? "group is" : "groups are"} still blank.`,
      );
    }

    return {
      placements: normalized,
      errors: [...new Set(errors)],
      warnings,
      invalidPlayerIds: [...invalidPlayerIds],
      filledUnits,
      expectedUnits: units.length,
      unitLabel: "groups",
    };
  }

  const missingPlayers = activePlayers.filter((player) => !seenPlayers.has(player.id));
  if (missingPlayers.length > 0) {
    warnings.push(
      `${missingPlayers.length} ${missingPlayers.length === 1 ? "player is" : "players are"} still blank.`,
    );
  }

  const tiedPlacements = countDuplicatePlacements(normalized);
  if (tiedPlacements.length > 0) {
    warnings.push(
      `Tie detected at ${tiedPlacements
        .map((placement) => `${placement}${placement === 1 ? "st" : placement === 2 ? "nd" : placement === 3 ? "rd" : "th"}`)
        .join(", ")} place.`,
    );
  }

  return {
    placements: normalized,
    errors: [...new Set(errors)],
    warnings,
    invalidPlayerIds: [...invalidPlayerIds],
    filledUnits: normalized.length,
    expectedUnits: activePlayers.length,
    unitLabel: "players",
  };
}

export function validateScoreInputs({
  scoreInputs,
  players,
  event,
  partnerGroups,
}: {
  scoreInputs: Record<string, string>;
  players: PlayerProfile[];
  event: Event | null;
  partnerGroups: PartnerGroup[];
}): ScoreValidationResult {
  if (!event) {
    return {
      placements: [],
      errors: ["Choose an event before saving scores."],
      warnings: [],
      invalidPlayerIds: [],
      filledUnits: 0,
      expectedUnits: 0,
      unitLabel: "players",
    };
  }

  const rawPlacements: PlacementRecord[] = [];
  const errors: string[] = [];
  const invalidPlayerIds = new Set<string>();

  for (const player of players.filter((entry) => entry.active)) {
    const rawValue = scoreInputs[player.id]?.trim() ?? "";
    if (!rawValue) {
      continue;
    }

    if (!/^\d+$/.test(rawValue)) {
      errors.push("Placements must be whole numbers greater than 0.");
      invalidPlayerIds.add(player.id);
      continue;
    }

    rawPlacements.push({
      playerId: player.id,
      placement: Number(rawValue),
    });
  }

  const result = validatePlacementRecords({
    placements: rawPlacements,
    players,
    event,
    partnerGroups,
  });

  return {
    ...result,
    errors: [...new Set([...errors, ...result.errors])],
    invalidPlayerIds: [...new Set([...invalidPlayerIds, ...result.invalidPlayerIds])],
  };
}

export function validateScorePlacements({
  placements,
  players,
  event,
  partnerGroups,
}: {
  placements: PlacementRecord[];
  players: PlayerProfile[];
  event: Event;
  partnerGroups: PartnerGroup[];
}) {
  return validatePlacementRecords({
    placements,
    players,
    event,
    partnerGroups,
  });
}
