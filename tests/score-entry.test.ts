import { describe, expect, it } from "vitest";

import { validateScoreInputs, validateScorePlacements } from "../src/lib/score-entry";
import type { Event, PartnerGroup, PlayerProfile } from "../src/lib/types";

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
  {
    id: "p3",
    competitionId: "c1",
    name: "Matt",
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
    sortOrder: 2,
  },
];

const individualEvent: Event = {
  id: "e1",
  competitionId: "c1",
  name: "Flip Cup",
  kind: "individual",
  orderIndex: 0,
  status: "upcoming",
};

const teamEvent: Event = {
  id: "e2",
  competitionId: "c1",
  name: "Beer Pong",
  kind: "team",
  orderIndex: 1,
  status: "upcoming",
};

const partnerGroups: PartnerGroup[] = [
  {
    id: "g1",
    groupNumber: 1,
    playerIds: ["p1", "p2"],
  },
];

describe("validateScoreInputs", () => {
  it("warns when individual-event ties and missing players are present", () => {
    const result = validateScoreInputs({
      scoreInputs: {
        p1: "1",
        p2: "1",
      },
      players,
      event: individualEvent,
      partnerGroups: [],
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain("1 player is still blank.");
    expect(result.warnings[1]).toContain("Tie detected");
  });

  it("blocks invalid numeric inputs before save", () => {
    const result = validateScoreInputs({
      scoreInputs: {
        p1: "abc",
        p2: "2",
      },
      players,
      event: individualEvent,
      partnerGroups: [],
    });

    expect(result.errors).toContain("Placements must be whole numbers greater than 0.");
    expect(result.invalidPlayerIds).toContain("p1");
  });
});

describe("validateScorePlacements", () => {
  it("blocks conflicting teammate placements in team events", () => {
    const result = validateScorePlacements({
      placements: [
        { playerId: "p1", placement: 1 },
        { playerId: "p2", placement: 2 },
      ],
      players,
      event: teamEvent,
      partnerGroups,
    });

    expect(result.errors[0]).toContain("Group 1 has conflicting placements");
    expect(result.invalidPlayerIds).toEqual(expect.arrayContaining(["p1", "p2"]));
  });
});
