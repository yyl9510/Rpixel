# fix shooter label alignment and premium visual polish rework

- task_id: task-20260531-113606-060943-fix-shooter-label-alignment-and-premium-visual-polish-rework
- branch: work/20260531-113605-029334-fix-shooter-label-alignment-and-premium-visual-polish-rework
- branch_slug: work__20260531-113605-029334-fix-shooter-label-alignment-and-premium-visual-polish-rework
- created_utc: 2026-05-31T11:36:06Z
- status: complete

## Description
用户反馈返工：小怪身上的数字仍然不在小怪正中心，场上可容纳小怪的 0-5 仍超出显示范围，整体画面仍显廉价。需要重新定位真实视觉问题，修正中心标签与容量显示，并进一步提升画面高级感。

## Review Brief
### Original Request
用户反馈返工：小怪身上的数字仍然不在小怪正中心，场上可容纳小怪的 0-5 仍超出显示范围，整体画面仍显廉价。需要重新定位真实视觉问题，修正中心标签与容量显示，并进一步提升画面高级感。

### Assigned Scope
- Rework shooter ammo label placement so the visible number sits at the center of the shooter body rather than below the centerline.
- Expand and restyle the active capacity pill so `0-5`/`5-5` has clear visual padding and lighter typography.
- Reduce cheap visual cues: oversized empty top letterbox, heavy black outlines, high-saturation red HUD blocks, busy conveyor arrows, and decorative face motifs.
- Preserve existing gameplay, click targets, capacity rules, and smoke-test behavior.

### Deliverables
- `src/game/scenes/GameScene.ts`: revised HUD, capacity pill, ammo badge anchor, toolbar, track/conveyor, and background treatment.
- `src/game/assets.ts`: cleaner shooter/block generated assets, including removal of the distracting white lower-face detail under ammo numbers.
- `src/main.ts` and `src/styles.css`: top-aligned mobile canvas and matching page background.
- `tests/smoke.spec.ts`: updated capacity pill geometry assertions.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Run `git diff --check`.
- Capture one local post-change visual screenshot and inspect the top HUD plus reserve shooters.
- Push branch, merge to `main`, verify GitHub Pages workflow, and run online sanity check.

### Constraints And Non-Goals
- Keep changes scoped to visual layout/polish; no new gameplay rules.
- Avoid runtime network assets.
- Avoid bulk screenshot review to prevent another oversized request.

### Claimed Output
- Moved ammo badges upward to the shooter body center and corrected text origin/optical x-offset so multi-digit labels read centered.
- Removed the white lower-face element from generated shooter textures so it no longer visually competes with the ammo number.
- Widened the capacity HUD pill to 150 game units, moved it away from the speed toggle, reduced stroke weight, and updated smoke bounds.
- Top-aligned the game canvas on tall mobile viewports and matched the page background to the game palette, eliminating the large empty top band.
- Reduced cheap visual noise by muting red HUD surfaces, simplifying background motifs, softening conveyor arrows, and restyling bottom boosters.

### Artifacts And Evidence
- Changed files: `src/game/assets.ts`, `src/game/scenes/GameScene.ts`, `src/main.ts`, `src/styles.css`, `tests/smoke.spec.ts`.
- Validation: `npm run check` passed; `npm run test:smoke` passed 8/8; `git diff --check` passed.
- Visual evidence: `/tmp/rpixel-rework-current.png` confirmed the original issue; `/tmp/rpixel-rework-after-pass2.png` confirmed top alignment, centered ammo labels without lower-face interference, and a wider capacity pill.
- Main merge/deploy: merged to `main` at `8085894`, pushed to `origin/main`, GitHub Pages workflow `26711724219` completed with `success`, and online sanity check passed at `https://yyl9510.github.io/Rpixel/?v=8085894`.

## Steps
- 2026-05-31T11:36:06Z: task created
- 2026-05-31T11:43:48Z: Rework ammo label centering, capacity pill, mobile framing, and premium visual treatment
- 2026-05-31T11:44:09Z: Rework shooter labels and premium framing
  - pushed_commit: 56f2d72
- 2026-05-31T11:49:15Z: Verify deployed rework and mark task complete
- 2026-05-31T11:49:41Z: Record deployed rework verification
  - pushed_commit: 79ce8f6
