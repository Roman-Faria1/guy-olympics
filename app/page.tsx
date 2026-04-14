import Link from "next/link";

import { listCompetitions } from "@/lib/store/file-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const competitions = await listCompetitions();

  return (
    <main className="landing-shell">
      <section className="hero-panel">
        <p className="eyebrow">Shared Tournament Ops</p>
        <h1>Tournament Control Room</h1>
        <p className="hero-copy">
          A proper small-scale event app: roster intel, score entry, live board, and a
          stream-safe public view.
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
        <p>Default demo admin passcode: <code>olympics</code></p>
        <p>Data is stored in <code>.data/demo-db.json</code> until Supabase is connected.</p>
        <p>
          Rehearsal kit: <Link href="/rehearsal"><code>/rehearsal</code></Link>
        </p>
      </section>
    </main>
  );
}
