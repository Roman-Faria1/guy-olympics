import { describe, expect, it } from "vitest";

import { transformLegacyBackup } from "../src/lib/legacy-import";

describe("transformLegacyBackup", () => {
  it("preserves scouting fields, event kinds, and live event state", () => {
    const transformed = transformLegacyBackup(
      {
        players: [
          {
            id: 101,
            name: "Roman",
            nick: "Commissioner",
            threat: "Mario Kart",
            weakness: "Hot Dog Contest",
          },
        ],
        individual: ["Mario Kart"],
        team: ["Beer Pong"],
        partners: [[101]],
        scores: {
          "Mario Kart": {
            "101": 1,
          },
        },
        nowPlaying: "Beer Pong",
      },
      "competition-1",
    );

    expect(transformed.players[0]?.nickname).toBe("Commissioner");
    expect(transformed.players[0]?.biggestThreat).toBe("Mario Kart");
    expect(transformed.players[0]?.weakness).toBe("Hot Dog Contest");
    expect(transformed.events.map((event) => event.kind)).toEqual(["individual", "team"]);
    expect(transformed.partnerGroups[0]?.playerIds).toHaveLength(1);
    expect(transformed.nowPlayingEventId).toBe(transformed.events[1]?.id);
  });
});
