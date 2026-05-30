# Fix waiting clicks capacity display and slot compaction

- task_id: task-20260530-154920-151329-fix-waiting-clicks-capacity-display-and-slot-compaction
- branch: work/20260530-154919-384356-fix-waiting-clicks-capacity-display-and-slot-compaction
- branch_slug: work__20260530-154919-384356-fix-waiting-clicks-capacity-display-and-slot-compaction
- created_utc: 2026-05-30T15:49:20Z
- status: active

## Description
User reports many reserve/waiting shooters cannot be clicked, all waiting shooters and top-row reserve shooters must launch regardless of available targets while active shooters remain capped at five; left 5-5 label should show active/5 such as 0-5 and 2-5; shooters with ammo reaching zero should disappear immediately instead of waiting for the lap; waiting area must stay left-packed with no holes, shifting right shooters left when any waiting shooter is launched.

## Review Brief
### Original Request
User reports many reserve/waiting shooters cannot be clicked, all waiting shooters and top-row reserve shooters must launch regardless of available targets while active shooters remain capped at five; left 5-5 label should show active/5 such as 0-5 and 2-5; shooters with ammo reaching zero should disappear immediately instead of waiting for the lap; waiting area must stay left-packed with no holes, shifting right shooters left when any waiting shooter is launched.

### Assigned Scope
- Ensure every top-row reserve shooter and every stuck waiting shooter can launch while active shooters are below the five-shooter cap.
- Change the left capacity text from static `5/5` to dynamic active-count text such as `0-5`, `2-5`, and `5-5`.
- Remove active shooters immediately when their ammo reaches zero instead of letting them finish the lap.
- Keep waiting slots left-packed after any waiting shooter launches, shifting right-side shooters left to fill holes.

### Deliverables
- Dynamic active-capacity display and debug label.
- Waiting slot compaction after arbitrary waiting-slot launches.
- Immediate active-shooter removal on ammo exhaustion while projectile resolution still clears blocks.
- Smoke coverage for capacity text, clickable waiting/reserve entries, left-packed waiting slots, overflow failure, and full completion.

### Validation Plan
- `npm run typecheck`
- `npm run test:smoke`
- `npm run check`

### Constraints And Non-Goals
- Preserve current three-column reserve behavior and manual launch/return flow.
- Preserve active shooter cap of five and waiting overflow death condition.
- Avoid unrelated visual or data refactors.

### Claimed Output
- The left capacity display now starts at `0-5`, updates to active shooter count while shooters orbit, and reaches `5-5` at the active cap.
- Waiting slots are compacted from left to right after launching any waiting shooter.
- Top-row reserve and waiting shooters launch independent of whether a matching block is currently exposed, subject only to the active cap.
- Ammo-zero shooters are removed immediately rather than waiting for the lap to finish.

### Artifacts And Evidence
- Changed files: `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Validation passed: `npm run typecheck`.
- Validation passed: `npm run test:smoke` (`6 passed`).
- Validation passed: `npm run check`.

## Steps
- 2026-05-30T15:49:20Z: task created
- 2026-05-30T15:55:14Z: Fix waiting clicks capacity display and slot compaction
