# convert shooter token to component class

- task_id: task-20260531-135857-986061-convert-shooter-token-to-component-class
- branch: work/20260531-135856-889308-convert-shooter-token-to-component-class
- branch_slug: work__20260531-135856-889308-convert-shooter-token-to-component-class
- created_utc: 2026-05-31T13:58:57Z
- status: complete

## Description
用户指出当前小怪数字不是组件内居中，应该把小怪实现成类，由类内部管理小怪图案和剩余炮弹数字标记，数字应以自身中心锚定在小怪正中心，而不是左上角或场景补偏移。

## Review Brief
### Original Request
用户指出当前小怪数字不是组件内居中，应该把小怪实现成类，由类内部管理小怪图案和剩余炮弹数字标记，数字应以自身中心锚定在小怪正中心，而不是左上角或场景补偏移。

### Assigned Scope
- Extract the shooter/pig visual token from `GameScene` into a reusable `ShooterToken` component class.
- Keep the remaining-ammo label as a child of the token so it stays centered on the token through movement, scaling, and ammo updates.
- Preserve shooter launching, waiting slot behavior, reserve mystery tokens, active capacity label updates, and debug state used by smoke tests.

### Deliverables
- `src/game/objects/ShooterToken.ts`: new Phaser container component that owns the shooter body, barrel, ammo badge/text, mystery token rendering, ammo font sizing, and ammo-label debug coordinates.
- `src/game/scenes/GameScene.ts`: uses `ShooterToken` for reserve, waiting, and resolving shooters; updates ammo via `token.setAmmo`; uses `token.visualBody` for orbit/firing geometry.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Confirm debug ammo-label data is produced by the token component rather than scene-side text recentering.

### Constraints And Non-Goals
- Do not change gameplay rules, slot capacity behavior, level data, or visual assets beyond moving token ownership into the component.
- Do not rely on scene-side world-bounds correction to compensate for ammo text placement.
- Avoid full-screenshot visual inspection because prior compact failed on oversized screenshot context.

### Claimed Output
- Shooter tokens are now represented by `ShooterToken`, a `Phaser.GameObjects.Container` that owns its visual body and ammo label.
- Ammo text is centered at the token-local origin with `origin(0.5, 0.5)` and reset to that point whenever ammo changes.
- `GameScene` no longer directly moves ammo text or maintains text-centering helpers for shooter tokens.

### Artifacts And Evidence
- Changed files: `src/game/objects/ShooterToken.ts`, `src/game/scenes/GameScene.ts`.
- Validation passed: `npm run check` (`tsc --noEmit`, `vite build`).
- Validation passed: `npm run test:smoke` (8 Playwright tests passed).
- Main merge/deploy: merged to `main` at `b3b35c7`, pushed to `origin/main`, GitHub Pages workflow `26717218906` completed with `success`, and online sanity check passed at `https://yyl9510.github.io/Rpixel/?v=b3b35c7`.
- Online debug evidence: deployed asset `index-B5PYe_4O.js` contains the new `visualBody` component path and no `centerAmmoText`; Playwright debug check reported capacity center `{ x: 350, y: 82 }`, 6 reserve labels, and `maxLabelDelta: 0`.

## Steps
- 2026-05-31T13:58:57Z: task created
- 2026-05-31T15:51:04Z: Extract shooter token component
  - pushed_commit: 417696b
- 2026-05-31T15:54:12Z: Verify deployed shooter token component and mark task complete
- 2026-05-31T15:55:55Z: Record deployed shooter token verification
