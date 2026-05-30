# Fix shooter click dispatch

- task_id: task-20260530-162510-163151-fix-shooter-click-dispatch
- branch: work/20260530-162509-393434-fix-shooter-click-dispatch
- branch_slug: work__20260530-162509-393434-fix-shooter-click-dispatch
- created_utc: 2026-05-30T16:25:10Z
- status: active

## Description
User reports many reserve-row and waiting-area shooters are not clickable. Guarantee that if fewer than five shooters are active, every waiting slot shooter and every first-row reserve shooter can be clicked to launch regardless of exposed board colors.

## Review Brief
### Original Request
User reports many reserve-row and waiting-area shooters are not clickable. Guarantee that if fewer than five shooters are active, every waiting slot shooter and every first-row reserve shooter can be clicked to launch regardless of exposed board colors.

### Assigned Scope
- Fix missed clicks for first-row reserve shooters and waiting-area shooters whenever active shooter capacity is available.
- Preserve the active limit of five and avoid double-launching from one click.

### Deliverables
- Scene-level fallback launch dispatch that maps DOM pointer coordinates into the 1080x1920 game coordinate system.
- Low-depth full-screen hit zone to catch clicks that miss Phaser container hit areas.
- Direct-click event stamping so fallback dispatch does not fire a second shooter from the same pointer event.
- Waiting shooters can be relaunched even during their short entering animation.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Manual Playwright script on a short mobile viewport clicking reserve and waiting shooters near their edge.
- GitHub Pages deployment verification after merge.

### Constraints And Non-Goals
- Do not change win/loss rules, active capacity, reserve column advancement, or ammo/block balance.
- Do not reintroduce mystery/question-mark shooters.

### Claimed Output
- Added robust coordinate fallback dispatch for reserve first-row and waiting-area shooter clicks.
- Fixed duplicate launches by suppressing fallback dispatch when the original shooter container handled the same pointer event.
- Expanded smoke coverage to verify edge clicks on reserve and waiting shooters.

### Artifacts And Evidence
- Changed files: `src/game/scenes/GameScene.ts`, `tests/smoke.spec.ts`.
- Validation passed locally: `npm run check`; `npm run test:smoke` (`6 passed`).
- Manual short-viewport Playwright check passed for reserve edge click and waiting edge click.

## Steps
- 2026-05-30T16:25:10Z: task created
- 2026-05-30T16:34:30Z: Fix manual shooter click dispatch
  - pushed_commit: f9b6bb3
