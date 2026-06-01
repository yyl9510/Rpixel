# Move shooter ammo number to body center

- task_id: task-20260601-124424-402633-move-shooter-ammo-number-to-body-center
- branch: work/20260601-124423-548089-move-shooter-ammo-number-to-body-center
- branch_slug: work__20260601-124423-548089-move-shooter-ammo-number-to-body-center
- created_utc: 2026-06-01T12:44:24Z
- status: complete

## Description
用户提供小怪截图并指出小怪上的数字没有在小怪中心，需要把小怪数字的视觉中心移动到小怪身体中心。保持数字仍为 ShooterToken 内部子对象，GameScene 不直接移动数字。

## Review Brief
### Original Request
用户提供小怪截图并指出小怪上的数字没有在小怪中心，需要把小怪数字的视觉中心移动到小怪身体中心。保持数字仍为 ShooterToken 内部子对象，GameScene 不直接移动数字。

### Assigned Scope
- Move shooter ammo numbers to the visual center of the shooter token body.
- Keep ammo text owned and laid out inside `ShooterToken`; `GameScene` must not directly position ammo labels.
- Make debug centering evidence reflect the visible digit pixels, not just the Phaser Text object rectangle.

### Deliverables
- `src/game/objects/ShooterToken.ts`: centers ammo labels by scanning the rendered text canvas alpha bounds and aligning the visible digit center to the token label center.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Local clipped visual sanity check of reserve shooter labels, including a number containing `1`.

### Constraints And Non-Goals
- No gameplay, level, capacity, or hit-zone changes.
- Do not reintroduce scene-side ammo label movement.
- Avoid full-screen screenshot review; use local token clips and debug coordinates.

### Claimed Output
- Ammo text remains a child of `ShooterToken`.
- `setAmmo()` now aligns the visible pixel bounds of the rendered number to the token center, so strings such as `10`/`15` do not look shifted right because of glyph side bearings.
- `ammoLabelDebug()` now reports the visible digit center against the token center.

### Artifacts And Evidence
- Changed file: `src/game/objects/ShooterToken.ts`.
- Validation passed: `npm run check` (`tsc --noEmit`, `vite build`).
- Validation passed: `npm run test:smoke` (8 Playwright tests passed).
- Local clipped sanity: `/tmp/rpixel-token-0-75.png` and `/tmp/rpixel-token-2-15.png`; debug labels reported `deltaX: 0` and `deltaY: 0` for visible reserve labels after visual-bounds centering.
- Main merge/deploy: merged to `main` at `f03af69`, pushed to `origin/main`, GitHub Pages workflow `26755963860` completed with `success`, and online sanity check passed at `https://yyl9510.github.io/Rpixel/?v=f03af69`.
- Online debug evidence: deployed asset `index-BM1CrVbd.js` contains the visible-bounds centering path (`getImageData`); Playwright debug check reported 6 visible reserve labels and `maxLabelDelta: 0`.

## Steps
- 2026-06-01T12:44:24Z: task created
- 2026-06-01T12:50:30Z: Center shooter ammo by visible digits
  - pushed_commit: fca6ef7
- 2026-06-01T12:54:18Z: Verify deployed visible-digit centering and mark task complete
- 2026-06-01T12:50:08Z: Center shooter ammo by visible digits
  - pushed_commit: fca6ef7
- 2026-06-01T12:54:03Z: Record visible-digit centering deployment
