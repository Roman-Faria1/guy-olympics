# Guy Olympics

A Next.js + TypeScript refactor of the original single-file Guy Olympics scorekeeper.

## What is implemented

- App Router project scaffold
- Public routes:
  - `/{competitionSlug}/live`
  - `/{competitionSlug}/players`
- Admin route:
  - `/{competitionSlug}/admin`
- Shared cookie-based admin access with passcode
- File-backed demo datastore in `.data/demo-db.json`
- Automatic Supabase datastore support when env vars are configured
- Backup restore for both the current app export format and the legacy `index.html` backup shape
- Versioned export route for the new app format
- Supabase-ready SQL schema in `supabase/migrations/0001_init.sql`

## Project structure

- The active app lives in `app/`, `src/`, and `supabase/`
- Legacy single-file HTML prototypes now live in `archive/`
- The archived files are reference-only and are not used by the Next.js app

## Branch strategy

- `main` is the reusable scaffold/template branch
- `event/*` branches are for real tournament deployments, production config, and event-specific customization
- `feature/*` branches are optional short-lived branches for individual work streams

What belongs on `main`:

- generic product improvements
- reusable bug fixes
- framework, storage, auth, and deployment improvements that help all future forks

What should stay on `event/*` branches:

- event-specific copy and branding
- real tournament/player data
- production setup decisions that are specific to one event
- one-off changes that make the scaffold less reusable

Recommended workflow:

1. Build and validate real event work on an `event/*` branch
2. Merge only reusable improvements back into `main`
3. Keep `main` safe to fork for future Guy Olympics variants

Release tag convention:

- Use `event-summer-2026-beta.*` for deployed checkpoints on the active event branch
- Use `event-summer-2026-rc.*` for event-ready release candidates
- Reserve `v1.0.0` and later `v*` tags for a polished reusable starter on `main` or a truly stable full release

Merge-back planning:

- Use [MERGEBACK_MAIN.md](/home/roman/dev-env/guy_olympics/MERGEBACK_MAIN.md) to selectively move reusable event-branch work back to `main`

## Local demo defaults

- Competition slug: `summer-2026`
- Admin passcode: `olympics`

## Supabase setup

1. In Supabase SQL Editor, run `supabase/migrations/0001_init.sql`
2. Then run `supabase/migrations/0002_realtime_public_read.sql` to enable Realtime subscriptions and public read policies for the live/public clients
3. Then run `supabase/migrations/0003_admin_auth_hardening.sql` to enable persistent login-attempt rate limiting in production
4. Add these env vars locally and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GO_SUPABASE_STORAGE_BUCKET=player-photos
GO_ADMIN_SESSION_SECRET=
```

5. Create a public Storage bucket named `player-photos`

The app will automatically use Supabase for data and uploads when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present. Without them, it falls back to the local demo store in `.data/demo-db.json`.

When `NEXT_PUBLIC_SUPABASE_URL` and a public browser key are present, the deployed clients also subscribe to Supabase Realtime and trigger immediate snapshot refreshes when competition data changes.

Admin auth notes:

- `GO_ADMIN_SESSION_SECRET` is required in production
- admin sessions expire after 12 hours
- failed login attempts are rate limited by IP/competition slug
- use [ADMIN_PASSCODE.md](/home/roman/dev-env/guy_olympics/ADMIN_PASSCODE.md) to rotate the shared admin passcode or clear a login cooldown

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open:

- `http://localhost:3000/`
- `http://localhost:3000/summer-2026/admin`
- `http://localhost:3000/rehearsal`

## Event-day rehearsal

- Open `/rehearsal` for the QA checklist and seeded rehearsal flow
- Download `/rehearsal/summer-2026-seed.json`
- Export your current competition state from admin before importing the seed
- Import the seed from the admin page to simulate a mid-tournament scenario
- Run the checklist across admin, live board, and players routes
- Restore your real backup when rehearsal is complete
- Use [RC_CHECKLIST.md](/home/roman/dev-env/guy_olympics/RC_CHECKLIST.md) when you are preparing to cut `event-summer-2026-rc.1`

## Broadcast scenes

- The live board now supports operator-facing scenes for overview, podium, spotlight, and schedule
- Use the built-in controls on `/{competitionSlug}/live` to switch scenes, auto-rotate them, or enter fullscreen
- You can also start a scene directly with query params such as `?scene=podium` or `?scene=spotlight&autoplay=1`

## Notes

- The current implementation uses a file-backed store so the app works immediately without standing up Supabase.
- The schema, route contracts, and data model are aligned to the planned Supabase backend.
- Player uploads go to Supabase Storage when configured, and fall back to `public/uploads/` in the local/demo version.
- If you need to compare the old versions, use the files in `archive/` rather than the repo root.
