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

- [ ] Confirm the active branch is `event/summer-2026`
- [ ] Confirm Vercel is deploying from `event/summer-2026`
- [ ] Confirm local `npm run lint`, `npm test`, and `npm run build` all pass
- [ ] Confirm these Supabase migrations are applied in production:
  - [ ] `supabase/migrations/0001_init.sql`
  - [ ] `supabase/migrations/0002_realtime_public_read.sql`
  - [ ] `supabase/migrations/0003_admin_auth_hardening.sql`
- [ ] Confirm production env vars are present in Vercel
- [ ] Export a fresh backup before rehearsal starts

## Admin Flow

- [ ] Log in successfully with the shared passcode
- [ ] Confirm invalid passcode attempts show the expected error
- [ ] Confirm rate limiting triggers after repeated failures
- [ ] Confirm logout works and protected admin routes require a new login
- [ ] Add a player
- [ ] Edit a player
- [ ] Upload a player photo
- [ ] Delete a player
- [ ] Confirm roster counts and cards match the database state after changes
- [ ] Add a new event
- [ ] Rename an event
- [ ] Reorder events
- [ ] Toggle a live event from the score-entry panel

## Scoring And Results

- [ ] Save placements for an individual event
- [ ] Save placements for a team event
- [ ] Confirm validation catches invalid or conflicting placements
- [ ] Confirm intentional ties are allowed and surfaced clearly
- [ ] Confirm clearing an event requires explicit confirmation
- [ ] Refresh the page and confirm saved results persist

## Partners

- [ ] Randomize partners
- [ ] Confirm partner groups render correctly in admin
- [ ] Confirm team-event scoring respects shared partner assignments

## Public Views

- [ ] Open `/{competitionSlug}/live`
- [ ] Open `/{competitionSlug}/players`
- [ ] Confirm the live board renders standings correctly
- [ ] Confirm player cards render correctly
- [ ] Confirm uploaded player photos render correctly

## Broadcast Check

- [ ] Open the live board in fullscreen
- [ ] Switch through all scenes:
  - [ ] `overview`
  - [ ] `podium`
  - [ ] `spotlight`
  - [ ] `schedule`
- [ ] Confirm scene query params work:
  - [ ] `?scene=overview`
  - [ ] `?scene=podium`
  - [ ] `?scene=spotlight`
  - [ ] `?scene=schedule`
- [ ] Confirm auto-rotate works
- [ ] Confirm the page is clean enough for OBS/browser capture

## Two-Device Sync

- [ ] Open admin in one browser/device
- [ ] Open live board in a second browser/device
- [ ] Change a score in admin
- [ ] Confirm the live board updates quickly without a manual refresh
- [ ] Change a player or event detail
- [ ] Confirm the public views update as expected

## Recovery

- [ ] Export the current backup
- [ ] Import the rehearsal seed backup
- [ ] Confirm the seeded state restores correctly
- [ ] Re-import the exported backup
- [ ] Confirm the original event state is restored cleanly

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

- [ ] No blocker bugs remain
- [ ] The full checklist has been completed on the deployed app
- [ ] Backup export and restore both worked
- [ ] Auth and rate limiting behaved as expected
- [ ] Broadcast scenes were tested successfully
- [ ] At least one two-device sync rehearsal was successful
- [ ] The team is comfortable freezing features and only taking bug fixes
