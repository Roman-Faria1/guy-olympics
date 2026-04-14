"use client";

import { PlayerCard, TopNav } from "@/components/shared";
import { useCompetitionSnapshot } from "@/components/use-competition-snapshot";
import type { CompetitionSnapshot } from "@/lib/types";

export function PlayersClient({
  competitionSlug,
  initialSnapshot,
}: {
  competitionSlug: string;
  initialSnapshot: CompetitionSnapshot;
}) {
  const [snapshot] = useCompetitionSnapshot(competitionSlug, initialSnapshot, 5000);

  return (
    <main className="app-shell">
      <header className="page-hero">
        <p className="eyebrow">Scouting Report</p>
        <h1>{snapshot.competition.name}</h1>
        <p className="hero-meta">
          Livestream-safe player cards, physicals, and all the friendly slander.
        </p>
      </header>

      <div className="topbar">
        <TopNav competitionSlug={competitionSlug} />
        <div className="muted">{snapshot.players.filter((player) => player.active).length} active players</div>
      </div>

      <section className="player-grid">
        {snapshot.players
          .filter((player) => player.active)
          .map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
      </section>
    </main>
  );
}
