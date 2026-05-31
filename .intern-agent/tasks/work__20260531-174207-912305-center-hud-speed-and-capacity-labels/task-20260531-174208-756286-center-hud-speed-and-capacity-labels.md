# Center HUD speed and capacity labels

- task_id: task-20260531-174208-756286-center-hud-speed-and-capacity-labels
- branch: work/20260531-174207-912305-center-hud-speed-and-capacity-labels
- branch_slug: work__20260531-174207-912305-center-hud-speed-and-capacity-labels
- created_utc: 2026-05-31T17:42:08Z
- status: active

## Description
User provided screenshot showing top HUD labels are not visually centered: the speed toggle value (1x/5x) and active capacity label (0-5/5-5) sit off-center. Fix their visual centering, add debug evidence/tests, validate, push, merge, and verify GitHub Pages.

## Review Brief
### Original Request
User provided screenshot showing top HUD labels are not visually centered: the speed toggle value (1x/5x) and active capacity label (0-5/5-5) sit off-center. Fix their visual centering, add debug evidence/tests, validate, push, merge, and verify GitHub Pages.

### Assigned Scope
- Fix the top HUD speed toggle value (`1x`/`5x`) and active-capacity value (`0-5` through `5-5`) so their visible text sits optically centered in their capsules.
- Keep the change scoped to HUD text positioning/debug/test coverage; do not redesign unrelated gameplay or token art.

### Deliverables
- Updated `GameScene.ts` HUD label positioning and debug state.
- Updated global debug typings in `src/main.ts` if new debug fields are added.
- Smoke-test assertions proving the HUD label bounds land on the intended optical centers.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Verify GitHub Pages after merging to `main`.

### Constraints And Non-Goals
- Avoid loading many screenshots into Codex because prior Rpixel visual turns triggered 413 payload errors.
- Do not restart daemon or unrelated agents.

### Claimed Output
- TODO: fill when reporting completion.

### Artifacts And Evidence
- TODO: fill with changed files, commits, generated artifacts, logs, screenshots, or test output.

## Steps
- 2026-05-31T17:42:08Z: task created
- 2026-05-31T17:47:04Z: Center HUD speed and capacity labels
  - pushed_commit: 5fd76f0
