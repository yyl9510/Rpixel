# Balance color ammo and continuous shooter motion

- task_id: task-20260530-054459-168676-balance-color-ammo-and-continuous-shooter-motion
- branch: work/20260530-054458-281757-balance-color-ammo-and-continuous-shooter-motion
- branch_slug: work__20260530-054458-281757-balance-color-ammo-and-continuous-shooter-motion
- created_utc: 2026-05-30T05:44:59Z
- status: active

## Description
User reports board color block counts do not match the reserve shooters' per-color totals, making levels impossible, and requests shooters to keep sliding uniformly around the track while firing when a matching exposed block is in front instead of stopping to shoot.

## Review Brief
### Original Request
User reports board color block counts do not match the reserve shooters' per-color totals, making levels impossible, and requests shooters to keep sliding uniformly around the track while firing when a matching exposed block is in front instead of stopping to shoot.

### Assigned Scope
- Fix level solvability by ensuring each board color count exactly matches total reserve shooter ammo for that color.
- Rework resolving shooters so they move continuously around the perimeter track and fire opportunistically when a matching exposed block is directly in front.
- Extend smoke coverage for ammo/color balancing and continuous track movement.

### Deliverables
- Balanced first-level shooter generation derived from the board grid.
- Continuous orbital shooter update loop with exposed-edge-only firing while moving.
- Debug counters for board color totals, ammo color totals, and active shooter track state.
- Playwright smoke tests covering balance, concurrent shooters, full completion, and slot-full failure behavior.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Confirm full-level smoke path reaches win state with zero blocks and unlocked treasure.

### Constraints And Non-Goals
- Keep changes scoped to current H5 gameplay logic and validation tests.
- Preserve the existing PRD/UI work and avoid unrelated visual refactors.
- Do not introduce network/backend dependencies.

### Claimed Output
- The level's initial board color counts and reserve shooter ammo totals now match exactly per color.
- Shooters no longer stop at attack positions; after slot activation they orbit uniformly and fire when their current track line exposes a same-color block.
- Multiple shooters can remain active on the track concurrently, up to the existing five-slot gameplay limit.

### Artifacts And Evidence
- Changed files: `src/game/data/levels.ts`, `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Validation passed: `npm run check`.
- Validation passed: `npm run test:smoke` (`4 passed`).

## Steps
- 2026-05-30T05:44:59Z: task created
- 2026-05-30T06:24:05Z: Balance ammo totals and continuous shooter motion
