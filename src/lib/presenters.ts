import type { CompetitionSnapshot, Event, PlayerProfile } from "@/lib/types";

const AVATAR_COLORS = [
  "#ffc857",
  "#61f2c2",
  "#61a8ff",
  "#ff8fab",
  "#f4b860",
  "#9e7bff",
  "#92f29f",
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((chunk) => chunk.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getAvatarColor(playerId: string) {
  const seed = [...playerId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

export function formatEventStatus(event: Event) {
  if (event.status === "live") {
    return "Now playing";
  }

  if (event.status === "completed") {
    return "Scored";
  }

  return "Upcoming";
}

export function findPlayer(snapshot: CompetitionSnapshot, playerId: string) {
  return snapshot.players.find((player) => player.id === playerId);
}

export function buildPhysicalTags(player: PlayerProfile) {
  return [
    player.height && `Height ${player.height}`,
    player.weight && `${player.weight} lbs`,
    player.vertical && `${player.vertical}" vertical`,
    player.forty && `40-yard ${player.forty}`,
    player.bench && `Bench ${player.bench}`,
    player.grip && `Grip ${player.grip}`,
  ].filter(Boolean) as string[];
}

export function buildIntelTags(player: PlayerProfile) {
  return [
    player.trashTalk && `Trash talk: ${player.trashTalk}`,
    player.soreLoser && `Sore loser: ${player.soreLoser}`,
    player.biggestThreat && `Danger zone: ${player.biggestThreat}`,
    player.weakness && `Will fold in: ${player.weakness}`,
  ].filter(Boolean) as string[];
}
