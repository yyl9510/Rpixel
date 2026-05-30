# Polish conveyor visuals and projectile feel

- task_id: task-20260530-184014-943666-polish-conveyor-visuals-and-projectile-feel
- branch: work/20260530-184013-611980-polish-conveyor-visuals-and-projectile-feel
- branch_slug: work__20260530-184013-611980-polish-conveyor-visuals-and-projectile-feel
- created_utc: 2026-05-30T18:40:14Z
- status: active

## Description
Improve Pixel Flow visual quality: make the surrounding track look like a rolling counter-clockwise conveyor belt, show clearer lower-left entry/exit conveyor flow to and from waiting slots, remove unnecessary white exhaust from projectiles so shots read as colored bullets, and start improving overall glossy/3D UI texture without waiting for external assets.

## Review Brief
### Original Request
Improve Pixel Flow visual quality: make the surrounding track look like a rolling counter-clockwise conveyor belt, show clearer lower-left entry/exit conveyor flow to and from waiting slots, remove unnecessary white exhaust from projectiles so shots read as colored bullets, and start improving overall glossy/3D UI texture without waiting for external assets.

### Assigned Scope
- Add a continuously moving counter-clockwise conveyor treatment to the playfield track.
- Add visual lower-left upload/download conveyor lanes and route shooter entry/return tweens through them.
- Replace the white beam/exhaust projectile with a compact same-color bullet.
- Improve the first-pass UI texture through richer background, track beveling, shadows, gloss, and motion.

### Deliverables
- Updated `GameScene` track, conveyor, launch/return, projectile, and background presentation.
- Added conveyor debug state for regression coverage.
- Updated smoke tests to assert conveyor markers exist and the conveyor offset changes over time.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- `git diff --check`
- Source grep for removed white beam/shake patterns.
- Playwright local visual sanity check with screenshot and canvas brightness/conveyor motion assertions.

### Constraints And Non-Goals
- Do not wait for external art assets for this first polish pass.
- Preserve existing gameplay logic, active capacity, queue, waiting-slot, failure, and completion behavior.
- Keep changes deployable through the existing GitHub Pages workflow.

### Claimed Output
- Implemented a moving conveyor belt around the board with 51 animated plates, tied to game speed.
- Added lower-left upload and download conveyor lanes and routed shooter entry/return through them.
- Removed white beam/exhaust shot visuals and replaced them with same-color bullets.
- Added background/stage polish and conveyor motion regression coverage.

### Artifacts And Evidence
- Changed files: `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Local validation passed: `npm run check`; `npm run test:smoke` (8 passed); `git diff --check`.
- Source grep passed: no `lineBetween(active.container...)`, camera shake, or `shake(` patterns in `src`/`tests`.
- Visual sanity check passed: `test-results/visual-polish-game.png`, conveyor markers `51`, offset moved `2.99 -> 35.84`, canvas brightness `1000588`.

## Steps
- 2026-05-30T18:40:14Z: task created
- 2026-05-30T18:49:17Z: Polish conveyor visuals and projectile feel
