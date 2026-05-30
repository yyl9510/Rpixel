# Refine track firing and column reserve flow

- task_id: task-20260530-145647-958892-refine-track-firing-and-column-reserve-flow
- branch: work/20260530-145647-168046-refine-track-firing-and-column-reserve-flow
- branch_slug: work__20260530-145647-168046-refine-track-firing-and-column-reserve-flow
- created_utc: 2026-05-30T14:56:47Z
- status: active

## Description
User requests: each movement step should check the directly-front matching color and fire exactly one shot immediately without skipping; shooters should face orthogonal directions by track side instead of toward center; reserve pool should behave as three independent columns where clicking one column advances only that column.

## Review Brief
### Original Request
User requests: each movement step should check the directly-front matching color and fire exactly one shot immediately without skipping; shooters should face orthogonal directions by track side instead of toward center; reserve pool should behave as three independent columns where clicking one column advances only that column.

### Assigned Scope
- Change track firing from continuous same-line polling to discrete per-line track-step detection.
- Ensure each crossed track step can fire at most one projectile immediately when its front exposed block matches the shooter color.
- Make shooter facing orthogonal by track side instead of rotating toward board center.
- Change the reserve pool into three independent columns where only the clicked column advances.
- Preserve solvability and failure behavior under the new reserve-column rules.

### Deliverables
- Track-step based firing and debug shot log in `GameScene`.
- Orthogonal shooter orientation state by side: bottom/up, top/down, left/right, right/left.
- Three-column reserve queue with only top-row candidates interactable and independent per-column advancement.
- Reordered balanced first-level shooter queue to support both normal completion and slot-full failure.
- Smoke coverage for column advancement, one-shot-per-step firing, concurrent shooters, failure, and full completion.

### Validation Plan
- `npm run typecheck`
- `npm run test:smoke`
- `npm run check`

### Constraints And Non-Goals
- Keep changes scoped to H5 single-level gameplay and validation instrumentation.
- Maintain board/ammo per-color balance.
- No backend, monetization, or unrelated visual-system changes.

### Claimed Output
- Shooters now detect the crossed row/column track step once and fire a single projectile if the exposed front block matches.
- Shooters no longer fire multiple blocks from the same line while passing that line.
- Shooters face fixed cardinal directions according to track side, not toward the center.
- Reserve entries are split into three independent columns; selecting a top item advances only that column.
- Full smoke completion still clears all 356 blocks with exact per-color ammo usage.

### Artifacts And Evidence
- Changed files: `src/game/data/levels.ts`, `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Validation passed: `npm run typecheck`.
- Validation passed: `npm run test:smoke` (`5 passed`).
- Validation passed: `npm run check`.

## Steps
- 2026-05-30T14:56:47Z: task created
- 2026-05-30T15:11:21Z: Refine track firing and reserve columns
  - pushed_commit: 7cc8666
