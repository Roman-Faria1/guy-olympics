"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { LeaderboardTable, PlayerCard, TopNav } from "@/components/shared";
import { useCompetitionSnapshot } from "@/components/use-competition-snapshot";
import { validateScoreInputs } from "@/lib/score-entry";
import type { CompetitionSnapshot, EventKind, PlayerProfile } from "@/lib/types";

type PlayerFormState = {
  id?: string;
  name: string;
  nickname: string;
  fact: string;
  height: string;
  weight: string;
  vertical: string;
  forty: string;
  bench: string;
  grip: string;
  trashTalk: string;
  soreLoser: string;
  biggestThreat: string;
  weakness: string;
  photoPath: string | null;
};

const EMPTY_PLAYER_FORM: PlayerFormState = {
  name: "",
  nickname: "",
  fact: "",
  height: "",
  weight: "",
  vertical: "",
  forty: "",
  bench: "",
  grip: "",
  trashTalk: "",
  soreLoser: "",
  biggestThreat: "",
  weakness: "",
  photoPath: null,
};

export function AdminDashboard({
  competitionSlug,
  authenticated,
  initialSnapshot,
}: {
  competitionSlug: string;
  authenticated: boolean;
  initialSnapshot: CompetitionSnapshot;
}) {
  const [snapshot, setSnapshot] = useCompetitionSnapshot(competitionSlug, initialSnapshot, 3500);
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [passcode, setPasscode] = useState("");
  const [playerForm, setPlayerForm] = useState<PlayerFormState>(EMPTY_PLAYER_FORM);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventKind, setEventKind] = useState<EventKind>("individual");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedEventId && snapshot.events[0]) {
      setSelectedEventId(snapshot.events[0].id);
    }
  }, [selectedEventId, snapshot.events]);

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    const entries = snapshot.resultsByEventId[selectedEventId] ?? [];
    setScoreInputs(
      Object.fromEntries(entries.map((entry) => [entry.playerId, String(entry.placement)])),
    );
  }, [selectedEventId, snapshot.resultsByEventId]);

  const selectedEvent = snapshot.events.find((event) => event.id === selectedEventId) ?? null;
  const activePlayers = useMemo(
    () => snapshot.players.filter((player) => player.active),
    [snapshot.players],
  );
  const savedEntriesForSelectedEvent = selectedEventId
    ? snapshot.resultsByEventId[selectedEventId] ?? []
    : [];
  const scoreValidation = useMemo(
    () =>
      validateScoreInputs({
        scoreInputs,
        players: snapshot.players,
        event: selectedEvent,
        partnerGroups: snapshot.partnerGroups,
      }),
    [scoreInputs, selectedEvent, snapshot.partnerGroups, snapshot.players],
  );
  const hasSavedScores = savedEntriesForSelectedEvent.length > 0;

  async function refreshSnapshot() {
    const response = await fetch(`/api/competition/${competitionSlug}/snapshot`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Failed to refresh");
    }

    const nextSnapshot = (await response.json()) as CompetitionSnapshot;
    setSnapshot(nextSnapshot);
  }

  function startEdit(player: PlayerProfile) {
    setPlayerForm({
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      fact: player.fact,
      height: player.height,
      weight: player.weight,
      vertical: player.vertical,
      forty: player.forty,
      bench: player.bench,
      grip: player.grip,
      trashTalk: player.trashTalk,
      soreLoser: player.soreLoser,
      biggestThreat: player.biggestThreat,
      weakness: player.weakness,
      photoPath: player.photoPath,
    });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/admin/${competitionSlug}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passcode }),
    });

    if (!response.ok) {
      setToast("Passcode did not match");
      return;
    }

    setIsAuthenticated(true);
    setPasscode("");
    await refreshSnapshot();
    setToast("Admin unlocked");
  }

  async function handleLogout() {
    await fetch(`/api/admin/${competitionSlug}/logout`, { method: "POST" });
    setIsAuthenticated(false);
    setToast("Admin locked");
  }

  async function uploadPhoto(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("competitionSlug", competitionSlug);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const payload = (await response.json()) as { photoPath: string };
    return payload.photoPath;
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingPhoto(true);
      const photoPath = await uploadPhoto(file);
      setPlayerForm((current) => ({ ...current, photoPath }));
      setToast("Photo uploaded");
    } catch {
      setToast("Photo upload failed");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  async function handlePlayerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/admin/${competitionSlug}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(playerForm),
    });

    if (!response.ok) {
      setToast("Could not save player");
      return;
    }

    setPlayerForm(EMPTY_PLAYER_FORM);
    await refreshSnapshot();
    setToast("Player saved");
  }

  async function handlePlayerDelete(playerId: string) {
    if (!window.confirm("Remove this player and all of their scores from this competition?")) {
      return;
    }

    const response = await fetch(`/api/admin/${competitionSlug}/players`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerId }),
    });

    if (!response.ok) {
      setToast("Could not remove player");
      return;
    }

    await refreshSnapshot();
    setPlayerForm((current) => (current.id === playerId ? EMPTY_PLAYER_FORM : current));
    setToast("Player removed");
  }

  async function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/admin/${competitionSlug}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: eventName,
        kind: eventKind,
      }),
    });

    if (!response.ok) {
      setToast("Could not save event");
      return;
    }

    setEventName("");
    setEventKind("individual");
    await refreshSnapshot();
    setToast("Event saved");
  }

  async function renameEvent(eventId: string, currentName: string, kind: EventKind) {
    const name = window.prompt("Rename event", currentName)?.trim();
    if (!name || name === currentName) {
      return;
    }

    const response = await fetch(`/api/admin/${competitionSlug}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: eventId,
        name,
        kind,
      }),
    });

    if (!response.ok) {
      setToast("Could not rename event");
      return;
    }

    await refreshSnapshot();
    setToast("Event updated");
  }

  async function moveEvent(eventId: string, direction: "up" | "down") {
    const response = await fetch(`/api/admin/${competitionSlug}/events`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, direction }),
    });

    if (!response.ok) {
      setToast("Could not reorder event");
      return;
    }

    await refreshSnapshot();
  }

  async function deleteEvent(eventId: string) {
    if (!window.confirm("Delete this event and its scores?")) {
      return;
    }

    const response = await fetch(`/api/admin/${competitionSlug}/events`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      setToast("Could not delete event");
      return;
    }

    await refreshSnapshot();
    setToast("Event deleted");
  }

  async function toggleLiveEvent(eventId: string) {
    const liveEvent = snapshot.events.find((event) => event.status === "live");
    const response = await fetch(`/api/admin/${competitionSlug}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: liveEvent?.id === eventId ? null : eventId,
      }),
    });

    if (!response.ok) {
      setToast("Could not update live event");
      return;
    }

    await refreshSnapshot();
  }

  async function redrawPartners() {
    const response = await fetch(`/api/admin/${competitionSlug}/partners`, {
      method: "POST",
    });

    if (!response.ok) {
      setToast("Could not redraw partners");
      return;
    }

    await refreshSnapshot();
    setToast("Partner draw updated");
  }

  async function saveScores(clear = false) {
    if (!selectedEventId) {
      return;
    }

    if (clear) {
      if (!window.confirm(`Clear all saved scores for ${selectedEvent?.name ?? "this event"}?`)) {
        return;
      }
    } else {
      if (scoreValidation.errors.length > 0) {
        setToast(scoreValidation.errors[0]);
        return;
      }

      if (
        scoreValidation.warnings.length > 0 &&
        !window.confirm(
          [
            `Save scores for ${selectedEvent?.name ?? "this event"}?`,
            "",
            ...scoreValidation.warnings,
          ].join("\n"),
        )
      ) {
        return;
      }
    }

    const response = await fetch(`/api/admin/${competitionSlug}/results`, {
      method: clear ? "DELETE" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        clear
          ? { eventId: selectedEventId }
          : {
              eventId: selectedEventId,
              placements: Object.entries(scoreInputs).map(([playerId, placement]) => ({
                playerId,
                placement: Number(placement),
              })),
            },
      ),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setToast(payload?.error ?? (clear ? "Could not clear scores" : "Could not save scores"));
      return;
    }

    await refreshSnapshot();
    setToast(clear ? "Scores cleared" : "Scores saved");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);
      const text = await file.text();
      const backup = JSON.parse(text);
      const response = await fetch(`/api/admin/${competitionSlug}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ backup }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setToast(payload?.error ?? "Import failed");
        return;
      }

      await refreshSnapshot();
      setToast("Backup restored");
    } catch {
      setToast("Import failed");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="app-shell">
        <header className="page-hero">
          <p className="eyebrow">Admin Access</p>
          <h1>{snapshot.competition.name}</h1>
          <p className="hero-meta">Use the shared commissioner passcode to unlock scoring and setup tools.</p>
        </header>

        <section className="admin-lock">
          <form className="field" onSubmit={handleLogin}>
            <label htmlFor="passcode">Passcode</label>
            <input
              id="passcode"
              onChange={(event) => setPasscode(event.target.value)}
              type="password"
              value={passcode}
            />
            <div className="button-row">
              <button className="button" type="submit">
                Unlock Admin
              </button>
              <a className="ghost-button" href={`/${competitionSlug}/live`}>
                View Live Board
              </a>
            </div>
          </form>
        </section>

        {toast ? <div className="toast">{toast}</div> : null}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="page-hero">
        <p className="eyebrow">Commissioner Console</p>
        <h1>{snapshot.competition.name}</h1>
        <p className="hero-meta">
          Roster, scoring, livestream state, and import/export from one shared admin surface.
        </p>
      </header>

      <div className="topbar">
        <TopNav competitionSlug={competitionSlug} />
        <div className="inline-actions">
          <a className="ghost-button" href="/rehearsal">
            Rehearsal Kit
          </a>
          <a className="ghost-button" href="/rehearsal/summer-2026-seed.json">
            Download Seed
          </a>
          <a className="ghost-button" href={`/api/admin/${competitionSlug}/export`}>
            Export Backup
          </a>
          <label className="small-button" htmlFor="legacy-import">
            {importing ? "Importing..." : "Import Backup JSON"}
          </label>
          <input
            accept=".json"
            hidden
            id="legacy-import"
            onChange={handleImport}
            type="file"
          />
          <button className="ghost-button" onClick={handleLogout} type="button">
            Lock Admin
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <p className="kicker">Players</p>
          <h3>{activePlayers.length}</h3>
        </article>
        <article className="stat-card">
          <p className="kicker">Events Scored</p>
          <h3>
            {snapshot.broadcast.completedEvents}/{snapshot.broadcast.totalEvents}
          </h3>
        </article>
        <article className="stat-card">
          <p className="kicker">Live Event</p>
          <h3>{snapshot.events.find((event) => event.status === "live")?.name ?? "None"}</h3>
        </article>
      </section>

      <section className="panel-grid">
        <div className="admin-stage">
          <div className="section-row">
            <h2 className="section-title">Roster</h2>
          </div>
          <form onSubmit={handlePlayerSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="player-name">Name</label>
                <input
                  id="player-name"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  value={playerForm.name}
                />
              </div>
              <div className="field">
                <label htmlFor="player-nick">Nickname</label>
                <input
                  id="player-nick"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, nickname: event.target.value }))
                  }
                  value={playerForm.nickname}
                />
              </div>
              <div className="field">
                <label htmlFor="player-height">Height</label>
                <input
                  id="player-height"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, height: event.target.value }))
                  }
                  value={playerForm.height}
                />
              </div>
              <div className="field">
                <label htmlFor="player-weight">Weight</label>
                <input
                  id="player-weight"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, weight: event.target.value }))
                  }
                  value={playerForm.weight}
                />
              </div>
              <div className="field">
                <label htmlFor="player-vertical">Vertical</label>
                <input
                  id="player-vertical"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, vertical: event.target.value }))
                  }
                  value={playerForm.vertical}
                />
              </div>
              <div className="field">
                <label htmlFor="player-forty">40-Yard</label>
                <input
                  id="player-forty"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, forty: event.target.value }))
                  }
                  value={playerForm.forty}
                />
              </div>
              <div className="field">
                <label htmlFor="player-bench">Bench</label>
                <input
                  id="player-bench"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, bench: event.target.value }))
                  }
                  value={playerForm.bench}
                />
              </div>
              <div className="field">
                <label htmlFor="player-grip">Grip</label>
                <input
                  id="player-grip"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, grip: event.target.value }))
                  }
                  value={playerForm.grip}
                />
              </div>
              <div className="field">
                <label htmlFor="player-trash">Trash Talk</label>
                <input
                  id="player-trash"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, trashTalk: event.target.value }))
                  }
                  value={playerForm.trashTalk}
                />
              </div>
              <div className="field">
                <label htmlFor="player-loser">Sore Loser</label>
                <input
                  id="player-loser"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, soreLoser: event.target.value }))
                  }
                  value={playerForm.soreLoser}
                />
              </div>
              <div className="field">
                <label htmlFor="player-threat">Biggest Threat</label>
                <input
                  id="player-threat"
                  onChange={(event) =>
                    setPlayerForm((current) => ({
                      ...current,
                      biggestThreat: event.target.value,
                    }))
                  }
                  value={playerForm.biggestThreat}
                />
              </div>
              <div className="field">
                <label htmlFor="player-weakness">Weakness</label>
                <input
                  id="player-weakness"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, weakness: event.target.value }))
                  }
                  value={playerForm.weakness}
                />
              </div>
            </div>

            <div className="form-grid full" style={{ marginTop: 12 }}>
              <div className="field">
                <label htmlFor="player-fact">Fun Fact / Statement</label>
                <textarea
                  id="player-fact"
                  onChange={(event) =>
                    setPlayerForm((current) => ({ ...current, fact: event.target.value }))
                  }
                  value={playerForm.fact}
                />
              </div>
              <div className="field">
                <label htmlFor="player-photo">Player Photo</label>
                <div className="file-input">
                  <input id="player-photo" onChange={handlePhotoChange} type="file" />
                  <span className="helper-text">
                    {uploadingPhoto
                      ? "Uploading..."
                      : playerForm.photoPath
                        ? "Photo ready"
                        : "Optional"}
                  </span>
                </div>
              </div>
            </div>

            <div className="button-row" style={{ marginTop: 16 }}>
              <button className="button" type="submit">
                {playerForm.id ? "Save Player" : "Add Player"}
              </button>
              {playerForm.id ? (
                <button
                  className="ghost-button"
                  onClick={() => setPlayerForm(EMPTY_PLAYER_FORM)}
                  type="button"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="admin-stage">
          <div className="section-row">
            <h2 className="section-title">Events</h2>
          </div>
          <form onSubmit={handleEventSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="event-name">Event Name</label>
                <input
                  id="event-name"
                  onChange={(event) => setEventName(event.target.value)}
                  required
                  value={eventName}
                />
              </div>
              <div className="field">
                <label htmlFor="event-kind">Type</label>
                <select
                  id="event-kind"
                  onChange={(event) => setEventKind(event.target.value as EventKind)}
                  value={eventKind}
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                </select>
              </div>
            </div>
            <div className="button-row" style={{ marginTop: 16 }}>
              <button className="button" type="submit">
                Add Event
              </button>
            </div>
          </form>

          <div className="event-grid" style={{ marginTop: 20 }}>
            {snapshot.events.map((event) => (
              <article className="event-card" key={event.id}>
                <div className="event-header">
                  <span className="pill kind">{event.kind}</span>
                  <span
                    className={`pill ${event.status === "live" ? "live" : event.status === "completed" ? "complete" : ""}`}
                  >
                    {event.status}
                  </span>
                </div>
                <h3 className="panel-title" style={{ fontSize: "1.6rem" }}>
                  {event.name}
                </h3>
                <div className="event-actions">
                  <button
                    className="ghost-button"
                    onClick={() => renameEvent(event.id, event.name, event.kind)}
                    type="button"
                  >
                    Rename
                  </button>
                  <button className="small-button" onClick={() => moveEvent(event.id, "up")} type="button">
                    Move Up
                  </button>
                  <button className="small-button" onClick={() => moveEvent(event.id, "down")} type="button">
                    Move Down
                  </button>
                  <button className="ghost-button" onClick={() => toggleLiveEvent(event.id)} type="button">
                    {event.status === "live" ? "Stop Live" : "Go Live"}
                  </button>
                  <button className="danger-button" onClick={() => deleteEvent(event.id)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-grid" style={{ marginTop: 24 }}>
        <div className="admin-stage">
          <div className="section-row">
            <h2 className="section-title">Partner Draw</h2>
            <button className="button" onClick={redrawPartners} type="button">
              Random Draw
            </button>
          </div>
          <div className="partner-grid">
            {snapshot.partnerGroups.length ? (
              snapshot.partnerGroups.map((group) => (
                <article className="panel" key={group.id}>
                  <p className="kicker">Group {group.groupNumber}</p>
                  {group.playerIds.map((playerId) => {
                    const player = snapshot.players.find((entry) => entry.id === playerId);
                    return player ? <div key={playerId}>{player.name}</div> : null;
                  })}
                </article>
              ))
            ) : (
              <p className="helper-text">Run a random draw once the roster is ready.</p>
            )}
          </div>
        </div>

        <div className="admin-stage">
          <div className="section-row">
            <h2 className="section-title">Score Entry</h2>
            {selectedEvent ? (
              <button className="ghost-button" onClick={() => toggleLiveEvent(selectedEvent.id)} type="button">
                {selectedEvent.status === "live" ? "Stop Live" : "Mark Live"}
              </button>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="score-event">Event</label>
            <select
              id="score-event"
              onChange={(event) => setSelectedEventId(event.target.value)}
              value={selectedEventId}
            >
              {snapshot.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          {selectedEvent ? (
            <div style={{ marginTop: 16 }}>
              <div className="score-summary-grid">
                <div className="metric">
                  <span className="metric-label">Event Status</span>
                  <span className="metric-value">{selectedEvent.status}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Draft Coverage</span>
                  <span className="metric-value">
                    {scoreValidation.filledUnits}/{scoreValidation.expectedUnits} {scoreValidation.unitLabel}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Saved Entries</span>
                  <span className="metric-value">{savedEntriesForSelectedEvent.length}</span>
                </div>
              </div>
              <p className="helper-text">
                {selectedEvent.kind === "team"
                  ? "Enter one shared finish per partner group. If you fill both teammates, the placements must match."
                  : "Enter finishing place for each player. Leaving someone blank keeps them unscored for now."}
              </p>
              {scoreValidation.errors.length > 0 ? (
                <div className="alert error" role="alert">
                  {scoreValidation.errors.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}
              {scoreValidation.warnings.length > 0 ? (
                <div className="alert warning">
                  {scoreValidation.warnings.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}
              <div className="event-grid" style={{ marginTop: 16 }}>
                {activePlayers.map((player) => (
                  <article className="score-card" key={player.id}>
                    <strong>{player.name}</strong>
                    <div className="field" style={{ marginTop: 10 }}>
                      <label htmlFor={`score-${player.id}`}>Placement</label>
                      <input
                        id={`score-${player.id}`}
                        className={
                          scoreValidation.invalidPlayerIds.includes(player.id) ? "input-invalid" : undefined
                        }
                        min={1}
                        onChange={(event) =>
                          setScoreInputs((current) => ({
                            ...current,
                            [player.id]: event.target.value,
                          }))
                        }
                        type="number"
                        value={scoreInputs[player.id] ?? ""}
                      />
                    </div>
                  </article>
                ))}
              </div>
              <div className="button-row" style={{ marginTop: 18 }}>
                <button
                  className="button"
                  disabled={scoreValidation.errors.length > 0}
                  onClick={() => saveScores(false)}
                  type="button"
                >
                  Save Scores
                </button>
                <button
                  className="danger-button"
                  disabled={!hasSavedScores}
                  onClick={() => saveScores(true)}
                  type="button"
                >
                  Clear Event
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="section-row">
          <h2 className="section-title">Roster Cards</h2>
        </div>
        <div className="player-grid">
          {activePlayers.map((player) => (
            <div key={player.id}>
              <PlayerCard player={player} />
              <div className="button-row" style={{ marginTop: 12 }}>
                <button className="ghost-button" onClick={() => startEdit(player)} type="button">
                  Edit
                </button>
                <button
                  className="danger-button"
                  onClick={() => handlePlayerDelete(player.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="section-row">
          <h2 className="section-title">Leaderboard Preview</h2>
        </div>
        <LeaderboardTable rows={snapshot.leaderboard} snapshot={snapshot} />
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}
