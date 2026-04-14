import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

import {
  DEFAULT_INDIVIDUAL_EVENTS,
  DEFAULT_TEAM_EVENTS,
  DEMO_COMPETITION_SLUG,
  DEMO_ADMIN_PASSCODE,
} from "@/lib/constants";
import { transformLegacyBackup } from "@/lib/legacy-import";
import { buildLeaderboard, buildResultsByEventId } from "@/lib/scoring";
import type {
  AppBackup,
  CompetitionRecord,
  CompetitionSnapshot,
  DatabaseState,
  Event,
  EventStatus,
  LegacyBackup,
  PartnerGroup,
  PlayerProfile,
  ResultRecord,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "demo-db.json");

function timestamp() {
  return new Date().toISOString();
}

function hashPasscode(passcode: string) {
  return createHash("sha256").update(passcode).digest("hex");
}

function createSeedCompetition(): CompetitionRecord {
  const now = timestamp();

  return {
    id: randomUUID(),
    slug: DEMO_COMPETITION_SLUG,
    name: "Guy Olympics",
    subtitle: "Summer 2026 · Beer Olympics Control Room",
    status: "setup",
    adminPasscodeHash: hashPasscode(process.env.GO_DEMO_ADMIN_PASSCODE || DEMO_ADMIN_PASSCODE),
    createdAt: now,
    updatedAt: now,
  };
}

function createSeedData(): DatabaseState {
  const competition = createSeedCompetition();
  const events: Event[] = [...DEFAULT_INDIVIDUAL_EVENTS, ...DEFAULT_TEAM_EVENTS].map(
    (name, index) => ({
      id: randomUUID(),
      competitionId: competition.id,
      name,
      kind: index < DEFAULT_INDIVIDUAL_EVENTS.length ? "individual" : "team",
      orderIndex: index,
      status: "upcoming",
    }),
  );

  return {
    competitions: [competition],
    players: [],
    events,
    partnerGroups: [],
    partnerGroupMembers: [],
    results: [],
  };
}

async function ensureDbFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(createSeedData(), null, 2), "utf8");
  }
}

async function readDb(): Promise<DatabaseState> {
  await ensureDbFile();
  const raw = await readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as DatabaseState;
}

async function writeDb(db: DatabaseState) {
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

function sortEvents(events: Event[]) {
  return [...events].sort((left, right) => left.orderIndex - right.orderIndex);
}

function buildPartnerGroups(db: DatabaseState, competitionId: string): PartnerGroup[] {
  return db.partnerGroups
    .filter((group) => group.competitionId === competitionId)
    .sort((left, right) => left.groupNumber - right.groupNumber)
    .map((group) => ({
      id: group.id,
      groupNumber: group.groupNumber,
      playerIds: db.partnerGroupMembers
        .filter((member) => member.partnerGroupId === group.id)
        .sort((left, right) => left.slot - right.slot)
        .map((member) => member.playerId),
    }));
}

function buildRawResultsByEventId(results: ResultRecord[], events: Event[]) {
  return Object.fromEntries(
    events.map((event) => [
      event.id,
      results
        .filter((result) => result.eventId === event.id)
        .map((result) => ({
          playerId: result.playerId,
          placement: result.placement,
        })),
    ]),
  );
}

function updateCompetitionTimestamp(db: DatabaseState, competitionId: string) {
  db.competitions = db.competitions.map((competition) =>
    competition.id === competitionId
      ? {
          ...competition,
          updatedAt: timestamp(),
        }
      : competition,
  );
}

function setSingleLiveEvent(events: Event[], liveEventId: string | null) {
  const resultMap = new Map<string, EventStatus>();
  for (const event of events) {
    const nextStatus: EventStatus =
      liveEventId && event.id === liveEventId
        ? "live"
        : event.status === "completed"
          ? "completed"
          : "upcoming";
    resultMap.set(event.id, nextStatus);
  }

  return events.map((event) => ({
    ...event,
    status: resultMap.get(event.id) ?? event.status,
  }));
}

export async function listCompetitions() {
  const db = await readDb();
  return db.competitions.map((competition) => ({
    id: competition.id,
    slug: competition.slug,
    name: competition.name,
    subtitle: competition.subtitle,
    status: competition.status,
    createdAt: competition.createdAt,
    updatedAt: competition.updatedAt,
  }));
}

export async function getCompetitionBySlug(slug: string) {
  const db = await readDb();
  return db.competitions.find((competition) => competition.slug === slug) ?? null;
}

export async function getCompetitionSnapshot(slug: string): Promise<CompetitionSnapshot | null> {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    return null;
  }

  const players = db.players
    .filter((player) => player.competitionId === competition.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const events = sortEvents(
    db.events.filter((event) => event.competitionId === competition.id),
  );
  const partnerGroups = buildPartnerGroups(db, competition.id);
  const rawResultsByEventId = buildRawResultsByEventId(
    db.results.filter((result) =>
      events.some((event) => event.id === result.eventId),
    ),
    events,
  );
  const resultsByEventId = buildResultsByEventId(events, rawResultsByEventId);
  const leaderboard = buildLeaderboard(players, events, resultsByEventId);
  const liveEvent = events.find((event) => event.status === "live") ?? null;

  return {
    competition: {
      id: competition.id,
      slug: competition.slug,
      name: competition.name,
      subtitle: competition.subtitle,
      status: competition.status,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
    },
    players,
    events,
    partnerGroups,
    resultsByEventId,
    leaderboard,
    broadcast: {
      nowPlayingEventId: liveEvent?.id ?? null,
      completedEvents: events.filter((event) => event.status === "completed").length,
      totalEvents: events.length,
      leaderboard,
    },
  };
}

export async function upsertPlayer(
  slug: string,
  payload: Partial<PlayerProfile> & Pick<PlayerProfile, "name">,
) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const existing = payload.id
    ? db.players.find(
        (player) =>
          player.id === payload.id && player.competitionId === competition.id,
      )
    : null;

  if (existing) {
    Object.assign(existing, {
      ...existing,
      ...payload,
      name: payload.name.trim(),
      competitionId: competition.id,
    });
  } else {
    db.players.push({
      id: randomUUID(),
      competitionId: competition.id,
      name: payload.name.trim(),
      nickname: payload.nickname ?? "",
      fact: payload.fact ?? "",
      height: payload.height ?? "",
      weight: payload.weight ?? "",
      vertical: payload.vertical ?? "",
      forty: payload.forty ?? "",
      bench: payload.bench ?? "",
      grip: payload.grip ?? "",
      trashTalk: payload.trashTalk ?? "",
      soreLoser: payload.soreLoser ?? "",
      biggestThreat: payload.biggestThreat ?? "",
      weakness: payload.weakness ?? "",
      photoPath: payload.photoPath ?? null,
      active: payload.active ?? true,
      sortOrder:
        db.players.filter((player) => player.competitionId === competition.id).length,
    });
  }

  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function deletePlayer(slug: string, playerId: string) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  db.players = db.players.map((player) =>
    player.id === playerId && player.competitionId === competition.id
      ? {
          ...player,
          active: false,
        }
      : player,
  );

  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function upsertEvent(
  slug: string,
  payload: Partial<Event> & Pick<Event, "name" | "kind">,
) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const competitionEvents = db.events.filter((event) => event.competitionId === competition.id);
  const existing = payload.id
    ? competitionEvents.find((event) => event.id === payload.id)
    : null;

  if (existing) {
    existing.name = payload.name.trim();
    existing.kind = payload.kind;
    existing.orderIndex = payload.orderIndex ?? existing.orderIndex;
    existing.status = payload.status ?? existing.status;
  } else {
    db.events.push({
      id: randomUUID(),
      competitionId: competition.id,
      name: payload.name.trim(),
      kind: payload.kind,
      orderIndex:
        payload.orderIndex ??
        Math.max(-1, ...competitionEvents.map((event) => event.orderIndex)) + 1,
      status: "upcoming",
    });
  }

  db.events = sortEvents(db.events);
  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function reorderEvent(
  slug: string,
  eventId: string,
  direction: "up" | "down",
) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const competitionEvents = sortEvents(
    db.events.filter((event) => event.competitionId === competition.id),
  );
  const index = competitionEvents.findIndex((event) => event.id === eventId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= competitionEvents.length) {
    return;
  }

  const current = competitionEvents[index];
  const target = competitionEvents[swapIndex];
  const originalOrder = current.orderIndex;
  current.orderIndex = target.orderIndex;
  target.orderIndex = originalOrder;

  db.events = db.events.map((event) => {
    if (event.id === current.id) {
      return current;
    }

    if (event.id === target.id) {
      return target;
    }

    return event;
  });

  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function deleteEvent(slug: string, eventId: string) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  db.events = db.events.filter((event) => event.id !== eventId);
  db.results = db.results.filter((result) => result.eventId !== eventId);

  db.events
    .filter((event) => event.competitionId === competition.id)
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .forEach((event, index) => {
      event.orderIndex = index;
    });

  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temporary = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = temporary;
  }
  return copy;
}

export async function randomizePartners(slug: string) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const activePlayers = shuffle(
    db.players.filter((player) => player.competitionId === competition.id && player.active),
  );

  const existingGroupIds = new Set(
    db.partnerGroups
      .filter((group) => group.competitionId === competition.id)
      .map((group) => group.id),
  );
  db.partnerGroupMembers = db.partnerGroupMembers.filter(
    (member) => !existingGroupIds.has(member.partnerGroupId),
  );
  db.partnerGroups = db.partnerGroups.filter((group) => group.competitionId !== competition.id);

  const nextGroups: PartnerGroup[] = [];
  for (let index = 0; index < activePlayers.length; index += 2) {
    const groupPlayers = activePlayers.slice(index, index + 2).map((player) => player.id);
    nextGroups.push({
      id: randomUUID(),
      groupNumber: nextGroups.length + 1,
      playerIds: groupPlayers,
    });
  }

  if (activePlayers.length % 2 !== 0 && nextGroups.length > 0) {
    const leftover = activePlayers[activePlayers.length - 1]?.id;
    const lastGroup = nextGroups[nextGroups.length - 1];
    if (leftover && !lastGroup.playerIds.includes(leftover)) {
      lastGroup.playerIds.push(leftover);
    }
  }

  db.partnerGroups.push(
    ...nextGroups.map((group) => ({
      id: group.id,
      competitionId: competition.id,
      groupNumber: group.groupNumber,
    })),
  );
  db.partnerGroupMembers.push(
    ...nextGroups.flatMap((group) =>
      group.playerIds.map((playerId, index) => ({
        partnerGroupId: group.id,
        playerId,
        slot: index,
      })),
    ),
  );

  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function saveEventResults(
  slug: string,
  eventId: string,
  placements: Array<{ playerId: string; placement: number }>,
) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  const event = db.events.find((item) => item.id === eventId);
  if (!competition || !event || event.competitionId !== competition.id) {
    throw new Error("Event not found");
  }

  db.results = db.results.filter((result) => result.eventId !== eventId);
  const nextPlacements = placements.filter((entry) => entry.placement > 0);

  if (event.kind === "team") {
    const groups = buildPartnerGroups(db, competition.id);
    for (const group of groups) {
      const groupPlacements = nextPlacements.filter((entry) =>
        group.playerIds.includes(entry.playerId),
      );
      if (!groupPlacements.length) {
        continue;
      }

      const bestPlacement = Math.min(...groupPlacements.map((entry) => entry.placement));
      for (const playerId of group.playerIds) {
        const existingEntry = nextPlacements.find((entry) => entry.playerId === playerId);
        if (existingEntry) {
          existingEntry.placement = bestPlacement;
        } else {
          nextPlacements.push({ playerId, placement: bestPlacement });
        }
      }
    }
  }

  db.results.push(
    ...nextPlacements.map((entry) => ({
      id: randomUUID(),
      eventId,
      playerId: entry.playerId,
      placement: entry.placement,
    })),
  );

  db.events = setSingleLiveEvent(
    db.events.map((entry) =>
      entry.id === eventId
        ? {
            ...entry,
            status: nextPlacements.length ? "completed" : "upcoming",
          }
        : entry,
    ),
    null,
  );

  db.competitions = db.competitions.map((entry) =>
    entry.id === competition.id
      ? {
          ...entry,
          status: "live",
        }
      : entry,
  );

  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function clearEventResults(slug: string, eventId: string) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  db.results = db.results.filter((result) => result.eventId !== eventId);
  db.events = db.events.map((event) =>
    event.id === eventId
      ? {
          ...event,
          status: "upcoming",
        }
      : event,
  );

  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function setLiveEvent(slug: string, eventId: string | null) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  db.events = setSingleLiveEvent(db.events, eventId);
  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}

export async function exportCompetitionBackup(slug: string): Promise<AppBackup> {
  const snapshot = await getCompetitionSnapshot(slug);
  if (!snapshot) {
    throw new Error("Competition not found");
  }

  return {
    version: 3,
    exportedAt: timestamp(),
    competition: snapshot.competition,
    players: snapshot.players,
    events: snapshot.events,
    partnerGroups: snapshot.partnerGroups,
    resultsByEventId: snapshot.resultsByEventId,
  };
}

export async function importLegacyBackup(slug: string, backup: LegacyBackup) {
  const db = await readDb();
  const competition = db.competitions.find((item) => item.slug === slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const transformed = transformLegacyBackup(backup, competition.id);
  const eventIds = new Set(
    db.events.filter((event) => event.competitionId === competition.id).map((event) => event.id),
  );
  const playerIds = new Set(
    db.players.filter((player) => player.competitionId === competition.id).map((player) => player.id),
  );

  db.players = db.players.filter((player) => !playerIds.has(player.id));
  db.events = db.events.filter((event) => !eventIds.has(event.id));
  db.results = db.results.filter((result) => !eventIds.has(result.eventId));
  const existingGroupIds = new Set(
    db.partnerGroups
      .filter((group) => group.competitionId === competition.id)
      .map((group) => group.id),
  );
  db.partnerGroupMembers = db.partnerGroupMembers.filter(
    (member) => !existingGroupIds.has(member.partnerGroupId),
  );
  db.partnerGroups = db.partnerGroups.filter((group) => group.competitionId !== competition.id);

  db.players.push(...transformed.players);
  db.events.push(...transformed.events);
  db.partnerGroups.push(
    ...transformed.partnerGroups.map((group) => ({
      id: group.id,
      competitionId: competition.id,
      groupNumber: group.groupNumber,
    })),
  );
  db.partnerGroupMembers.push(
    ...transformed.partnerGroups.flatMap((group) =>
      group.playerIds.map((playerId, slot) => ({
        partnerGroupId: group.id,
        playerId,
        slot,
      })),
    ),
  );
  db.results.push(
    ...Object.entries(transformed.resultsByEventId).flatMap(([eventId, entries]) =>
      entries.map((entry) => ({
        id: randomUUID(),
        eventId,
        playerId: entry.playerId,
        placement: entry.placement,
      })),
    ),
  );

  db.events = setSingleLiveEvent(db.events, transformed.nowPlayingEventId);
  updateCompetitionTimestamp(db, competition.id);
  await writeDb(db);
}
