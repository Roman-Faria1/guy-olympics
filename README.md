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
- Legacy JSON import from the current `index.html` backup shape
- Versioned export route for the new app format
- Supabase-ready SQL schema in `supabase/migrations/0001_init.sql`

## Project structure

- The active app lives in `app/`, `src/`, and `supabase/`
- Legacy single-file HTML prototypes now live in `archive/`
- The archived files are reference-only and are not used by the Next.js app

## Local demo defaults

- Competition slug: `summer-2026`
- Admin passcode: `olympics`

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

## Notes

- The current implementation uses a file-backed store so the app works immediately without standing up Supabase.
- The schema, route contracts, and data model are aligned to the planned Supabase backend.
- Player uploads are stored in `public/uploads/` in this local/demo version.
- If you need to compare the old versions, use the files in `archive/` rather than the repo root.
