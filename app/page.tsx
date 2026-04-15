import Link from "next/link";

import { listCompetitions } from "@/lib/store/file-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const competitions = await listCompetitions();

  return (
    <main className="landing-shell">
      <section className="hero-panel">
        <p className="eyebrow">Game Day HQ</p>
        <h1>Guy Olympics Headquarters</h1>
        <p className="hero-copy">
          Run the whole day from one place: roster intel, score entry, live standings, player
          cards, and a stream-ready public board.
        </p>
      </section>

      <section className="route-grid">
        {competitions.map((competition) => (
          <article className="route-card" key={competition.id}>
            <p className="route-label">{competition.subtitle}</p>
            <h2>{competition.name}</h2>
            <div className="route-actions">
              <Link href={`/${competition.slug}/admin`}>Admin</Link>
              <Link href={`/${competition.slug}/live`}>Live Board</Link>
              <Link href={`/${competition.slug}/players`}>Players</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="info-strip">
        <p>Commissioner access is protected by a shared passcode.</p>
        <p>Live updates sync across admin, standings, and player cards.</p>
        <p>
          Ops runbook: <Link href="/rehearsal"><code>/rehearsal</code></Link>
        </p>
      </section>
    </main>
  );
}
