"use client";

import { useMemo } from "react";

import { Avatar, LeaderboardTable, TopNav } from "@/components/shared";
import { useCompetitionSnapshot } from "@/components/use-competition-snapshot";
import { formatEventStatus } from "@/lib/presenters";
import type { CompetitionSnapshot } from "@/lib/types";

export function LiveBoardClient({
  competitionSlug,
  initialSnapshot,
}: {
  competitionSlug: string;
  initialSnapshot: CompetitionSnapshot;
}) {
  const [snapshot] = useCompetitionSnapshot(competitionSlug, initialSnapshot, 3000);
  const topThree = useMemo(() => snapshot.leaderboard.slice(0, 3), [snapshot.leaderboard]);
  const liveEvent = snapshot.events.find((event) => event.status === "live") ?? null;
  const progress =
    snapshot.broadcast.totalEvents > 0
      ? (snapshot.broadcast.completedEvents / snapshot.broadcast.totalEvents) * 100
      : 0;

  return (
    <main className="app-shell">
      <header className="page-hero">
        <p className="eyebrow">Public Livestream View</p>
        <h1>{snapshot.competition.name}</h1>
        <p className="hero-meta">{snapshot.competition.subtitle}</p>
        <div className="progress-bar" style={{ marginTop: 18 }}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="topbar">
        <TopNav competitionSlug={competitionSlug} />
        <div className="muted">
          {snapshot.broadcast.completedEvents}/{snapshot.broadcast.totalEvents} events complete
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <p className="kicker">Now Playing</p>
          <h3>{liveEvent?.name ?? "Waiting on the whistle"}</h3>
        </article>
        <article className="stat-card">
          <p className="kicker">Leaders</p>
          <h3>{snapshot.leaderboard[0]?.totalPoints ?? 0} pts to beat</h3>
        </article>
        <article className="stat-card">
          <p className="kicker">Status</p>
          <h3>{liveEvent ? formatEventStatus(liveEvent) : "Pregame"}</h3>
        </article>
      </section>

      <section>
        <div className="section-row">
          <h2 className="section-title">Podium</h2>
        </div>
        <div className="podium">
          {topThree.map((row) => {
            const player = snapshot.players.find((entry) => entry.id === row.playerId);
            if (!player) {
              return null;
            }

            return (
              <article className="podium-card" key={row.playerId}>
                <div className="podium-rank">{row.rank}</div>
                <div className="podium-avatar">
                  <div style={{ display: "grid", placeItems: "center" }}>
                    <Avatar player={player} size={82} />
                  </div>
                </div>
                <h3 className="player-name">{player.nickname || player.name}</h3>
                <p className="muted">{row.totalPoints} pts</p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="section-row">
          <h2 className="section-title">Standings</h2>
        </div>
        <LeaderboardTable rows={snapshot.leaderboard} snapshot={snapshot} />
      </section>
    </main>
  );
}
