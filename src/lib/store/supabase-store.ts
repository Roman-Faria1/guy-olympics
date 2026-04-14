import { createHash, randomUUID } from "node:crypto";

import { isAppBackup, transformAppBackup } from "@/lib/app-backup";
import {
  DEFAULT_INDIVIDUAL_EVENTS,
  DEFAULT_TEAM_EVENTS,
  DEMO_ADMIN_PASSCODE,
  DEMO_COMPETITION_SLUG,
} from "@/lib/constants";
import { transformLegacyBackup } from "@/lib/legacy-import";
import { buildLeaderboard, buildResultsByEventId } from "@/lib/scoring";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type {
  AppBackup,
  CompetitionRecord,
  CompetitionSnapshot,
  Event,
  EventStatus,
  LegacyBackup,
  PartnerGroup,
  PlayerProfile,
  ResultEntry,
} from "@/lib/types";

type CompetitionRow = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  status: CompetitionRecord["status"];
  admin_passcode_hash: string;
  created_at: string;
  updated_at: string;
};

type PlayerRow = {
  id: string;
  competition_id: string;
  name: string;
  nickname: string;
  fact: string;
  height: string;
  weight: string;
  vertical: string;
  forty: string;
  bench: string;
  grip: string;
  trash_talk: string;
  sore_loser: string;
  biggest_threat: string;
  weakness: string;
  photo_path: string | null;
  active: boolean;
  sort_order: number;
};

type EventRow = {
  id: string;
  competition_id: string;
  name: string;
  kind: Event["kind"];
  order_index: number;
  status: Event["status"];
};

type PartnerGroupRow = {
  id: string;
  competition_id: string;
  group_number: number;
};

type PartnerGroupMemberRow = {
  partner_group_id: string;
  player_id: string;
  slot: number;
};

type ResultRow = {
  id: string;
  event_id: string;
  player_id: string;
  placement: number;
};

function timestamp() {
  return new Date().toISOString();
}

function hashPasscode(passcode: string) {
  return createHash("sha256").update(passcode).digest("hex");
}

function mapCompetitionRow(row: CompetitionRow): CompetitionRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    status: row.status,
    adminPasscodeHash: row.admin_passcode_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPlayerRow(row: PlayerRow): PlayerProfile {
  return {
    id: row.id,
    competitionId: row.competition_id,
    name: row.name,
    nickname: row.nickname,
    fact: row.fact,
    height: row.height,
    weight: row.weight,
    vertical: row.vertical,
    forty: row.forty,
    bench: row.bench,
    grip: row.grip,
    trashTalk: row.trash_talk,
    soreLoser: row.sore_loser,
    biggestThreat: row.biggest_threat,
    weakness: row.weakness,
    photoPath: row.photo_path,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

function mapEventRow(row: EventRow): Event {
  return {
    id: row.id,
    competitionId: row.competition_id,
    name: row.name,
    kind: row.kind,
    orderIndex: row.order_index,
    status: row.status,
  };
}

function buildPartnerGroups(
  groups: PartnerGroupRow[],
  members: PartnerGroupMemberRow[],
): PartnerGroup[] {
  return [...groups]
    .sort((left, right) => left.group_number - right.group_number)
    .map((group) => ({
      id: group.id,
      groupNumber: group.group_number,
      playerIds: members
        .filter((member) => member.partner_group_id === group.id)
        .sort((left, right) => left.slot - right.slot)
        .map((member) => member.player_id),
    }));
}

function buildResultsMap(events: Event[], results: ResultRow[]) {
  return Object.fromEntries(
    events.map((event) => [
      event.id,
      results
        .filter((result) => result.event_id === event.id)
        .map((result) => ({
          playerId: result.player_id,
          placement: result.placement,
        })),
    ]),
  );
}

async function ensureSeedCompetition() {
  const supabase = createAdminSupabaseClient();
  const { data: existing } = await supabase
    .from("competitions")
    .select("*")
    .eq("slug", DEMO_COMPETITION_SLUG)
    .maybeSingle<CompetitionRow>();

  if (existing) {
    return mapCompetitionRow(existing);
  }

  const now = timestamp();
  const competitionId = randomUUID();
  const { error: competitionError } = await supabase.from("competitions").insert({
    id: competitionId,
    slug: DEMO_COMPETITION_SLUG,
    name: "Guy Olympics",
    subtitle: "Summer 2026 · Beer Olympics Control Room",
    status: "setup",
    admin_passcode_hash: hashPasscode(process.env.GO_DEMO_ADMIN_PASSCODE || DEMO_ADMIN_PASSCODE),
    created_at: now,
    updated_at: now,
  });

  if (competitionError) {
    throw competitionError;
  }

  const defaultEvents = [...DEFAULT_INDIVIDUAL_EVENTS, ...DEFAULT_TEAM_EVENTS].map((name, index) => ({
    id: randomUUID(),
    competition_id: competitionId,
    name,
    kind: index < DEFAULT_INDIVIDUAL_EVENTS.length ? "individual" : "team",
    order_index: index,
    status: "upcoming",
  }));

  const { error: eventsError } = await supabase.from("events").insert(defaultEvents);
  if (eventsError) {
    throw eventsError;
  }

  return {
    id: competitionId,
    slug: DEMO_COMPETITION_SLUG,
    name: "Guy Olympics",
    subtitle: "Summer 2026 · Beer Olympics Control Room",
    status: "setup",
    adminPasscodeHash: hashPasscode(process.env.GO_DEMO_ADMIN_PASSCODE || DEMO_ADMIN_PASSCODE),
    createdAt: now,
    updatedAt: now,
  };
}

async function getCompetitionRowBySlug(slug: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("competitions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<CompetitionRow>();

  if (data) {
    return mapCompetitionRow(data);
  }

  if (slug === DEMO_COMPETITION_SLUG) {
    return ensureSeedCompetition();
  }

  return null;
}

async function updateCompetitionTimestamp(competitionId: string, status?: CompetitionRecord["status"]) {
  const supabase = createAdminSupabaseClient();
  const payload: { updated_at: string; status?: CompetitionRecord["status"] } = {
    updated_at: timestamp(),
  };

  if (status) {
    payload.status = status;
  }

  const { error } = await supabase
    .from("competitions")
    .update(payload)
    .eq("id", competitionId);

  if (error) {
    throw error;
  }
}

async function getCompetitionContext(slug: string) {
  const competition = await getCompetitionRowBySlug(slug);
  if (!competition) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const [{ data: players }, { data: events }, { data: groups }, { data: members }] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("competition_id", competition.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .eq("competition_id", competition.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("partner_groups")
      .select("*")
      .eq("competition_id", competition.id)
      .order("group_number", { ascending: true }),
    supabase.from("partner_group_members").select("*"),
  ]);

  const mappedEvents = (events ?? []).map((row) => mapEventRow(row as EventRow));
  const eventIds = mappedEvents.map((event) => event.id);
  const { data: results } = eventIds.length
    ? await supabase.from("results").select("*").in("event_id", eventIds)
    : { data: [] as ResultRow[] };

  return {
    competition,
    players: (players ?? []).map((row) => mapPlayerRow(row as PlayerRow)),
    events: mappedEvents,
    partnerGroups: buildPartnerGroups(
      (groups ?? []) as PartnerGroupRow[],
      ((members ?? []) as PartnerGroupMemberRow[]).filter((member) =>
        (groups ?? []).some((group) => (group as PartnerGroupRow).id === member.partner_group_id),
      ),
    ),
    results: (results ?? []) as ResultRow[],
  };
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export async function listCompetitionsSupabase() {
  await ensureSeedCompetition();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("competitions").select("*").order("created_at");
  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const competition = mapCompetitionRow(row as CompetitionRow);
    return {
      id: competition.id,
      slug: competition.slug,
      name: competition.name,
      subtitle: competition.subtitle,
      status: competition.status,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
    };
  });
}

export async function getCompetitionBySlugSupabase(slug: string) {
  return getCompetitionRowBySlug(slug);
}

export async function getCompetitionSnapshotSupabase(
  slug: string,
): Promise<CompetitionSnapshot | null> {
  const context = await getCompetitionContext(slug);
  if (!context) {
    return null;
  }

  const resultsByEventId = buildResultsByEventId(
    context.events,
    buildResultsMap(context.events, context.results),
  );
  const leaderboard = buildLeaderboard(context.players, context.events, resultsByEventId);
  const liveEvent = context.events.find((event) => event.status === "live") ?? null;

  return {
    competition: {
      id: context.competition.id,
      slug: context.competition.slug,
      name: context.competition.name,
      subtitle: context.competition.subtitle,
      status: context.competition.status as CompetitionRecord["status"],
      createdAt: context.competition.createdAt,
      updatedAt: context.competition.updatedAt,
    },
    players: context.players,
    events: context.events,
    partnerGroups: context.partnerGroups,
    resultsByEventId,
    leaderboard,
    broadcast: {
      nowPlayingEventId: liveEvent?.id ?? null,
      completedEvents: context.events.filter((event) => event.status === "completed").length,
      totalEvents: context.events.length,
      leaderboard,
    },
  };
}

export async function upsertPlayerSupabase(
  slug: string,
  payload: Partial<PlayerProfile> & Pick<PlayerProfile, "name">,
) {
  const competition = await getCompetitionRowBySlug(slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const supabase = createAdminSupabaseClient();
  const { data: existingPlayers } = await supabase
    .from("players")
    .select("sort_order")
    .eq("competition_id", competition.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const playerPayload = {
    competition_id: competition.id,
    name: payload.name.trim(),
    nickname: payload.nickname ?? "",
    fact: payload.fact ?? "",
    height: payload.height ?? "",
    weight: payload.weight ?? "",
    vertical: payload.vertical ?? "",
    forty: payload.forty ?? "",
    bench: payload.bench ?? "",
    grip: payload.grip ?? "",
    trash_talk: payload.trashTalk ?? "",
    sore_loser: payload.soreLoser ?? "",
    biggest_threat: payload.biggestThreat ?? "",
    weakness: payload.weakness ?? "",
    photo_path: payload.photoPath ?? null,
    active: payload.active ?? true,
    sort_order: payload.sortOrder ?? ((existingPlayers?.[0]?.sort_order as number | undefined) ?? -1) + 1,
  };

  const query = payload.id
    ? supabase.from("players").update(playerPayload).eq("id", payload.id)
    : supabase.from("players").insert({
        id: randomUUID(),
        ...playerPayload,
      });

  const { error } = await query;
  if (error) {
    throw error;
  }

  await updateCompetitionTimestamp(competition.id);
}

export async function deletePlayerSupabase(slug: string, playerId: string) {
  const competition = await getCompetitionRowBySlug(slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("competition_id", competition.id)
    .eq("id", playerId);

  if (error) {
    throw error;
  }

  const { data: groups } = await supabase
    .from("partner_groups")
    .select("id")
    .eq("competition_id", competition.id);
  const groupIds = (groups ?? []).map((group) => group.id as string);
  if (groupIds.length) {
    const { data: remainingMembers } = await supabase
      .from("partner_group_members")
      .select("partner_group_id")
      .in("partner_group_id", groupIds);
    const remainingGroupIds = new Set(
      (remainingMembers ?? []).map((member) => member.partner_group_id as string),
    );
    const emptyGroupIds = groupIds.filter((groupId) => !remainingGroupIds.has(groupId));
    if (emptyGroupIds.length) {
      const { error: deleteGroupsError } = await supabase
        .from("partner_groups")
        .delete()
        .in("id", emptyGroupIds);
      if (deleteGroupsError) {
        throw deleteGroupsError;
      }
    }
  }

  await updateCompetitionTimestamp(competition.id);
}

export async function upsertEventSupabase(
  slug: string,
  payload: Partial<Event> & Pick<Event, "name" | "kind">,
) {
  const competition = await getCompetitionRowBySlug(slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const supabase = createAdminSupabaseClient();
  const { data: highestOrder } = await supabase
    .from("events")
    .select("order_index")
    .eq("competition_id", competition.id)
    .order("order_index", { ascending: false })
    .limit(1);

  const eventPayload = {
    competition_id: competition.id,
    name: payload.name.trim(),
    kind: payload.kind,
    order_index: payload.orderIndex ?? ((highestOrder?.[0]?.order_index as number | undefined) ?? -1) + 1,
    status: payload.status ?? "upcoming",
  };

  const query = payload.id
    ? supabase.from("events").update(eventPayload).eq("id", payload.id)
    : supabase.from("events").insert({
        id: randomUUID(),
        ...eventPayload,
      });

  const { error } = await query;
  if (error) {
    throw error;
  }

  await updateCompetitionTimestamp(competition.id);
}

export async function reorderEventSupabase(
  slug: string,
  eventId: string,
  direction: "up" | "down",
) {
  const context = await getCompetitionContext(slug);
  if (!context) {
    throw new Error("Competition not found");
  }

  const index = context.events.findIndex((event) => event.id === eventId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= context.events.length) {
    return;
  }

  const current = context.events[index];
  const target = context.events[swapIndex];
  const supabase = createAdminSupabaseClient();
  const { error: currentError } = await supabase
    .from("events")
    .update({ order_index: target.orderIndex })
    .eq("id", current.id);
  if (currentError) {
    throw currentError;
  }

  const { error: targetError } = await supabase
    .from("events")
    .update({ order_index: current.orderIndex })
    .eq("id", target.id);
  if (targetError) {
    throw targetError;
  }

  await updateCompetitionTimestamp(context.competition.id);
}

export async function deleteEventSupabase(slug: string, eventId: string) {
  const context = await getCompetitionContext(slug);
  if (!context) {
    throw new Error("Competition not found");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    throw error;
  }

  const remaining = context.events.filter((event) => event.id !== eventId);
  await Promise.all(
    remaining.map((event, index) =>
      supabase.from("events").update({ order_index: index }).eq("id", event.id),
    ),
  );

  await updateCompetitionTimestamp(context.competition.id);
}

export async function randomizePartnersSupabase(slug: string) {
  const context = await getCompetitionContext(slug);
  if (!context) {
    throw new Error("Competition not found");
  }

  const supabase = createAdminSupabaseClient();
  const activePlayers = shuffle(context.players.filter((player) => player.active));
  const existingGroupIds = context.partnerGroups.map((group) => group.id);

  if (existingGroupIds.length) {
    const { error: membersError } = await supabase
      .from("partner_group_members")
      .delete()
      .in("partner_group_id", existingGroupIds);
    if (membersError) {
      throw membersError;
    }

    const { error: groupsError } = await supabase
      .from("partner_groups")
      .delete()
      .in("id", existingGroupIds);
    if (groupsError) {
      throw groupsError;
    }
  }

  const nextGroups: PartnerGroup[] = [];
  for (let index = 0; index < activePlayers.length; index += 2) {
    nextGroups.push({
      id: randomUUID(),
      groupNumber: nextGroups.length + 1,
      playerIds: activePlayers.slice(index, index + 2).map((player) => player.id),
    });
  }

  if (activePlayers.length % 2 !== 0 && nextGroups.length > 0) {
    const leftover = activePlayers[activePlayers.length - 1]?.id;
    const lastGroup = nextGroups[nextGroups.length - 1];
    if (leftover && !lastGroup.playerIds.includes(leftover)) {
      lastGroup.playerIds.push(leftover);
    }
  }

  if (nextGroups.length) {
    const { error: insertGroupsError } = await supabase.from("partner_groups").insert(
      nextGroups.map((group) => ({
        id: group.id,
        competition_id: context.competition.id,
        group_number: group.groupNumber,
      })),
    );
    if (insertGroupsError) {
      throw insertGroupsError;
    }

    const { error: insertMembersError } = await supabase.from("partner_group_members").insert(
      nextGroups.flatMap((group) =>
        group.playerIds.map((playerId, index) => ({
          partner_group_id: group.id,
          player_id: playerId,
          slot: index,
        })),
      ),
    );
    if (insertMembersError) {
      throw insertMembersError;
    }
  }

  await updateCompetitionTimestamp(context.competition.id);
}

async function syncEventStatuses(
  competitionId: string,
  events: Event[],
  liveEventId: string | null,
  completedEventId?: string | null,
) {
  const supabase = createAdminSupabaseClient();
  await Promise.all(
    events.map((event) => {
      const nextStatus: EventStatus =
        liveEventId && event.id === liveEventId
          ? "live"
          : event.id === completedEventId
            ? "completed"
            : event.status === "completed"
              ? "completed"
              : "upcoming";

      return supabase.from("events").update({ status: nextStatus }).eq("id", event.id);
    }),
  );

  await updateCompetitionTimestamp(competitionId, "live");
}

async function replaceCompetitionDataSupabase(
  competitionId: string,
  transformed: {
    players: PlayerProfile[];
    events: Event[];
    partnerGroups: PartnerGroup[];
    resultsByEventId: Record<string, ResultEntry[]>;
  },
) {
  const supabase = createAdminSupabaseClient();

  const { data: existingGroups } = await supabase
    .from("partner_groups")
    .select("id")
    .eq("competition_id", competitionId);
  const groupIds = (existingGroups ?? []).map((group) => group.id as string);

  if (groupIds.length) {
    const { error: deleteMembersError } = await supabase
      .from("partner_group_members")
      .delete()
      .in("partner_group_id", groupIds);
    if (deleteMembersError) {
      throw deleteMembersError;
    }
  }

  await Promise.all([
    supabase.from("results").delete().in(
      "event_id",
      (
        await supabase.from("events").select("id").eq("competition_id", competitionId)
      ).data?.map((event) => event.id as string) ?? [],
    ),
    supabase.from("players").delete().eq("competition_id", competitionId),
    supabase.from("events").delete().eq("competition_id", competitionId),
    groupIds.length
      ? supabase.from("partner_groups").delete().in("id", groupIds)
      : Promise.resolve({ error: null }),
  ]);

  if (transformed.players.length) {
    const { error: playerError } = await supabase.from("players").insert(
      transformed.players.map((player) => ({
        id: player.id,
        competition_id: player.competitionId,
        name: player.name,
        nickname: player.nickname,
        fact: player.fact,
        height: player.height,
        weight: player.weight,
        vertical: player.vertical,
        forty: player.forty,
        bench: player.bench,
        grip: player.grip,
        trash_talk: player.trashTalk,
        sore_loser: player.soreLoser,
        biggest_threat: player.biggestThreat,
        weakness: player.weakness,
        photo_path: player.photoPath,
        active: player.active,
        sort_order: player.sortOrder,
      })),
    );
    if (playerError) {
      throw playerError;
    }
  }

  if (transformed.events.length) {
    const { error: eventError } = await supabase.from("events").insert(
      transformed.events.map((event) => ({
        id: event.id,
        competition_id: event.competitionId,
        name: event.name,
        kind: event.kind,
        order_index: event.orderIndex,
        status: event.status,
      })),
    );
    if (eventError) {
      throw eventError;
    }
  }

  if (transformed.partnerGroups.length) {
    const { error: groupError } = await supabase.from("partner_groups").insert(
      transformed.partnerGroups.map((group) => ({
        id: group.id,
        competition_id: competitionId,
        group_number: group.groupNumber,
      })),
    );
    if (groupError) {
      throw groupError;
    }

    const { error: memberError } = await supabase.from("partner_group_members").insert(
      transformed.partnerGroups.flatMap((group) =>
        group.playerIds.map((playerId, index) => ({
          partner_group_id: group.id,
          player_id: playerId,
          slot: index,
        })),
      ),
    );
    if (memberError) {
      throw memberError;
    }
  }

  const resultRows = Object.entries(transformed.resultsByEventId).flatMap(([eventId, entries]) =>
    entries.map((entry) => ({
      id: randomUUID(),
      event_id: eventId,
      player_id: entry.playerId,
      placement: entry.placement,
    })),
  );

  if (resultRows.length) {
    const { error: resultError } = await supabase.from("results").insert(resultRows);
    if (resultError) {
      throw resultError;
    }
  }
}

export async function saveEventResultsSupabase(
  slug: string,
  eventId: string,
  placements: Array<{ playerId: string; placement: number }>,
) {
  const context = await getCompetitionContext(slug);
  if (!context) {
    throw new Error("Competition not found");
  }

  const event = context.events.find((entry) => entry.id === eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  const supabase = createAdminSupabaseClient();
  const { error: deleteError } = await supabase.from("results").delete().eq("event_id", eventId);
  if (deleteError) {
    throw deleteError;
  }

  const nextPlacements = placements.filter((entry) => entry.placement > 0);
  if (event.kind === "team") {
    for (const group of context.partnerGroups) {
      const groupPlacements = nextPlacements.filter((entry) => group.playerIds.includes(entry.playerId));
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

  if (nextPlacements.length) {
    const { error: insertError } = await supabase.from("results").insert(
      nextPlacements.map((entry) => ({
        id: randomUUID(),
        event_id: eventId,
        player_id: entry.playerId,
        placement: entry.placement,
      })),
    );
    if (insertError) {
      throw insertError;
    }
  }

  await syncEventStatuses(context.competition.id, context.events, null, nextPlacements.length ? eventId : null);
}

export async function clearEventResultsSupabase(slug: string, eventId: string) {
  const context = await getCompetitionContext(slug);
  if (!context) {
    throw new Error("Competition not found");
  }

  const supabase = createAdminSupabaseClient();
  const { error: deleteError } = await supabase.from("results").delete().eq("event_id", eventId);
  if (deleteError) {
    throw deleteError;
  }

  const { error: eventError } = await supabase
    .from("events")
    .update({ status: "upcoming" })
    .eq("id", eventId);
  if (eventError) {
    throw eventError;
  }

  await updateCompetitionTimestamp(context.competition.id);
}

export async function setLiveEventSupabase(slug: string, eventId: string | null) {
  const context = await getCompetitionContext(slug);
  if (!context) {
    throw new Error("Competition not found");
  }

  await syncEventStatuses(context.competition.id, context.events, eventId);
}

export async function exportCompetitionBackupSupabase(slug: string): Promise<AppBackup> {
  const snapshot = await getCompetitionSnapshotSupabase(slug);
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

export async function importLegacyBackupSupabase(slug: string, backup: LegacyBackup) {
  const competition = await getCompetitionRowBySlug(slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const transformed = transformLegacyBackup(backup, competition.id);
  await replaceCompetitionDataSupabase(competition.id, transformed);

  await syncEventStatuses(
    competition.id,
    transformed.events,
    transformed.nowPlayingEventId,
    transformed.events.some((event) => event.status === "completed") ? undefined : null,
  );
}

export async function importCompetitionBackupSupabase(slug: string, backup: AppBackup | LegacyBackup) {
  if (!isAppBackup(backup)) {
    return importLegacyBackupSupabase(slug, backup);
  }

  const competition = await getCompetitionRowBySlug(slug);
  if (!competition) {
    throw new Error("Competition not found");
  }

  const transformed = transformAppBackup(backup, competition.id, slug);
  await replaceCompetitionDataSupabase(competition.id, transformed);

  const supabase = createAdminSupabaseClient();
  const { error: competitionError } = await supabase
    .from("competitions")
    .update({
      name: transformed.competition.name,
      subtitle: transformed.competition.subtitle,
      status: transformed.competition.status,
    })
    .eq("id", competition.id);
  if (competitionError) {
    throw competitionError;
  }

  await syncEventStatuses(
    competition.id,
    transformed.events,
    transformed.nowPlayingEventId,
    transformed.events.some((event) => event.status === "completed") ? undefined : null,
  );
}
