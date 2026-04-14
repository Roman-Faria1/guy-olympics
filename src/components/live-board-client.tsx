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
  const nextEvent =
    snapshot.events.find((event) => event.status === "upcoming") ??
    snapshot.events.find((event) => event.id !== liveEvent?.id) ??
    null;
  const leader = snapshot.leaderboard[0] ?? null;
  const leaderPlayer = leader
    ? snapshot.players.find((entry) => entry.id === leader.playerId) ?? null
    : null;
  const chasers = snapshot.leaderboard.slice(1, 4);
  const progress =
    snapshot.broadcast.totalEvents > 0
      ? (snapshot.broadcast.completedEvents / snapshot.broadcast.totalEvents) * 100
      : 0;

  return (
    <main className="app-shell broadcast-shell">
      <div className="topbar broadcast-topbar">
        <TopNav competitionSlug={competitionSlug} />
        <div className="broadcast-status-strip">
          <span className="broadcast-live-dot" />
          <span>Stream view</span>
          <span className="muted">
            {snapshot.broadcast.completedEvents}/{snapshot.broadcast.totalEvents} events complete
          </span>
        </div>
      </div>

      <header className="page-hero broadcast-hero">
        <div className="broadcast-hero-grid">
          <div className="broadcast-hero-copy">
            <div className="broadcast-badge-row">
              <span className="broadcast-live-pill">Live</span>
              <span className="eyebrow" style={{ marginBottom: 0 }}>
                Beer Olympics Broadcast
              </span>
            </div>
            <h1>{snapshot.competition.name}</h1>
            <p className="hero-meta">{snapshot.competition.subtitle}</p>

            <div className="broadcast-progress">
              <div className="broadcast-progress-copy">
                <strong>Tournament progress</strong>
                <span className="muted">
                  {snapshot.broadcast.completedEvents} complete / {snapshot.broadcast.totalEvents} total
                </span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="broadcast-feature-panel">
            <p className="kicker">Now Playing</p>
            <h2>{liveEvent?.name ?? "Waiting on the whistle"}</h2>
            <p className="broadcast-feature-meta">
              {liveEvent ? formatEventStatus(liveEvent) : "Pregame setup in progress"}
            </p>

            <div className="broadcast-feature-grid">
              <div>
                <p className="kicker">Current Leader</p>
                <strong className="broadcast-stat-display">
                  {leader ? `${leader.totalPoints} pts` : "0 pts"}
                </strong>
              </div>
              <div>
                <p className="kicker">Up Next</p>
                <strong className="broadcast-stat-display">
                  {nextEvent?.name ?? "Champagne ceremony"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="broadcast-chase-grid">
        <article className="stat-card broadcast-spotlight-card">
          <p className="kicker">Front Runner</p>
          {leader && leaderPlayer ? (
            <div className="broadcast-leader-lockup">
              <Avatar player={leaderPlayer} size={88} />
              <div>
                <h3>{leaderPlayer.nickname || leaderPlayer.name}</h3>
                <p className="muted">
                  Rank #{leader.rank} with {leader.totalPoints} total points
                </p>
              </div>
            </div>
          ) : (
            <h3>No scores yet</h3>
          )}
        </article>

        <article className="stat-card broadcast-chasers-card">
          <p className="kicker">Chasing Pack</p>
          <div className="broadcast-mini-board">
            {chasers.length ? (
              chasers.map((row) => {
                const player = snapshot.players.find((entry) => entry.id === row.playerId);
                if (!player) {
                  return null;
                }

                return (
                  <div className="broadcast-mini-row" key={row.playerId}>
                    <span className="broadcast-mini-rank">#{row.rank}</span>
                    <span className="broadcast-mini-name">{player.nickname || player.name}</span>
                    <strong>{row.totalPoints}</strong>
                  </div>
                );
              })
            ) : (
              <p className="muted">Waiting for the first event to finish.</p>
            )}
          </div>
        </article>
      </section>

      <section className="broadcast-main-grid">
        <section>
          <div className="section-row">
            <h2 className="section-title">Podium</h2>
            <span className="broadcast-section-meta">Top three on the day</span>
          </div>
          <div className="podium broadcast-podium">
            {topThree.map((row) => {
              const player = snapshot.players.find((entry) => entry.id === row.playerId);
              if (!player) {
                return null;
              }

              return (
                <article className="podium-card broadcast-podium-card" key={row.playerId}>
                  <div className="podium-rank">{row.rank}</div>
                  <div className="podium-avatar">
                    <div style={{ display: "grid", placeItems: "center" }}>
                      <Avatar player={player} size={96} />
                    </div>
                  </div>
                  <h3 className="player-name">{player.nickname || player.name}</h3>
                  <p className="muted">{row.totalPoints} pts</p>
                  {row.bestEvent ? (
                    <span className="pill">Best swing: {row.bestEvent}</span>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="broadcast-side-stack">
          <article className="panel broadcast-side-card">
            <div className="section-row" style={{ marginTop: 0 }}>
              <h2 className="section-title">Event Radar</h2>
            </div>
            <div className="broadcast-radar-list">
              {snapshot.events.slice(0, 6).map((event) => (
                <div className="broadcast-radar-row" key={event.id}>
                  <div>
                    <strong>{event.name}</strong>
                    <div className="muted">{event.kind === "team" ? "Team event" : "Solo event"}</div>
                  </div>
                  <span
                    className={`pill ${
                      event.status === "live"
                        ? "live"
                        : event.status === "completed"
                          ? "complete"
                          : ""
                    }`}
                  >
                    {formatEventStatus(event)}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel broadcast-side-card">
            <div className="section-row" style={{ marginTop: 0 }}>
              <h2 className="section-title">Points Race</h2>
            </div>
            <p className="muted">
              {leader
                ? `${leader.totalPoints} is the number to beat. Every placement still matters.`
                : "Score the first event to kick off the standings race."}
            </p>
          </article>
        </aside>
      </section>

      <section>
        <div className="section-row">
          <h2 className="section-title">Standings</h2>
          <span className="broadcast-section-meta">Full leaderboard for the stream desk</span>
        </div>
        <div className="broadcast-standings">
          <LeaderboardTable rows={snapshot.leaderboard} snapshot={snapshot} />
        </div>
      </section>
    </main>
  );
}
