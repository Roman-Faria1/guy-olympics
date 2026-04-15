"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Avatar, LeaderboardTable, TopNav } from "@/components/shared";
import { useCompetitionSnapshot } from "@/components/use-competition-snapshot";
import { formatEventStatus } from "@/lib/presenters";
import type { CompetitionSnapshot } from "@/lib/types";

type BroadcastScene = "overview" | "podium" | "spotlight" | "schedule";

const SCENES: Array<{ id: BroadcastScene; label: string; description: string }> = [
  { id: "overview", label: "Overview", description: "Balanced desk view" },
  { id: "podium", label: "Podium", description: "Top-three focus" },
  { id: "spotlight", label: "Spotlight", description: "Live event and leader" },
  { id: "schedule", label: "Schedule", description: "Event radar and standings" },
];

export function LiveBoardClient({
  competitionSlug,
  initialSnapshot,
}: {
  competitionSlug: string;
  initialSnapshot: CompetitionSnapshot;
}) {
  const searchParams = useSearchParams();
  const mainRef = useRef<HTMLElement | null>(null);
  const [snapshot] = useCompetitionSnapshot(competitionSlug, initialSnapshot, 3000);
  const [isMobileBroadcast, setIsMobileBroadcast] = useState(false);
  const [scene, setScene] = useState<BroadcastScene>(() => {
    const requested = searchParams.get("scene");
    return SCENES.some((entry) => entry.id === requested)
      ? (requested as BroadcastScene)
      : "overview";
  });
  const [autoRotate, setAutoRotate] = useState(searchParams.get("autoplay") === "1");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const autoRotateEnabled = autoRotate && !isMobileBroadcast;
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
  const radarEvents = scene === "schedule" ? snapshot.events : snapshot.events.slice(0, 6);
  const progress =
    snapshot.broadcast.totalEvents > 0
      ? (snapshot.broadcast.completedEvents / snapshot.broadcast.totalEvents) * 100
      : 0;
  const sceneMeta = SCENES.find((entry) => entry.id === scene) ?? SCENES[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 820px), (pointer: coarse)");
    const syncViewportMode = () => setIsMobileBroadcast(mediaQuery.matches);

    syncViewportMode();
    mediaQuery.addEventListener("change", syncViewportMode);
    return () => mediaQuery.removeEventListener("change", syncViewportMode);
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === mainRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!autoRotateEnabled) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setScene((current) => {
        const index = SCENES.findIndex((entry) => entry.id === current);
        return SCENES[(index + 1) % SCENES.length]?.id ?? "overview";
      });
    }, 12000);

    return () => window.clearInterval(timer);
  }, [autoRotateEnabled]);

  async function toggleFullscreen() {
    if (!mainRef.current) {
      return;
    }

    if (document.fullscreenElement === mainRef.current) {
      await document.exitFullscreen();
      return;
    }

    await mainRef.current.requestFullscreen();
  }

  return (
    <main
      className={`app-shell broadcast-shell ${isFullscreen ? "broadcast-fullscreen" : ""}`}
      ref={mainRef}
    >
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

      <section className="broadcast-control-strip">
        <div className="broadcast-scene-tabs" aria-label="Broadcast scenes">
          {SCENES.map((entry) => (
            <button
              className={`broadcast-scene-tab ${scene === entry.id ? "active" : ""}`}
              key={entry.id}
              onClick={() => setScene(entry.id)}
              type="button"
            >
              <span>{entry.label}</span>
              <small>{entry.description}</small>
            </button>
          ))}
        </div>
        <div className="inline-actions">
          {!isMobileBroadcast ? (
            <>
              <button
                className={`ghost-button ${autoRotate ? "broadcast-control-active" : ""}`}
                onClick={() => setAutoRotate((current) => !current)}
                type="button"
              >
                {autoRotateEnabled ? "Stop Rotation" : "Auto Rotate"}
              </button>
              <button className="ghost-button" onClick={toggleFullscreen} type="button">
                {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
              </button>
            </>
          ) : (
            <p className="broadcast-control-note">
              Use your phone&apos;s browser controls for fullscreen and orientation.
            </p>
          )}
        </div>
      </section>

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
                <strong>{sceneMeta.label} scene</strong>
                <span className="muted">
                  {sceneMeta.description} · {snapshot.broadcast.completedEvents} complete /{" "}
                  {snapshot.broadcast.totalEvents} total
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

      {(scene === "overview" || scene === "spotlight") && (
        <section className="broadcast-chase-grid">
          <article className="stat-card broadcast-spotlight-card">
            <p className="kicker">Front Runner</p>
            {leader && leaderPlayer ? (
              <div className="broadcast-leader-lockup">
                <Avatar player={leaderPlayer} size={scene === "spotlight" ? 120 : 88} />
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
            <p className="kicker">{scene === "spotlight" ? "Closest Threats" : "Chasing Pack"}</p>
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
      )}

      {(scene === "overview" || scene === "podium" || scene === "schedule") && (
        <section className="broadcast-main-grid">
          {(scene === "overview" || scene === "podium") && (
            <section>
              <div className="section-row">
                <h2 className="section-title">Podium</h2>
                <span className="broadcast-section-meta">Top three on the day</span>
              </div>
              <div className={`podium broadcast-podium ${scene === "podium" ? "broadcast-podium-focus" : ""}`}>
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
                          <Avatar player={player} size={scene === "podium" ? 126 : 96} />
                        </div>
                      </div>
                      <h3 className="player-name">{player.nickname || player.name}</h3>
                      <p className="muted">{row.totalPoints} pts</p>
                      {row.bestEvent ? <span className="pill">Best swing: {row.bestEvent}</span> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <aside className="broadcast-side-stack">
            {(scene === "overview" || scene === "schedule") && (
              <article className="panel broadcast-side-card">
                <div className="section-row" style={{ marginTop: 0 }}>
                  <h2 className="section-title">Event Radar</h2>
                </div>
                <div className="broadcast-radar-list">
                  {radarEvents.map((event) => (
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
                {scene !== "schedule" && snapshot.events.length > radarEvents.length ? (
                  <p className="muted" style={{ marginTop: 12 }}>
                    +{snapshot.events.length - radarEvents.length} more events in the full schedule scene
                  </p>
                ) : null}
              </article>
            )}

            <article className="panel broadcast-side-card">
              <div className="section-row" style={{ marginTop: 0 }}>
                <h2 className="section-title">
                  {scene === "podium" ? "Podium Storylines" : "Points Race"}
                </h2>
              </div>
              <p className="muted">
                {leader
                  ? `${leader.totalPoints} is the number to beat. Every placement still matters.`
                  : "Score the first event to kick off the standings race."}
              </p>
            </article>
          </aside>
        </section>
      )}

      {(scene === "spotlight" || scene === "schedule") && (
        <section className="broadcast-scene-panel-grid">
          <article className="panel broadcast-side-card broadcast-spotlight-stage">
            <div className="section-row" style={{ marginTop: 0 }}>
              <h2 className="section-title">{scene === "spotlight" ? "Live Spotlight" : "Scene Notes"}</h2>
            </div>
            <div className="broadcast-spotlight-copy">
              <p className="kicker">Now Playing</p>
              <h3 className="broadcast-stage-title">{liveEvent?.name ?? "Waiting on the whistle"}</h3>
              <p className="muted">
                {liveEvent
                  ? `${formatEventStatus(liveEvent)} · ${liveEvent.kind === "team" ? "Team event" : "Individual event"}`
                  : "No active event selected right now."}
              </p>
              {leaderPlayer ? (
                <div className="broadcast-stage-leader">
                  <Avatar player={leaderPlayer} size={104} />
                  <div>
                    <p className="kicker">Featured Leader</p>
                    <h4>{leaderPlayer.nickname || leaderPlayer.name}</h4>
                    <p className="muted">{leader?.totalPoints ?? 0} pts total</p>
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <article className="panel broadcast-side-card">
            <div className="section-row" style={{ marginTop: 0 }}>
              <h2 className="section-title">Standings</h2>
            </div>
            <div className="broadcast-spotlight-table">
              <LeaderboardTable rows={snapshot.leaderboard.slice(0, 5)} snapshot={snapshot} />
            </div>
          </article>
        </section>
      )}

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
