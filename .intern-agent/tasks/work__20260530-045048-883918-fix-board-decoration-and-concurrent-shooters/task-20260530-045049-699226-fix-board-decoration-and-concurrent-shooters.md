# Fix board decoration and concurrent shooters

- task_id: task-20260530-045049-699226-fix-board-decoration-and-concurrent-shooters
- branch: work/20260530-045048-883918-fix-board-decoration-and-concurrent-shooters
- branch_slug: work__20260530-045048-883918-fix-board-decoration-and-concurrent-shooters
- created_utc: 2026-05-30T04:50:49Z
- status: active

## Description
User requests removing the yellow horizontal bar and four blue decorative monsters below the big board so only blocks remain, and fixing gameplay so up to five shooters can be active on the track at once instead of only one.

## Review Brief
### Original Request
User requests removing the yellow horizontal bar and four blue decorative monsters below the big board so only blocks remain, and fixing gameplay so up to five shooters can be active on the track at once instead of only one.

### Assigned Scope
- Remove the decorative board-bottom platform, yellow/orange bar, and four blue parked shooters from the gameplay board.
- Restore the gameplay board to pure pixel blocks inside the board frame.
- Refactor active shooter resolution so multiple clicked shooters can be on the track at the same time, capped by the 5-slot gameplay limit.
- Preserve slot-full failure, stuck-slot reactivation, exposed-edge targeting, treasure unlock, win, and Continue behavior.

### Deliverables
- Updated Phaser gameplay scene without the board-bottom decoration layer.
- Updated generated level grid so the lower board area contains real blocks instead of hidden empty rows.
- Concurrent active shooter state machine using an active shooter array and target reservations.
- Smoke coverage proving concurrent active shooters and existing level flow still work.

### Validation Plan
- Run `npm run typecheck`.
- Run `npm run test:smoke`.
- Run `npm run check`.
- Capture and inspect a gameplay screenshot confirming the board contains only blocks where the removed decoration was.
- Merge to `main`, push, verify GitHub Pages workflow, and smoke test the public URL.

### Constraints And Non-Goals
- Do not weaken Pixel Flow rules to fake the concurrent behavior.
- Keep the existing Phaser/Vite stack and code-native generated assets.
- Do not add backend, purchase, ads, leaderboard, or account integration.

### Claimed Output
- Removed the `drawBoardForeground` decorative platform and restored the bottom board rows to real pixel blocks.
- Replaced the single `resolvingShooter` state with a `resolvingShooters` array, allowing up to 5 active shooters on the track concurrently.
- Added target reservation logic so concurrent shooters do not claim the same visible block while moving toward the track position.
- Added a Playwright smoke test that clicks blue and green shooters and verifies at least 2 active shooters are on the track at once.

### Artifacts And Evidence
- Changed files: `src/game/scenes/GameScene.ts`, `src/game/data/levels.ts`, `tests/smoke.spec.ts`.
- Local screenshot: `test-results/no-board-foreground-gameplay.png` showed 356 board blocks and no yellow bar or parked blue shooters.
- Local validation: `npm run typecheck` passed.
- Local validation: `npm run test:smoke` passed with 4/4 mobile Chromium tests.
- Local validation: `npm run check` passed.

## Steps
- 2026-05-30T04:50:49Z: task created
- 2026-05-30T04:59:02Z: Remove board foreground and allow concurrent shooters
