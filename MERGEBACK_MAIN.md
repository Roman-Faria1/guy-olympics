# Merge Back To `main`

This checklist is for selectively moving reusable work from `event/summer-2026` back into the scaffold on `main`.

Do not merge the whole event branch into `main`. Use a short-lived branch from `main` such as `mergeback/main-hardening`, then cherry-pick or manually port only the items below.

## Safe To Move To `main`

These changes are scaffold-worthy and should be part of the reusable starter:

- `.env.example`
- `.gitignore`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `next-env.d.ts`
- `src/lib/supabase.ts`
- `src/lib/store/file-store.ts`
- `src/lib/store/supabase-store.ts`
- `src/lib/auth.ts`
- `src/lib/admin-rate-limit.ts`
- `src/lib/score-entry.ts`
- `src/lib/app-backup.ts`
- `src/components/use-competition-snapshot.ts`
- `src/components/admin-dashboard.tsx`
- `app/api/uploads/route.ts`
- `app/api/admin/[competitionSlug]/login/route.ts`
- `app/api/admin/[competitionSlug]/results/route.ts`
- `app/api/admin/[competitionSlug]/import/route.ts`
- `supabase/migrations/0002_realtime_public_read.sql`
- `supabase/migrations/0003_admin_auth_hardening.sql`
- `tests/score-entry.test.ts`
- `tests/app-backup.test.ts`
- `tests/auth.test.ts`

These are the main reusable feature areas:

- Supabase-backed persistence
- Supabase Storage uploads
- Realtime snapshot refresh
- app-backup export and restore
- score-entry validation and recovery flow
- signed admin sessions
- login rate limiting

## Move To `main` After Small Cleanup

These are probably worth moving, but should be made more generic first:

- `src/components/live-board-client.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/rehearsal/page.tsx`
- `README.md`

Required cleanup before merge:

- Change `Beer Olympics Broadcast` to neutral wording such as `Live Broadcast`
- Rewrite `Rehearsal Kit` copy so it reads as a generic tournament rehearsal flow instead of one specific event
- Make the home-page rehearsal mention template-safe
- Split README guidance into:
  - scaffold/template usage
  - optional event-branch deployment usage

## Leave On `event/summer-2026`

These should stay on the event branch or be replaced with a more generic equivalent:

- `TODO.md`
- `public/rehearsal/summer-2026-seed.json`

These are event-specific:

- release-tag wording that references `event-summer-2026-beta.*`
- the exact rehearsal seed scenario
- any deployment notes that assume this specific tournament branch is production

## Suggested Merge Order

1. Create `mergeback/main-hardening` from `main`
2. Move the reusable data/auth/store/tests first
3. Make the live-board and rehearsal pages generic
4. Update README for template consumers
5. Run:
   - `npm run lint`
   - `npm test`
   - `npm run build`
6. Open a PR into `main`

## Candidate Commit Areas

These event-branch milestones are strong merge-back candidates:

- `feat(supabase): add production datastore and storage support`
- `fix(admin): remove deleted players and allow supabase image hosts`
- `feat(realtime): refresh deployed clients from supabase changes`
- `feat(admin): harden score entry and recovery flow`
- `feat(admin): restore versioned app backups`
- `feat(rehearsal): add event-day qa kit and seeded backup flow` after generic cleanup
- `feat(live): add fullscreen broadcast scenes` after wording cleanup
- `feat(auth): harden admin sessions and rate limit login`

## Current Files Different From `main`

For reference, these files currently differ from `main`:

- `.env.example`
- `.gitignore`
- `README.md`
- `TODO.md`
- `app/api/admin/[competitionSlug]/import/route.ts`
- `app/api/admin/[competitionSlug]/login/route.ts`
- `app/api/admin/[competitionSlug]/results/route.ts`
- `app/api/uploads/route.ts`
- `app/globals.css`
- `app/page.tsx`
- `app/rehearsal/page.tsx`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `public/rehearsal/summer-2026-seed.json`
- `src/components/admin-dashboard.tsx`
- `src/components/live-board-client.tsx`
- `src/components/use-competition-snapshot.ts`
- `src/lib/admin-rate-limit.ts`
- `src/lib/app-backup.ts`
- `src/lib/auth.ts`
- `src/lib/score-entry.ts`
- `src/lib/store/file-store.ts`
- `src/lib/store/supabase-store.ts`
- `src/lib/supabase.ts`
- `supabase/migrations/0002_realtime_public_read.sql`
- `supabase/migrations/0003_admin_auth_hardening.sql`
- `tests/app-backup.test.ts`
- `tests/auth.test.ts`
- `tests/score-entry.test.ts`
