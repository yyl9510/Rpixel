# Make shooters manually launch and return to waiting

- task_id: task-20260530-152048-323154-make-shooters-manually-launch-and-return-to-waiting
- branch: work/20260530-152047-492719-make-shooters-manually-launch-and-return-to-waiting
- branch_slug: work__20260530-152047-492719-make-shooters-manually-launch-and-return-to-waiting
- created_utc: 2026-05-30T15:20:48Z
- status: active

## Description
User requests: death only when waiting area exceeds five; both bottom reserve columns and five waiting slots are manually clickable to launch; at most five shooters can be on the track; remove question-mark/mystery shooters so colors are visible; every clicked shooter launches from lower-left, runs exactly one counterclockwise lap, then returns to waiting instead of staying off-track or spinning forever when no targets exist.

## Review Brief
### Original Request
User requests: death only when waiting area exceeds five; both bottom reserve columns and five waiting slots are manually clickable to launch; at most five shooters can be on the track; remove question-mark/mystery shooters so colors are visible; every clicked shooter launches from lower-left, runs exactly one counterclockwise lap, then returns to waiting instead of staying off-track or spinning forever when no targets exist.

### Assigned Scope
- Make bottom reserve shooters launch directly to the track when clicked, regardless of currently exposed colors.
- Make waiting-slot shooters manually clickable so they can be relaunched.
- Limit active track shooters to five while making failure depend only on waiting-area overflow beyond five.
- Ensure each launched shooter starts from the lower-left track point, completes exactly one counterclockwise lap, and then returns to waiting if ammo remains.
- Remove question-mark/mystery presentation so queued shooter colors remain visible.

### Deliverables
- Manual launch state flow for reserve and waiting shooters in `GameScene`.
- One-lap orbit completion and return-to-waiting behavior.
- Waiting overflow failure panel and debug waiting-slot state.
- Non-mystery level queue data while preserving per-color ammo balance.
- Updated smoke tests for manual waiting launches, active cap, overflow failure, one-shot-per-step firing, and full completion.

### Validation Plan
- `npm run typecheck`
- `npm run test:smoke`
- `npm run check`

### Constraints And Non-Goals
- Keep the change scoped to the current H5 single-level gameplay implementation.
- Preserve three-column reserve advancement and color/ammo balancing.
- Do not add backend, ads, or unrelated UI systems.

### Claimed Output
- Clicking a reserve shooter now sends it to the track directly even when it cannot currently shoot.
- Clicking a waiting-slot shooter relaunches it to the track when active shooters are below five.
- Active shooters are capped at five; extra clicks are ignored rather than causing death.
- A shooter runs one full lap and then either disappears if ammo is exhausted or returns to the leftmost waiting slot.
- Failure occurs only when a returning shooter would overflow the five waiting slots.
- Queued shooters show their true color instead of question-mark mystery tokens.

### Artifacts And Evidence
- Changed files: `src/game/data/levels.ts`, `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Validation passed: `npm run typecheck`.
- Validation passed: `npm run test:smoke` (`5 passed`).
- Validation passed: `npm run check`.

## Steps
- 2026-05-30T15:20:48Z: task created
- 2026-05-30T15:30:45Z: Make shooters manually launch and return to waiting
