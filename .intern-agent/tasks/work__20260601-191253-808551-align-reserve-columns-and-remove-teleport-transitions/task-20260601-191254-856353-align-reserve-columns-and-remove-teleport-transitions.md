# align reserve columns and remove teleport transitions

- task_id: task-20260601-191254-856353-align-reserve-columns-and-remove-teleport-transitions
- branch: work/20260601-191253-808551-align-reserve-columns-and-remove-teleport-transitions
- branch_slug: work__20260601-191253-808551-align-reserve-columns-and-remove-teleport-transitions
- created_utc: 2026-06-01T19:12:54Z
- status: active

## Description
User requested: make bottom reserve launch area 5 columns aligned vertically with the 5 waiting slots; reserve column count later configurable but set to 5 now; remove unnecessary black shadows/background colors in reserve/waiting/field so only core objects remain; fix teleport when a returning shooter and a clicked waiting shooter overlap timing; audit and remove other abrupt teleport-like transitions.

## Review Brief
### Original Request
User requested: make bottom reserve launch area 5 columns aligned vertically with the 5 waiting slots; reserve column count later configurable but set to 5 now; remove unnecessary black shadows/background colors in reserve/waiting/field so only core objects remain; fix teleport when a returning shooter and a clicked waiting shooter overlap timing; audit and remove other abrupt teleport-like transitions.

### Assigned Scope
- Change the reserve launch area from 3 columns to 5 columns and align those columns with the 5 waiting slots.
- Remove unnecessary token shadows and reduce reserve/waiting/background fills that compete with gameplay objects.
- Fix return-to-waiting and click-during-return race conditions so target changes retarget smoothly rather than jumping.
- Audit other movement paths for abrupt set-position conflicts and stop stale movement tweens before launching.

### Deliverables
- Updates in `src/game/scenes/GameScene.ts` and `src/game/objects/ShooterToken.ts`.
- Smoke test updates for 5-column reserve expectations.
- Validation with `npm run check`, `npm run test:smoke`, and lightweight Playwright/debug checks.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Use Playwright state/position sampling for reserve alignment and no-teleport timing checks; avoid bulk screenshot viewing.

### Constraints And Non-Goals
- Do not change core board data, ammo totals, capacity, or shooting rules.
- Keep column count as a constant for now; later level-file configuration is out of scope for this immediate fix.

### Claimed Output
- Reserve launch area now uses 5 columns and reuses the waiting-slot x coordinates, so both areas are vertically aligned.
- Reserve visible set now shows two rows of five tokens; tests assert all reserve columns line up at `160 + col * 190`.
- Removed the token-level black shadow and removed reserve panel fills; waiting slots now keep only a faint outline.
- Added slot movement tween ownership/stop logic so stale compaction tweens cannot fight launch/return tweens.
- Retargeted return-to-waiting tween smoothly when slot indices change mid-flight, avoiding click-during-return teleport jumps.
- Added per-frame waiting debug publishing so no-teleport movement can be sampled reliably.

### Artifacts And Evidence
- Changed files: `src/game/scenes/GameScene.ts`, `src/game/objects/ShooterToken.ts`, `tests/smoke.spec.ts`.
- Validation: `npm run check` passed.
- Validation: `npm run test:smoke` passed, 8/8.
- Lightweight Playwright no-screenshot race check: entering shooter target changed from slot 1 to slot 0 after clicking a stuck shooter; sampled max movement step was about 27px, not a teleport-scale jump.

## Steps
- 2026-06-01T19:12:54Z: task created
- 2026-06-01T19:18:00Z: implemented 5-column reserve alignment, removed token/reserve shadows, and fixed slot motion tween retargeting.
- 2026-06-01T19:21:00Z: `npm run check`, `npm run test:smoke`, and a targeted Playwright race-position sample passed.
- 2026-06-01T19:21:10Z: Align reserve columns and smooth slot retargeting
