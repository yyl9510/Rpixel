# center shooter labels and premium visual pass

- task_id: task-20260531-102531-739778-center-shooter-labels-and-premium-visual-pass
- branch: work/20260531-102530-584498-center-shooter-labels-and-premium-visual-pass
- branch_slug: work__20260531-102530-584498-center-shooter-labels-and-premium-visual-pass
- created_utc: 2026-05-31T10:25:31Z
- status: active

## Description
用户反馈：小怪身上的数字不在正中心，场上可容纳小怪的 0-5 超出显示范围，整体画面仍显廉价。需要修正数字居中/容量显示范围，并继续提升质感和高级感，完成后自测、push、部署验证。

## Review Brief
### Original Request
用户反馈：小怪身上的数字不在正中心，场上可容纳小怪的 0-5 超出显示范围，整体画面仍显廉价。需要修正数字居中/容量显示范围，并继续提升质感和高级感，完成后自测、push、部署验证。

### Assigned Scope
- Fix the visual centering of ammo labels inside shooter bodies across reserve, waiting, and track states.
- Rework the active capacity indicator so `0-5` through `5-5` stays fully inside the HUD pill and does not collide with other top controls.
- Improve perceived production quality through subtler typography, lighter outlines, richer UI materials, board lighting, and more polished generated block/shooter rendering.
- Preserve all existing gameplay rules and click behavior.

### Deliverables
- Updated gameplay UI and token rendering in `src/game/scenes/GameScene.ts`.
- Updated generated texture rendering in `src/game/assets.ts` if needed.
- Updated smoke/debug coverage if positions or constants change.
- Local and deployed screenshot/debug validation.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Run `git diff --check`.
- Capture local screenshot and inspect label/HUD placement.
- Push, merge to `main`, verify GitHub Pages action, and run online sanity check.

### Constraints And Non-Goals
- Keep this pass scoped to visual/layout polish; no new game rules.
- Avoid network-dependent runtime assets.

### Claimed Output
- Centered shooter ammo badges with dedicated compact text styling and optical centering for reserve, waiting, and active shooter tokens.
- Reworked the active capacity HUD pill so `0-5` through `5-5` stays inside the pill and does not collide with the speed toggle.
- Reduced the bottom reserve preview to two rows, raised/shortened the booster toolbar, and kept the second reserve row clear of the toolbar.
- Polished generated block/shooter textures and in-game chrome with lighter outlines, softer shadows, richer surfaces, and restrained HUD treatments.
- Added smoke coverage for capacity label bounds and bottom reserve/tool bar spacing.

### Artifacts And Evidence
- Changed files: `src/game/assets.ts`, `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Validation: `npm run check` passed; `npm run test:smoke` passed 8/8; `git diff --check` passed.
- Local visual/debug sanity: `/tmp/rpixel-local-visual.png` captured once; debug bounds showed `0-5` and `5-5` inside the capacity pill, 6 visible reserve items across rows `[0, 1]`, and an estimated 65 game-unit gap between the second reserve row and toolbar.

## Steps
- 2026-05-31T10:25:31Z: task created
- 2026-05-31T10:25:49Z: Document centered label polish scope
  - pushed_commit: f23e681
- 2026-05-31T10:55:55Z: Implement centered labels, bottom reserve clearance, premium visual polish, and layout smoke assertions
- 2026-05-31T10:56:12Z: Polish shooter labels and reserve layout
  - pushed_commit: 687f400
