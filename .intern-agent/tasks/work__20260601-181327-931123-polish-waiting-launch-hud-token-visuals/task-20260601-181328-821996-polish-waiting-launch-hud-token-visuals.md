# polish waiting launch hud token visuals

- task_id: task-20260601-181328-821996-polish-waiting-launch-hud-token-visuals
- branch: work/20260601-181327-931123-polish-waiting-launch-hud-token-visuals
- branch_slug: work__20260601-181327-931123-polish-waiting-launch-hud-token-visuals
- created_utc: 2026-06-01T18:13:28Z
- status: complete

## Description
User requested six gameplay polish fixes: animate reserve column items moving forward after top shooter launches; launch shooters directly to a better track start instead of sliding from/wrapping around the lower-left overlap; remove meaningless center treasure chest; adjust top-left speed/capacity HUD numbers upward-left like prior ammo centering work; improve number visual quality; keep shooter token nozzle/barrel consistent before and after entering the track.

## Review Brief
### Original Request
User requested six gameplay polish fixes: animate reserve column items moving forward after top shooter launches; launch shooters directly to a better track start instead of sliding from/wrapping around the lower-left overlap; remove meaningless center treasure chest; adjust top-left speed/capacity HUD numbers upward-left like prior ammo centering work; improve number visual quality; keep shooter token nozzle/barrel consistent before and after entering the track.

### Assigned Scope
- Animate reserve column advancement after the front/top shooter launches.
- Simplify shooter launch so tokens enter near the lower-left track edge directly instead of staging below the track.
- Remove the center treasure chest from the playfield without changing core clearing/win conditions.
- Re-center the top-left speed and active-capacity HUD labels using visual bounds instead of object bounds only.
- Improve token ammo number styling and keep token body/nozzle appearance consistent before and after launch.

### Deliverables
- Scoped code updates in `src/game/scenes/GameScene.ts` and `src/game/objects/ShooterToken.ts`.
- Smoke test updates for removed treasure and revised HUD positioning.
- Validation via type/check and smoke tests, plus lightweight Playwright/debug inspection if needed.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Verify debug state still exposes reserve/waiting/active shooter state and HUD label bounds.

### Constraints And Non-Goals
- Avoid bulk screenshot viewing; use Playwright debug values or targeted canvas/pixel checks if visual validation is needed.
- Do not change level data, shooter capacity, or core shooting/clearing rules beyond removing the decorative treasure mechanic.

### Claimed Output
- Added reserve advancement tweening so promoted column items slide forward instead of popping into the top row.
- Changed shooter launch to fly directly to the lower-left track entry and moved the track start slightly right.
- Removed the playfield treasure chest and treasure unlock dependency from level completion.
- Repositioned and visually centered the speed/capacity HUD labels using text pixel bounds.
- Removed the launch-only black barrel/nozzle and improved ammo number stroke/shadow styling.

### Artifacts And Evidence
- Changed files: `src/game/scenes/GameScene.ts`, `src/game/objects/ShooterToken.ts`, `tests/smoke.spec.ts`.
- Validation: `npm run check` passed.
- Validation: `npm run test:smoke` passed, 8/8.
- Lightweight Playwright debug check: HUD visual centers matched targets `(208,70)` and `(344,70)`; reserve/active debug state remained populated after launch.

## Steps
- 2026-06-01T18:13:28Z: task created
- 2026-06-01T18:29:00Z: implemented reserve/launch/HUD/token visual polish and removed playfield treasure.
- 2026-06-01T18:31:00Z: `npm run check` and `npm run test:smoke` passed; Playwright debug coordinate check completed without screenshots.
- 2026-06-01T18:33:00Z: marked task complete after branch push.
- 2026-06-01T18:22:41Z: Polish waiting launch hud token visuals
  - pushed_commit: ab6d5d4
- 2026-06-01T18:23:10Z: Mark visual polish task complete
