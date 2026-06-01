# Center shooter token ammo bounds

- task_id: task-20260601-120836-857241-center-shooter-token-ammo-bounds
- branch: work/20260601-120835-962005-center-shooter-token-ammo-bounds
- branch_slug: work__20260601-120835-962005-center-shooter-token-ammo-bounds
- created_utc: 2026-06-01T12:08:36Z
- status: active

## Description
用户追问小怪是否为类，以及为什么数字像是左上角落在小怪中心；复查后发现 ShooterToken 已是类，但 ammoLabelDebug 检查的是 Text transform 原点，不是实际文字 bounds 中心。需要把实际 bounds 居中逻辑放到 ShooterToken 内部，并验证。

## Review Brief
### Original Request
用户追问小怪是否为类，以及为什么数字像是左上角落在小怪中心；复查后发现 ShooterToken 已是类，但 ammoLabelDebug 检查的是 Text transform 原点，不是实际文字 bounds 中心。需要把实际 bounds 居中逻辑放到 ShooterToken 内部，并验证。

### Assigned Scope
- Explain and correct the remaining shooter ammo label centering issue inside `ShooterToken`.
- Keep `GameScene` free of scene-side ammo text offset logic.
- Make debug evidence measure the actual rendered text bounds center, not only the Phaser transform origin.

### Deliverables
- `src/game/objects/ShooterToken.ts`: bounds-based ammo text centering owned by the token component, plus bounds-based ammo label debug output.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Confirm smoke/debug label checks now read actual text bounds center.

### Constraints And Non-Goals
- No gameplay, capacity, level-data, or visual asset changes.
- Do not move centering responsibility back into `GameScene`.
- Avoid full screenshot inspection; use source/debug checks and automated smoke tests.

### Claimed Output
- `ShooterToken` remains a Phaser container class for the shooter token.
- Ammo text remains a child object inside the token, but `setAmmo()` now recenters by actual `Text.getBounds()` after text/font changes.
- `ammoLabelDebug()` now reports the rendered text bounds center versus the token label target center, so `deltaX`/`deltaY` reflect actual visual bounds rather than the text object's transform origin.

### Artifacts And Evidence
- Changed file: `src/game/objects/ShooterToken.ts`.
- Validation passed: `npm run check` (`tsc --noEmit`, `vite build`).
- Validation passed: `npm run test:smoke` (8 Playwright tests passed).

## Steps
- 2026-06-01T12:08:36Z: task created
- 2026-06-01T12:11:02Z: Center shooter ammo by rendered bounds
  - pushed_commit: 55b0cdf
