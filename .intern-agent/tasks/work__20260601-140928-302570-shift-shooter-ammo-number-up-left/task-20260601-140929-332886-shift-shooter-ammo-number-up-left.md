# Shift shooter ammo number up left

- task_id: task-20260601-140929-332886-shift-shooter-ammo-number-up-left
- branch: work/20260601-140928-302570-shift-shooter-ammo-number-up-left
- branch_slug: work__20260601-140928-302570-shift-shooter-ammo-number-up-left
- created_utc: 2026-06-01T14:09:29Z
- status: active

## Description
用户反馈数字依然在右下方，要求把小怪上的数字直接移动到左上方。需要在 ShooterToken 内部加入明确的视觉偏移，保持数字仍是 token 子对象。

## Review Brief
### Original Request
用户反馈数字依然在右下方，要求把小怪上的数字直接移动到左上方。需要在 ShooterToken 内部加入明确的视觉偏移，保持数字仍是 token 子对象。

### Assigned Scope
- Move the shooter ammo number visibly left and up inside `ShooterToken`.
- Keep the number as a `ShooterToken` child object; do not add scene-side number movement.

### Deliverables
- `src/game/objects/ShooterToken.ts`: explicit ammo number visual offset of `x: -14`, `y: -16` applied to the visible-digit centering target.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Local clipped visual sanity check for reserve numbers after the left/up shift.

### Constraints And Non-Goals
- No gameplay, level, hit-zone, or reserve layout changes.
- Do not move the number from `GameScene`.

### Claimed Output
- Ammo number visible center now targets a point 14 local units left and 16 local units up from the token center.
- The visible digit centering logic remains intact; only the target point moved left/up.

### Artifacts And Evidence
- Changed file: `src/game/objects/ShooterToken.ts`.
- Validation passed: `npm run check` (`tsc --noEmit`, `vite build`).
- Validation passed: `npm run test:smoke` (8 Playwright tests passed).
- Local clipped sanity: `/tmp/rpixel-up-left-0-75.png` and `/tmp/rpixel-up-left-2-15.png`; debug target moved to the left/up visual point and reported `deltaX: 0`, `deltaY: 0`.

## Steps
- 2026-06-01T14:09:29Z: task created
- 2026-06-01T14:12:33Z: Shift shooter ammo number up left
