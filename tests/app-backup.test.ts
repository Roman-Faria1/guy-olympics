import { describe, expect, it } from "vitest";

import { isAppBackup, transformAppBackup } from "../src/lib/app-backup";
import type { AppBackup } from "../src/lib/types";

const backup: AppBackup = {
  version: 3,
  exportedAt: "2026-04-14T00:00:00.000Z",
  competition: {
    id: "old-comp",
    slug: "old-slug",
    name: "Old Cup",
    subtitle: "Test restore",
    status: "live",
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-14T00:00:00.000Z",
  },
  players: [
    {
      id: "p1",
      competitionId: "old-comp",
      name: "Roman",
      nickname: "Ro",
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
  ],
  events: [
    {
      id: "e1",
      competitionId: "old-comp",
      name: "Flip Cup",
      kind: "individual",
      orderIndex: 0,
      status: "live",
    },
  ],
  partnerGroups: [
    {
      id: "g1",
      groupNumber: 1,
      playerIds: ["p1"],
    },
  ],
  resultsByEventId: {
    e1: [
      {
        playerId: "p1",
        placement: 1,
        points: 5,
      },
    ],
  },
};

describe("isAppBackup", () => {
  it("recognizes the versioned app backup format", () => {
    expect(isAppBackup(backup)).toBe(true);
    expect(isAppBackup({ version: 3 })).toBe(false);
  });
});

describe("transformAppBackup", () => {
  it("retargets the backup to the current competition while preserving ids and results", () => {
    const transformed = transformAppBackup(backup, "current-comp", "summer-2026");

    expect(transformed.competition.id).toBe("current-comp");
    expect(transformed.competition.slug).toBe("summer-2026");
    expect(transformed.players[0]?.competitionId).toBe("current-comp");
    expect(transformed.events[0]?.competitionId).toBe("current-comp");
    expect(transformed.nowPlayingEventId).toBe("e1");
    expect(transformed.resultsByEventId.e1?.[0]?.playerId).toBe("p1");
  });
});
