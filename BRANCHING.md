# Branching Guide

This repository uses a split workflow so `main` stays reusable while real tournaments can move quickly on event branches.

## Branch roles

- `main`
  - reusable scaffold/template branch
  - should stay safe to fork
- `event/*`
  - real tournament deployments
  - production config and event-specific customization
- `feature/*`
  - optional short-lived work branches

## What belongs on `main`

- generic product improvements
- reusable bug fixes
- framework, storage, auth, and deployment improvements that help future forks

## What should stay on `event/*`

- event-specific copy and branding
- real tournament/player data
- production setup decisions that are specific to one event
- one-off changes that make the scaffold less reusable

## Recommended workflow

1. Build and validate real event work on an `event/*` branch
2. Merge only reusable improvements back into `main`
3. Keep `main` safe to fork for future tournament variants

## Merge-back planning

Use [MERGEBACK_MAIN.md](/home/roman/dev-env/guy_olympics/MERGEBACK_MAIN.md) to selectively move reusable event-branch work back to `main`.
