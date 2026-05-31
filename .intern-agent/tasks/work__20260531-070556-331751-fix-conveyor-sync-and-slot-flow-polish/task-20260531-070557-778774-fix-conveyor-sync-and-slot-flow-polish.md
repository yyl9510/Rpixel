# Fix conveyor sync and slot flow polish

- task_id: task-20260531-070557-778774-fix-conveyor-sync-and-slot-flow-polish
- branch: work/20260531-070556-331751-fix-conveyor-sync-and-slot-flow-polish
- branch_slug: work__20260531-070556-331751-fix-conveyor-sync-and-slot-flow-polish
- created_utc: 2026-05-31T07:05:57Z
- status: active

## Description
User reports: conveyor scroll speed must exactly match shooter track speed so shooters feel carried by belt; visual fidelity should more closely replicate uploaded Pixel Flow reference; active shooter movement feels stuttery and ammo text unreadable while moving; rapidly tapping waiting shooters can leave gaps; returning shooter sometimes animates to leftmost slot first then jumps to correct slot. Fix gameplay state/animation bugs, improve smoothness/readability, validate locally, push and deploy.

## Review Brief
### Original Request
User reports: conveyor scroll speed must exactly match shooter track speed so shooters feel carried by belt; visual fidelity should more closely replicate uploaded Pixel Flow reference; active shooter movement feels stuttery and ammo text unreadable while moving; rapidly tapping waiting shooters can leave gaps; returning shooter sometimes animates to leftmost slot first then jumps to correct slot. Fix gameplay state/animation bugs, improve smoothness/readability, validate locally, push and deploy.

### Assigned Scope
- Make conveyor marker movement use the exact same base speed and multiplier as active shooters on the track.
- Fix waiting slot state flow under rapid tapping and concurrent returns so the five waiting slots remain left-packed and returning shooters fly directly to their current assigned slot.
- Improve active shooter readability/smoothness and push visual treatment closer to the uploaded Pixel Flow reference without introducing external assets.

### Deliverables
- Gameplay/animation fixes in `src/game/scenes/GameScene.ts`.
- Render/readability config and debug typing updates in `src/main.ts`.
- Focused smoke coverage for conveyor/shooter speed sync and slot flow regressions in `tests/smoke.spec.ts`.
- Updated task record with validation and deployment evidence.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- `git diff --check`
- Local browser sanity check: launch game, verify conveyor offset changes, active shooter debug state, and waiting slots remain packed after rapid slot launches/returns.
- After merge, push `main`, wait for GitHub Pages Action success, and run online sanity checks against the versioned Pages URL.

### Constraints And Non-Goals
- Do not change the core rule that at most five shooters can be active on the track.
- Do not reintroduce hidden/question-mark reserve shooters.
- Do not add large binary art assets unless explicitly provided/approved; this pass remains code-generated visual polish.
- Avoid unrelated refactors and preserve existing smoke-test coverage.

### Claimed Output
- Conveyor marker scroll now uses `CONVEYOR_SCROLL_SPEED = TRACK_SPEED`, so the belt and active shooters share the exact same base speed and 1x/5x multiplier.
- Active shooter scale and ammo text resolution were increased to make the number readable while the shooter is moving on the track.
- Waiting slots now only launch fully returned (`stuck`) shooters; returning shooters reserve a slot but are not accidentally launched or moved by stale hit zones.
- Returning shooters use a dynamic assigned-slot landing tween, so if the packed waiting order changes while they are returning, they fly directly to the current target slot instead of landing left then jumping.
- Smoke coverage now asserts belt/shooter speed sync and keeps the rapid waiting-slot launch regression covered.

### Artifacts And Evidence
- `npm run check` passed.
- `npm run test:smoke` passed: 8/8 Playwright tests.
- `git diff --check` passed.
- Local runtime sampling: active shooter speed `820`, belt speed `820`, conveyor spacing `78`, screenshot saved at `test-results/conveyor-sync-slot-polish.png`.
- Changed files: `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`, this task record.

## Steps
- 2026-05-31T07:05:57Z: task created
- 2026-05-31T07:15:12Z: Sync conveyor speed and fix waiting slot flow
  - pushed_commit: 2a3e841
