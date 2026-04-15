# RC Checklist

This checklist is for taking `event/summer-2026` from the current beta line to `event-summer-2026-rc.1`.

The standard is simple: if the event happened tomorrow, this build should feel safe to run.

For a tighter production walkthrough, use [RC_REHEARSAL_RUNBOOK.md](/home/roman/dev-env/guy_olympics/RC_REHEARSAL_RUNBOOK.md).

## RC Goal

- No known blocker bugs
- Core admin, live, and player flows verified on the deployed app
- Backup and restore verified
- Broadcast scenes verified for stream use
- Auth/session behavior verified
- Two-device sync verified

## Preflight

- [x] Confirm the active branch is `event/summer-2026`
- [x] Confirm Vercel is deploying from `event/summer-2026`
- [x] Confirm local `npm run lint`, `npm test`, and `npm run build` all pass
- [x] Confirm these Supabase migrations are applied in production:
  - [x] `supabase/migrations/0001_init.sql`
  - [x] `supabase/migrations/0002_realtime_public_read.sql`
  - [x] `supabase/migrations/0003_admin_auth_hardening.sql`
- [x] Confirm production env vars are present in Vercel
- [x] Export a fresh backup before rehearsal starts

## Admin Flow

- [x] Log in successfully with the shared passcode
- [x] Confirm invalid passcode attempts show the expected error
- [x] Confirm rate limiting triggers after repeated failures
- [x] Confirm logout works and protected admin routes require a new login
- [x] Add a player
- [x] Edit a player
- [x] Upload a player photo
- [x] Delete a player
- [x] Confirm roster counts and cards match the database state after changes
- [x] Add a new event
- [x] Rename an event
- [x] Reorder events
- [x] Toggle a live event from the score-entry panel

## Scoring And Results

- [x] Save placements for an individual event
- [x] Save placements for a team event
- [x] Confirm validation catches invalid or conflicting placements
- [x] Confirm intentional ties are allowed and surfaced clearly
- [x] Confirm clearing an event requires explicit confirmation
- [x] Refresh the page and confirm saved results persist

## Partners

- [x] Randomize partners
- [x] Confirm partner groups render correctly in admin
- [x] Confirm team-event scoring respects shared partner assignments

## Public Views

- [x] Open `/{competitionSlug}/live`
- [x] Open `/{competitionSlug}/players`
- [x] Confirm the live board renders standings correctly
- [x] Confirm player cards render correctly
- [x] Confirm uploaded player photos render correctly

## Broadcast Check

- [x] Open the live board in fullscreen
- [x] Switch through all scenes:
  - [x] `overview`
  - [x] `podium`
  - [x] `spotlight`
  - [x] `schedule`
- [x] Confirm scene query params work:
  - [x] `?scene=overview`
  - [x] `?scene=podium`
  - [x] `?scene=spotlight`
  - [x] `?scene=schedule`
- [x] Confirm the page is clean enough for OBS/browser capture

## Two-Device Sync

- [x] Open admin in one browser/device
- [x] Open live board in a second browser/device
- [x] Change a score in admin
- [x] Confirm the live board updates quickly without a manual refresh
- [x] Change a player or event detail
- [x] Confirm the public views update as expected

## Recovery

- [x] Export the current backup
- [x] Import the rehearsal seed backup
- [x] Confirm the seeded state restores correctly
- [x] Re-import the exported backup
- [x] Confirm the original event state is restored cleanly

## Release Candidate Triage

Only fix issues that affect:

- correctness
- recoverability
- deployment reliability
- stream readability
- active scoring usability

Do not add new features here unless they directly unblock rehearsal or event-day operation.

## RC Decision

You are ready to tag `event-summer-2026-rc.1` when:

- [x] No blocker bugs remain
- [x] The full checklist has been completed on the deployed app
- [x] Backup export and restore both worked
- [x] Auth and rate limiting behaved as expected
- [x] Broadcast scenes were tested successfully
- [x] At least one two-device sync rehearsal was successful
- [x] The team is comfortable freezing features and only taking bug fixes
