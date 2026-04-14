import { describe, expect, it } from "vitest";

import { buildLeaderboard, buildResultsByEventId, pointsForPlacement } from "../src/lib/scoring";
import type { Event, PlayerProfile } from "../src/lib/types";

const players: PlayerProfile[] = [
  {
    id: "p1",
    competitionId: "c1",
    name: "Roman",
    nickname: "",
    fact: "",
    height: "",
    weight: "",
    vertical: "",
    forty: "",
    bench: "",
    grip: "",
    trashTalk: "",
    soreLoser: "",
    biggestThreat: "",
    weakness: "",
    photoPath: null,
    active: true,
    sortOrder: 0,
  },
  {
    id: "p2",
    competitionId: "c1",
    name: "HB",
    nickname: "",
    fact: "",
    height: "",
    weight: "",
    vertical: "",
    forty: "",
    bench: "",
    grip: "",
    trashTalk: "",
    soreLoser: "",
    biggestThreat: "",
    weakness: "",
    photoPath: null,
    active: true,
    sortOrder: 1,
  },
];

const events: Event[] = [
  {
    id: "e1",
    competitionId: "c1",
    name: "Mario Kart",
    kind: "individual",
    orderIndex: 0,
    status: "completed",
  },
  {
    id: "e2",
    competitionId: "c1",
    name: "Beer Pong",
    kind: "team",
    orderIndex: 1,
    status: "completed",
  },
];

describe("pointsForPlacement", () => {
  it("keeps the original 5-4-3-2-1 scoring map", () => {
    expect(pointsForPlacement(1)).toBe(5);
    expect(pointsForPlacement(2)).toBe(4);
    expect(pointsForPlacement(3)).toBe(3);
    expect(pointsForPlacement(4)).toBe(2);
    expect(pointsForPlacement(5)).toBe(1);
    expect(pointsForPlacement(8)).toBe(1);
  });
});

describe("buildLeaderboard", () => {
  it("totals scores and ranks players descending", () => {
    const results = buildResultsByEventId(events, {
      e1: [
        { playerId: "p1", placement: 1 },
        { playerId: "p2", placement: 2 },
      ],
      e2: [
        { playerId: "p1", placement: 2 },
        { playerId: "p2", placement: 1 },
      ],
    });

    const leaderboard = buildLeaderboard(players, events, results);
    expect(leaderboard[0]?.playerId).toBe("p1");
    expect(leaderboard[0]?.totalPoints).toBe(9);
    expect(leaderboard[1]?.totalPoints).toBe(9);
    expect(leaderboard[0]?.rank).toBe(1);
    expect(leaderboard[1]?.rank).toBe(2);
  });
});
