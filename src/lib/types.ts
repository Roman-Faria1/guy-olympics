export type CompetitionStatus = "setup" | "live" | "finished";
export type EventKind = "individual" | "team";
export type EventStatus = "upcoming" | "live" | "completed";

export type Competition = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
};

export type CompetitionRecord = Competition & {
  adminPasscodeHash: string;
};

export type PlayerProfile = {
  id: string;
  competitionId: string;
  name: string;
  nickname: string;
  fact: string;
  height: string;
  weight: string;
  vertical: string;
  forty: string;
  bench: string;
  grip: string;
  trashTalk: string;
  soreLoser: string;
  biggestThreat: string;
  weakness: string;
  photoPath: string | null;
  active: boolean;
  sortOrder: number;
};

export type Event = {
  id: string;
  competitionId: string;
  name: string;
  kind: EventKind;
  orderIndex: number;
  status: EventStatus;
};

export type PartnerGroupRecord = {
  id: string;
  competitionId: string;
  groupNumber: number;
};

export type PartnerGroupMemberRecord = {
  partnerGroupId: string;
  playerId: string;
  slot: number;
};

export type PartnerGroup = {
  id: string;
  groupNumber: number;
  playerIds: string[];
};

export type ResultRecord = {
  id: string;
  eventId: string;
  playerId: string;
  placement: number;
};

export type ResultEntry = {
  playerId: string;
  placement: number;
  points: number;
};

export type LeaderboardRow = {
  playerId: string;
  rank: number;
  totalPoints: number;
  eventsPlayed: number;
  bestEvent: string | null;
  bestEventPoints: number | null;
  eventBreakdown: Record<string, number>;
};

export type BroadcastState = {
  nowPlayingEventId: string | null;
  completedEvents: number;
  totalEvents: number;
  leaderboard: LeaderboardRow[];
};

export type CompetitionSnapshot = {
  competition: Competition;
  players: PlayerProfile[];
  events: Event[];
  partnerGroups: PartnerGroup[];
  resultsByEventId: Record<string, ResultEntry[]>;
  leaderboard: LeaderboardRow[];
  broadcast: BroadcastState;
};

export type DatabaseState = {
  competitions: CompetitionRecord[];
  players: PlayerProfile[];
  events: Event[];
  partnerGroups: PartnerGroupRecord[];
  partnerGroupMembers: PartnerGroupMemberRecord[];
  results: ResultRecord[];
};

export type LegacyBackup = {
  version?: number;
  exported?: string;
  players?: Array<{
    id?: number | string;
    name?: string;
    nick?: string;
    fact?: string;
    height?: string;
    weight?: string | number;
    vertical?: string | number;
    forty?: string;
    bench?: string | number;
    grip?: string | number;
    trash?: string;
    loser?: string;
    threat?: string;
    weakness?: string;
    photo?: string | null;
  }>;
  scores?: Record<string, Record<string, number>>;
  partners?: Array<Array<number | string>>;
  individual?: string[];
  team?: string[];
  nowPlaying?: string | null;
};

export type AppBackup = {
  version: number;
  exportedAt: string;
  competition: Competition;
  players: PlayerProfile[];
  events: Event[];
  partnerGroups: PartnerGroup[];
  resultsByEventId: Record<string, ResultEntry[]>;
};
