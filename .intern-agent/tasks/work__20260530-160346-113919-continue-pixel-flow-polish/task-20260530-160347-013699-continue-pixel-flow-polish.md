# Continue Pixel Flow polish

- task_id: task-20260530-160347-013699-continue-pixel-flow-polish
- branch: work/20260530-160346-113919-continue-pixel-flow-polish
- branch_slug: work__20260530-160346-113919-continue-pixel-flow-polish
- created_utc: 2026-05-30T16:03:47Z
- status: active

## Description
Continue improving the Rpixel H5 Pixel Flow prototype beyond the latest deployed fixes: inspect current gameplay/UI against the PRD, implement the next high-impact conformance improvements, validate locally, push, and verify GitHub Pages deployment.

## Review Brief
### Original Request
Continue improving the Rpixel H5 Pixel Flow prototype beyond the latest deployed fixes: inspect current gameplay/UI against the PRD, implement the next high-impact conformance improvements, validate locally, push, and verify GitHub Pages deployment.

### Assigned Scope
- Continue the Pixel Flow PRD conformance pass after the deployed waiting/capacity fixes.
- Focus this slice on board shape fidelity and stricter outer-layer targeting rules without changing the user's latest queue/waiting-area interaction model.

### Deliverables
- Irregular/arched level board data with color-balanced shooter ammo totals.
- Target visibility logic that treats pending/reserved front blocks as blockers instead of allowing shots through them.
- Smoke coverage for irregular board shape plus updated end-to-end autoplay tolerances for the larger shaped level.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- GitHub Pages deployment check after merging to `main`.

### Constraints And Non-Goals
- Preserve the latest user-specified rules: first reserve row and waiting slots are manually launchable, active shooters max 5, waiting slots compact left, ammo-zero shooters disappear immediately, and waiting overflow is the only death condition.
- Do not reintroduce mystery/question-mark shooters.

### Claimed Output
- Implemented an irregular board silhouette with a doorway cutout while preserving exact per-color ammo/block balance.
- Updated outer-layer line-of-sight so a pending or reserved front block blocks deeper targets until it is cleared.
- Updated smoke tests to assert irregular shape metadata and keep the complete-level autoplay stable on the shaped board.

### Artifacts And Evidence
- Changed files: `src/game/data/levels.ts`, `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Validation passed locally: `npm run check`; `npm run test:smoke` (`6 passed`).

## Steps
- 2026-05-30T16:03:47Z: task created
- 2026-05-30T16:21:28Z: Add shaped board and stricter target blockers
  - pushed_commit: e42fb0f
