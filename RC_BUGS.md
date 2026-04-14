# RC Bugs

This file tracks only release-candidate blockers and other issues that are serious enough to delay `event-summer-2026-rc.1`.

## Open

No open RC blockers are currently logged.

## Resolved

### RC-001: Event preview deployment was protected by Vercel Authentication

- Severity: blocker
- Status: resolved
- Area: deployment / public access

#### Summary

The deployed `event/summer-2026` preview URL is not publicly accessible. Direct requests to the preview deployment and its admin API routes hit the Vercel Authentication wall unless the requester is already authenticated with Vercel or is using a temporary share token.

#### Evidence

- The active event deployment is a preview deployment, not production:
  - branch alias: `guy-olympics-git-event-summer-2026-romanfaria-5369s-projects.vercel.app`
  - deployment target: preview (`target: null`)
- Direct `curl` requests to the preview deployment returned the Vercel Authentication page until a Vercel share URL was used to establish access.
- Public route probes succeeded through authenticated Vercel tooling, but not through unauthenticated direct access.

#### Resolution

The public production deployment is now available at:

- `https://guy-olympics.vercel.app/`

Verified:

- `https://guy-olympics.vercel.app/summer-2026/live` returned `200`
- the production site is serving the event app content publicly

The preview alias is still protected, but it is no longer the release-blocking path for event-day access.

## Passed Checks In This RC Pass

- Local `npm run lint`
- Local `npm test`
- Local `npm run build`
- Deployed `/summer-2026/live` returned `200`
- Deployed `/summer-2026/players` returned `200`
- Deployed `/summer-2026/admin` returned the admin lock screen
- Valid admin login returned `200`
- Invalid passcode attempts returned the expected `401` messaging
- Rate limiting triggered as expected on repeated failed logins
- Authenticated export returned `200`
- Post-logout export returned `401`

## Still Unverified In This RC Pass

These were not exercised automatically in this pass because they mutate live competition state or need an interactive browser/OBS flow:

- player create/edit/delete on the deployed app
- event create/edit/reorder on the deployed app
- partner randomization on the deployed app
- score entry save/clear on the deployed app
- backup import / restore on the deployed app
- two-device live update rehearsal
- fullscreen scene switching and OBS capture workflow
