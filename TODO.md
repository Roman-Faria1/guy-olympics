# Event Branch TODOs

This file tracks the production-facing work on the active `event/*` branch.

Current release-tag convention:

- `event-summer-2026-beta.*` for deployed beta checkpoints
- `event-summer-2026-rc.*` for event-ready release candidates
- `v*` tags reserved for the eventual stable full release

## Current priorities

- [x] Replace the local-only datastore with Supabase-backed reads and writes
- [x] Move player photo uploads to Supabase Storage when configured
- [x] Fix admin player removal so deleted players disappear from the UI and database
- [x] Allow Supabase Storage image hosts in Next image config
- [x] Wire Supabase Realtime into deployed clients so the live board updates faster than polling alone
- [ ] Add stronger admin auth/rate limiting before wider sharing
- [ ] Improve the broadcast/live presentation for stream day
- [ ] Add fullscreen / scene-based broadcast modes for OBS and stream operators
- [ ] Restore from the new export format, not just the legacy HTML backup format
- [ ] Add an event-day QA checklist and seeded rehearsal flow

## Merge-back candidates for `main`

- Supabase integration
- Storage upload support
- Realtime snapshot refresh
- generic admin/data fixes
- README and workflow improvements

## Event-branch only work

- production Vercel/Supabase config
- real tournament data
- event-specific styling, copy, and stream polish
