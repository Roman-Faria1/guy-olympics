import Image from "next/image";
import Link from "next/link";

import type { CompetitionSnapshot, LeaderboardRow, PlayerProfile } from "@/lib/types";
import { buildIntelTags, buildPhysicalTags, getAvatarColor, getInitials } from "@/lib/presenters";

export function Avatar({
  player,
  size = 72,
}: {
  player: PlayerProfile;
  size?: number;
}) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: player.photoPath ? undefined : getAvatarColor(player.id),
        position: "relative",
      }}
    >
      {player.photoPath ? (
        <Image alt={player.name} fill sizes={`${size}px`} src={player.photoPath} />
      ) : (
        <span>{getInitials(player.name)}</span>
      )}
    </div>
  );
}

export function TopNav({ competitionSlug }: { competitionSlug: string }) {
  return (
    <nav className="top-nav">
      <Link href="/">Home</Link>
      <Link href={`/${competitionSlug}/admin`}>Admin</Link>
      <Link href={`/${competitionSlug}/live`}>Live Board</Link>
      <Link href={`/${competitionSlug}/players`}>Players</Link>
    </nav>
  );
}

export function LeaderboardTable({
  snapshot,
  rows,
}: {
  snapshot: CompetitionSnapshot;
  rows: LeaderboardRow[];
}) {
  return (
    <div className="panel">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Total</th>
            <th>Breakdown</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const player = snapshot.players.find((entry) => entry.id === row.playerId);
            if (!player) {
              return null;
            }

            return (
              <tr key={row.playerId}>
                <td>{row.rank}</td>
                <td>
                  <div className="row-with-avatar">
                    <Avatar player={player} size={42} />
                    <div>
                      <strong>{player.name}</strong>
                      {player.nickname ? (
                        <div className="muted">&quot;{player.nickname}&quot;</div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td>{row.totalPoints}</td>
                <td>
                  <div className="breakdown-list">
                    {Object.entries(row.eventBreakdown).length ? (
                      Object.entries(row.eventBreakdown).map(([eventId, points]) => {
                        const event = snapshot.events.find((entry) => entry.id === eventId);
                        return (
                          <span className="pill" key={eventId}>
                            {event?.name.split(" ")[0] ?? "Event"} +{points}
                          </span>
                        );
                      })
                    ) : (
                      <span className="muted">No scores yet</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PlayerCard({ player }: { player: PlayerProfile }) {
  return (
    <article className="player-card">
      <div className="player-header">
        <div className="row-with-avatar">
          <Avatar player={player} />
          <div>
            <h2 className="player-name">{player.name}</h2>
            {player.nickname ? <p className="muted">&quot;{player.nickname}&quot;</p> : null}
          </div>
        </div>
      </div>

      {buildPhysicalTags(player).length ? (
        <div className="tag-list">
          {buildPhysicalTags(player).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {buildIntelTags(player).length ? (
        <div className="tag-list">
          {buildIntelTags(player).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {player.fact ? <p>{player.fact}</p> : null}
    </article>
  );
}
