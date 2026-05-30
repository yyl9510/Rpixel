# Speed toggle ammo multiples no shake

- task_id: task-20260530-173050-747614-speed-toggle-ammo-multiples-no-shake
- branch: work/20260530-173049-821716-speed-toggle-ammo-multiples-no-shake
- branch_slug: work__20260530-173049-821716-speed-toggle-ammo-multiples-no-shake
- created_utc: 2026-05-30T17:30:50Z
- status: active

## Description
Implement user requests: remove screen/camera vibration during block clearing; make every reserve shooter ammo number a multiple of 5 while preserving board/ammo balance; add 1x/5x speed toggle with current speed as 1x and make active shooter movement respect it; validate and deploy.

## Review Brief
### Original Request
Implement user requests: remove screen/camera vibration during block clearing; make every reserve shooter ammo number a multiple of 5 while preserving board/ammo balance; add 1x/5x speed toggle with current speed as 1x and make active shooter movement respect it; validate and deploy.

### Assigned Scope
- Remove camera/screen shake from block clearing.
- Ensure first level board color totals and all shooter ammo values are balanced and every shooter number is a positive multiple of 5.
- Add a visible 1x/5x speed toggle and make active track movement honor it.
- Keep existing queue, waiting-slot, failure, and completion behavior covered by smoke tests.

### Deliverables
- Updated first level data and shooter queue balancing.
- Updated gameplay scene with 1x/5x speed toggle, no camera shake, and debug state for regression tests.
- Updated TypeScript debug declarations.
- Expanded Playwright smoke coverage for ammo multiples, speed toggle behavior, queue/waiting interactions, overflow failure, and completion.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- `git diff --check`
- `rg -n "cameras\\.main\\.shake|shake\\(" src tests` should return no matches.

### Constraints And Non-Goals
- Keep changes scoped to current H5 game implementation and smoke tests.
- Do not reintroduce mystery/question-mark shooters.
- Preserve GitHub Pages deployment path and existing game rules.

### Claimed Output
- Implemented no-shake block clearing, 1x/5x speed toggle, and 5-multiple shooter ammo balancing.
- Adjusted first level queue ordering so the level remains playable with the new ammo distribution.
- Added smoke assertions for ammo multiples and measured 5x movement speed.

### Artifacts And Evidence
- Changed files: `src/game/data/levels.ts`, `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Local validation passed: `npm run check`; `npm run test:smoke` (8 passed); `git diff --check`.
- Source check passed: no matches for `cameras.main.shake`/`shake(` in `src` or `tests`.

## Steps
- 2026-05-30T17:30:50Z: task created
- 2026-05-30T18:00:51Z: Add speed toggle ammo multiples and remove shake
