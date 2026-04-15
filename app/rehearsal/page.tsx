import Link from "next/link";

export const metadata = {
  title: "Event Runbook",
};

const checklist = [
  "Export the current competition state before loading the rehearsal backup.",
  "Import the rehearsal backup from the admin page and wait for the roster, events, and scores to refresh.",
  "Open the admin console, live board, and players page in separate tabs or devices.",
  "Verify the current live event, leaderboard, and player scouting cards all match the rehearsal scenario.",
  "Edit one player, update one event name, redraw partners, and save scores for the live event.",
  "Confirm the live board updates quickly on the second screen without a manual refresh.",
  "Upload one replacement player photo and confirm it renders on both admin and public pages.",
  "Clear one event, restore it from score entry, and verify standings recover correctly.",
  "Download a fresh export backup after rehearsal and restore your original event backup when finished.",
];

const routeChecks = [
  "/summer-2026/admin",
  "/summer-2026/live",
  "/summer-2026/players",
];

export default function RehearsalPage() {
  return (
    <main className="landing-shell">
      <section className="hero-panel">
        <p className="eyebrow">Event-Day Ops</p>
        <h1>Pre-Event Runbook</h1>
        <p className="hero-copy">
          Run one full dress rehearsal before the real event. This page gives you a rehearsal backup
          plus a concise runbook to verify scoring, stream output, and recovery flow end to end.
        </p>
        <div className="route-actions" style={{ marginTop: 20 }}>
          <a href="/rehearsal/summer-2026-seed.json">Download Rehearsal Backup</a>
          <Link href="/summer-2026/admin">Open Admin</Link>
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
            <h2 className="section-title">Rehearsal Scenario</h2>
          </div>
          <div className="metric-grid">
            <div className="metric">
              <span className="metric-label">Players</span>
              <span className="metric-value">6 active competitors</span>
            </div>
            <div className="metric">
              <span className="metric-label">Completed Events</span>
              <span className="metric-value">3 scored events</span>
            </div>
            <div className="metric">
              <span className="metric-label">Live Event</span>
              <span className="metric-value">Relay Chug</span>
            </div>
            <div className="metric">
              <span className="metric-label">Partner Draw</span>
              <span className="metric-value">3 preset groups</span>
            </div>
          </div>
          <p className="helper-text" style={{ marginTop: 16 }}>
            The rehearsal backup uses the current app export format, so it exercises the same restore path you
            would use for a real backup recovery.
          </p>
        </article>
      </section>

      <section className="route-grid" style={{ marginTop: 24 }}>
        {routeChecks.map((route) => (
          <article className="route-card" key={route}>
            <p className="route-label">Runbook Route</p>
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
