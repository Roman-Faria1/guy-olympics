# RC Bugs

This file tracks only release-candidate blockers and other issues that are serious enough to delay `event-summer-2026-rc.1`.

## Open

No open RC blockers are currently logged.

## Resolved

### RC-002: Score entry drafts were being overwritten during live refresh

- Severity: blocker
- Status: resolved in branch
- Area: admin / scoring

#### Summary

While entering placements in admin, the score inputs could reset before save. Background snapshot refreshes were rehydrating the currently selected event's saved values back into the in-progress draft.

#### Impact

- active scoring was unreliable
- operators could lose in-progress inputs before pressing save

#### Resolution

- the selected event draft now only re-seeds when the selected event actually changes
- background snapshot updates no longer overwrite a dirty score draft

### RC-003: Event radar on the live board did not show newly added events consistently

- Severity: medium
- Status: resolved in branch
- Area: live board / broadcast

#### Summary

The live board radar was only rendering a sliced subset of events. Newly added events could exist in admin but not appear in the live schedule/radar if they landed past that cutoff.

#### Impact

- operators could think an event failed to save
- public viewers could see an incomplete schedule

#### Resolution

- the schedule scene now renders the full event list
- the overview scene still stays compact, but now indicates when additional events exist

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
- Manual player add/delete worked on production
- Manual event add/delete worked on production
- Manual score entry stayed stable during live refresh
- Two-device sync worked between desktop admin and phone live board
- Fullscreen live board worked on desktop
- Stream/scene pass looked good in the real viewing setup
- Backup export worked
- Backup import / restore worked

No release-blocking gaps remain from the production rehearsal pass.
