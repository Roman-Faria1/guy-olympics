import Link from "next/link";

import { DEMO_COMPETITION_SLUG } from "@/lib/constants";

export const metadata = {
  title: "Tournament Rehearsal",
};

const checklist = [
  "Export the current competition state before importing the rehearsal seed.",
  "Import the seeded backup from the admin page and wait for the roster, events, and scores to refresh.",
  "Open the admin console, live board, and players page in separate tabs or devices.",
  "Verify the current live event, leaderboard, and player scouting cards all match the seeded scenario.",
  "Edit one player, update one event name, redraw partners, and save scores for the live event.",
  "Confirm the live board updates quickly on the second screen without a manual refresh.",
  "Upload one replacement player photo and confirm it renders on both admin and public pages.",
  "Clear one event, restore it from score entry, and verify standings recover correctly.",
  "Download a fresh export backup after rehearsal and restore your original event backup when finished.",
];

const routeChecks = [
  `/${DEMO_COMPETITION_SLUG}/admin`,
  `/${DEMO_COMPETITION_SLUG}/live`,
  `/${DEMO_COMPETITION_SLUG}/players`,
];

export default function RehearsalPage() {
  return (
    <main className="landing-shell">
      <section className="hero-panel">
        <p className="eyebrow">Tournament QA</p>
        <h1>Rehearsal Kit</h1>
        <p className="hero-copy">
          Run one full practice pass before the real event. This kit gives you a seeded backup plus a
          simple checklist so you can verify scoring, stream output, and recovery flow end to end.
        </p>
        <div className="route-actions" style={{ marginTop: 20 }}>
          <a href="/rehearsal/example-seed.json">Download Sample Seed</a>
          <Link href={`/${DEMO_COMPETITION_SLUG}/admin`}>Open Demo Admin</Link>
        </div>
      </section>

      <section className="panel-grid" style={{ marginTop: 24 }}>
        <article className="panel">
          <div className="section-row">
            <h2 className="section-title">Checklist</h2>
          </div>
          <ol className="checklist-list">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="panel">
          <div className="section-row">
            <h2 className="section-title">Seeded Scenario</h2>
          </div>
          <div className="metric-grid">
            <div className="metric">
              <span className="metric-label">Players</span>
              <span className="metric-value">4 active competitors</span>
            </div>
            <div className="metric">
              <span className="metric-label">Completed Events</span>
              <span className="metric-value">2 scored events</span>
            </div>
            <div className="metric">
              <span className="metric-label">Live Event</span>
              <span className="metric-value">Target Toss</span>
            </div>
            <div className="metric">
              <span className="metric-label">Partner Draw</span>
              <span className="metric-value">2 preset groups</span>
            </div>
          </div>
          <p className="helper-text" style={{ marginTop: 16 }}>
            The seed backup uses the current app export format, so it exercises the same restore path you
            would use for a real backup recovery.
          </p>
          <p className="helper-text">
            The route examples below use the default demo competition slug so the rehearsal flow works out
            of the box.
          </p>
        </article>
      </section>

      <section className="route-grid" style={{ marginTop: 24 }}>
        {routeChecks.map((route) => (
          <article className="route-card" key={route}>
            <p className="route-label">Rehearsal Route</p>
            <h2>{route}</h2>
            <p className="helper-text">
              Keep these open during the rehearsal so you can validate admin updates, public standings, and
              scouting cards together.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
