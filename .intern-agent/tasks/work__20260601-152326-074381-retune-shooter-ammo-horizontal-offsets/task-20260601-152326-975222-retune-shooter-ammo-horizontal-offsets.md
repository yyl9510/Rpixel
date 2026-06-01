# Retune shooter ammo horizontal offsets

- task_id: task-20260601-152326-975222-retune-shooter-ammo-horizontal-offsets
- branch: work/20260601-152326-074381-retune-shooter-ammo-horizontal-offsets
- branch_slug: work__20260601-152326-074381-retune-shooter-ammo-horizontal-offsets
- created_utc: 2026-06-01T15:23:26Z
- status: active

## Description
用户反馈当前一位数字偏左、两个数字过左。需要在 ShooterToken 内把一位数和多位数的横向偏移都向右收，保持数字仍为 token 内部子对象。

## Review Brief
### Original Request
用户反馈当前一位数字偏左、两个数字过左。需要在 ShooterToken 内把一位数和多位数的横向偏移都向右收，保持数字仍为 token 内部子对象。

### Assigned Scope
- Retune shooter ammo number horizontal offsets based on user feedback.
- Move one-digit and multi-digit targets rightward while keeping their vertical offsets unchanged.
- Keep all ammo positioning inside `ShooterToken`.

### Deliverables
- `src/game/objects/ShooterToken.ts`: one-digit offset changed from `(-20, -20)` to `(-16, -20)`; multi-digit offset changed from `(-38, -18)` to `(-28, -18)`.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Local debug coordinate check for one-digit and two-digit reserve labels.

### Constraints And Non-Goals
- No gameplay, level, hit-zone, reserve layout, or scene-side ammo positioning changes.

### Claimed Output
- One-digit labels are shifted right from the previous over-left position.
- Two-digit labels are shifted right substantially from the previous over-left position.

### Artifacts And Evidence
- Changed file: `src/game/objects/ShooterToken.ts`.
- Validation passed: `npm run check` (`tsc --noEmit`, `vite build`).
- Validation passed: `npm run test:smoke` (8 Playwright tests passed).
- Local debug evidence: one-digit `5` offset changed to `(-14.4, -18)` after reserve scaling; two-digit `15` offset changed to `(-25.2, -16.2)`.

## Steps
- 2026-06-01T15:23:26Z: task created
- 2026-06-01T15:26:16Z: Retune shooter ammo horizontal offsets
