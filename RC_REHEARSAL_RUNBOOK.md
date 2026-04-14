# RC Rehearsal Runbook

Use this runbook to rehearse the production event app before cutting `event-summer-2026-rc.1`.

Target environment:

- `https://guy-olympics.vercel.app/summer-2026/admin`
- `https://guy-olympics.vercel.app/summer-2026/live`
- `https://guy-olympics.vercel.app/summer-2026/players`

Goal:

- complete one clean end-to-end production rehearsal
- log only release-critical issues in [RC_BUGS.md](/home/roman/dev-env/guy_olympics/RC_BUGS.md)
- stop feature work unless something directly blocks event-day operation

## Before You Start

1. Open [RC_CHECKLIST.md](/home/roman/dev-env/guy_olympics/RC_CHECKLIST.md).
2. Open [RC_BUGS.md](/home/roman/dev-env/guy_olympics/RC_BUGS.md).
3. Make sure you know the current shared admin passcode.
4. Have two browser sessions ready:
   - Session A: admin operator
   - Session B: public viewer / live board
5. If possible, use two different devices for Session A and Session B.

## Step 1: Preflight

Open these URLs and confirm they load:

- `https://guy-olympics.vercel.app/summer-2026/admin`
- `https://guy-olympics.vercel.app/summer-2026/live`
- `https://guy-olympics.vercel.app/summer-2026/players`

Pass if:

- admin shows the lock screen
- live board loads publicly
- players page loads publicly
- player photos render

Log a blocker if:

- any page returns an error
- public pages require unexpected auth
- photos fail consistently

## Step 2: Safety Backup

In admin:

1. Log in.
2. Click `Export Backup`.
3. Save that file somewhere obvious.

Pass if:

- the file downloads
- the JSON looks complete

Stop and log a blocker if:

- export fails
- the file is empty or malformed

## Step 3: Admin Auth Check

In a fresh private/incognito window:

1. Open the admin URL.
2. Try one intentionally wrong passcode.
3. Confirm the error message is clear.
4. Log in with the correct passcode.
5. Log out.
6. Refresh and confirm admin is locked again.

Pass if:

- wrong passcode shows a clear error
- correct passcode unlocks admin
- logout re-locks admin

Log a blocker if:

- correct login fails
- logout does not re-lock admin
- admin becomes inaccessible due to unexpected cooldown

## Step 4: Roster Flow

Use a clearly temporary rehearsal player name such as `RC Test Player`.

1. Add the rehearsal player.
2. Upload a photo if you want to validate upload flow.
3. Edit one or two profile fields.
4. Confirm the player appears on:
   - admin roster
   - players page
   - live board standings area if applicable
5. Delete the rehearsal player.

Pass if:

- add, edit, upload, and delete all work
- the player count and cards stay in sync

Log a blocker if:

- add/edit/delete fails
- the UI and database drift apart
- deletion leaves broken state

## Step 5: Event Management

Use a temporary rehearsal event name such as `RC Test Event`.

1. Add the event.
2. Rename it once.
3. Reorder it.
4. Mark it live from the score-entry panel.
5. Remove it when done if needed.

Pass if:

- event creation, rename, reorder, and live-state changes all persist
- the live board reflects the current event state

Log a blocker if:

- event order becomes corrupted
- the wrong event is shown as live
- changes do not persist across refresh

## Step 6: Partners

1. Randomize partners.
2. Confirm groups render correctly in admin.
3. Confirm team-event instructions still make sense after randomization.

Pass if:

- partner groups are visible and consistent

Log a blocker if:

- players are duplicated or dropped
- team event scoring becomes unusable

## Step 7: Score Entry

Pick one individual event and one team event.

For the individual event:

1. Enter placements.
2. Intentionally try one invalid input and confirm validation catches it.
3. Save valid results.
4. Refresh and confirm results persist.

For the team event:

1. Enter placements using current partner groups.
2. Confirm team validation behaves correctly.
3. Save valid results.
4. Refresh and confirm results persist.

Pass if:

- validation catches bad inputs
- valid scores save successfully
- results persist after refresh

Log a blocker if:

- scores save incorrectly
- validation blocks valid scoring
- saved results disappear or render wrong

## Step 8: Clear / Recovery Behavior

1. Use `Clear Event` on a rehearsal-scored event.
2. Confirm the confirmation step is explicit.
3. Confirm the event resets cleanly.

Pass if:

- clear is deliberate and predictable

Log a blocker if:

- clear affects the wrong event
- clear cannot be recovered from logically

## Step 9: Two-Device Sync

With admin open in Session A and live board open in Session B:

1. Change one score in Session A.
2. Watch Session B for the update.
3. Change one event detail or live-event status.
4. Watch Session B again.

Pass if:

- Session B updates quickly without manual refresh

Log a blocker if:

- live data stays stale
- updates apply inconsistently

## Step 10: Broadcast Pass

On the live board:

1. Open fullscreen mode.
2. Switch through:
   - `overview`
   - `podium`
   - `spotlight`
   - `schedule`
3. Test auto-rotate.
4. If you use OBS, open the live board as a browser source.

Pass if:

- each scene is readable
- fullscreen works
- auto-rotate works
- the layout feels stream-ready

Log a blocker if:

- a scene breaks
- fullscreen is unusable
- OBS/browser capture shows a serious layout problem

## Step 11: Import / Restore

1. Export a fresh backup again.
2. Import the rehearsal seed backup.
3. Confirm the restored seeded state looks correct.
4. Re-import your saved backup.
5. Confirm your real event state is back.

Pass if:

- both import and restore paths work
- the original state returns cleanly

Log a blocker if:

- import fails
- restore is incomplete
- real data is not recoverable

## Step 12: Final RC Decision

You are ready for `event-summer-2026-rc.1` when:

- no blocker bugs remain open in [RC_BUGS.md](/home/roman/dev-env/guy_olympics/RC_BUGS.md)
- the full runbook completed successfully
- any remaining issues are cosmetic or non-event-critical
- you are comfortable freezing features and taking only bug fixes

## Bug Logging Rule

Only log issues in [RC_BUGS.md](/home/roman/dev-env/guy_olympics/RC_BUGS.md) if they affect:

- correctness
- recoverability
- deployment reliability
- stream readability
- active scoring usability

If something is annoying but safe, note it separately and do not let it delay `rc.1`.
