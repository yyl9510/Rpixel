# Remove block clear screen shake

- task_id: task-20260610-080147-644145-remove-block-clear-screen-shake
- branch: work/20260610-080146-826407-remove-block-clear-screen-shake
- branch_slug: work__20260610-080146-826407-remove-block-clear-screen-shake
- created_utc: 2026-06-10T08:01:47Z
- status: active

## Description
Remove the camera shake from block-clearing animation while keeping the other procedural animation polish intact; explain how the remaining no-new-art animation effects are implemented.

## Review Brief
### Original Request
Remove the camera shake from block-clearing animation while keeping the other procedural animation polish intact; explain how the remaining no-new-art animation effects are implemented.

### Assigned Scope
- Remove camera/screen shake from the block-clearing animation only.
- Preserve the rest of the no-new-art procedural animation polish.
- Explain how the remaining animation polish is implemented.

### Deliverables
- `src/game/scenes/GameScene.ts`: remove the `this.cameras.main.shake(...)` call inside `clearCell`.
- Keep flash tint, expanding silhouette, shards/particles, shrink-out, shooter motion polish, projectile trails, and click feedback unchanged.

### Validation Plan
- `npm run check`
- `npm run test:smoke`

### Constraints And Non-Goals
- Do not revert the other animation improvements.
- Do not add new art or dependencies.

### Claimed Output
- Removed the only camera shake call from block clearing.
- Other procedural animation effects remain in place.

### Artifacts And Evidence
- Changed file: `src/game/scenes/GameScene.ts`.
- `npm run check`: passed.
- `npm run test:smoke`: 8 passed.

## Steps
- 2026-06-10T08:01:47Z: task created
- 2026-06-10T08:03:38Z: Remove block clear screen shake
  - pushed_commit: 68bdd96
