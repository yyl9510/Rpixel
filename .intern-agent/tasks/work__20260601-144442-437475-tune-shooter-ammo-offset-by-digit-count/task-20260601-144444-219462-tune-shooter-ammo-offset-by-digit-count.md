# Tune shooter ammo offset by digit count

- task_id: task-20260601-144444-219462-tune-shooter-ammo-offset-by-digit-count
- branch: work/20260601-144442-437475-tune-shooter-ammo-offset-by-digit-count
- branch_slug: work__20260601-144442-437475-tune-shooter-ammo-offset-by-digit-count
- created_utc: 2026-06-01T14:44:44Z
- status: complete

## Description
用户反馈一位数基本居中但还需略微左上，两个数字时仍未对齐且需要向左移动不少。需要在 ShooterToken 内按位数分别设置数字视觉偏移。

## Review Brief
### Original Request
用户反馈一位数基本居中但还需略微左上，两个数字时仍未对齐且需要向左移动不少。需要在 ShooterToken 内按位数分别设置数字视觉偏移。

### Assigned Scope
- Tune shooter ammo number offsets separately for one-digit and multi-digit ammo labels.
- Keep the offset logic inside `ShooterToken`; `GameScene` must not position ammo numbers.
- Preserve existing visible-pixel centering and gameplay behavior.

### Deliverables
- `src/game/objects/ShooterToken.ts`: replaces the single ammo number visual offset with digit-count-based offsets: one digit `(-20, -20)`, multi digit `(-38, -18)`.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Local clipped visual sanity for one-digit and two-digit reserve tokens.

### Constraints And Non-Goals
- No gameplay, level, hit-zone, or reserve layout changes.
- No full-screen screenshot inspection; use token clips and debug coordinates.

### Claimed Output
- One-digit labels now move slightly farther left/up than the previous uniform offset.
- Multi-digit labels now move substantially farther left while keeping the visible-pixel center aligned to their per-digit target.

### Artifacts And Evidence
- Changed file: `src/game/objects/ShooterToken.ts`.
- Validation passed: `npm run check` (`tsc --noEmit`, `vite build`).
- Validation passed: `npm run test:smoke` (8 Playwright tests passed).
- Local clipped sanity: `/tmp/rpixel-digit-tuned-1-5.png`, `/tmp/rpixel-digit-tuned-2-15.png`, `/tmp/rpixel-digit-tuned-4-5.png`; debug output showed one-digit targets at local `(-20, -20)` and multi-digit targets at local `(-38, -18)` after reserve scaling.
- Main merge/deploy: merged to `main` at `22ad081`, pushed to `origin/main`, GitHub Pages workflow `26762404663` completed with `success`, and online sanity check passed at `https://yyl9510.github.io/Rpixel/?v=22ad081`.
- Online debug evidence: one-digit `5` offset from token center is `(-18, -18)` after reserve scaling; two-digit `15` offset is `(-34.2, -16.2)`; `maxLabelDelta: 0`.

## Steps
- 2026-06-01T14:44:44Z: task created
- 2026-06-01T14:48:42Z: Tune shooter ammo offsets by digit count
  - pushed_commit: 4cfed7c
- 2026-06-01T14:52:02Z: Verify deployed digit-count offsets and mark task complete
- 2026-06-01T14:48:15Z: Tune shooter ammo offsets by digit count
  - pushed_commit: 4cfed7c
- 2026-06-01T14:52:16Z: Record digit-count offset deployment
