# Polish core gameplay transition animations

- task_id: task-20260601-172729-858349-polish-core-gameplay-transition-animations
- branch: work/20260601-172728-974794-polish-core-gameplay-transition-animations
- branch_slug: work__20260601-172728-974794-polish-core-gameplay-transition-animations
- created_utc: 2026-06-01T17:27:29Z
- status: active

## Description
用户要求修复四类动画过渡：1) 小怪返回等候区不要先回第一格再到最后，直接到最终等待位；2) 小方块被击中消失过程更有过渡；3) 小怪弹药用完消失过程更自然；4) 小怪被点击准备上场增加过渡动画。保持 Phaser/Web 实现，不迁移 Unity/原生。

## Review Brief
### Original Request
用户要求修复四类动画过渡：1) 小怪返回等候区不要先回第一格再到最后，直接到最终等待位；2) 小方块被击中消失过程更有过渡；3) 小怪弹药用完消失过程更自然；4) 小怪被点击准备上场增加过渡动画。保持 Phaser/Web 实现，不迁移 Unity/原生。

### Assigned Scope
- Add visible transition polish to the four core gameplay state changes called out by the user.
- Keep all work in the existing Phaser implementation; do not migrate to Unity/native.
- Preserve gameplay rules, slot capacity, click behavior, and smoke-test debug contracts.

### Deliverables
- `src/game/scenes/GameScene.ts`: smoother launch preparation, richer block-hit disappearance, more expressive exhausted-shooter exit, and direct return-to-final-waiting-slot motion.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Confirm code path no longer routes returning shooters through the transfer exit staging points before entering the waiting slot.

### Constraints And Non-Goals
- Avoid broad refactors and new rendering frameworks.
- Do not change level data, ammo balance, reserve layout, or slot capacity rules.
- Avoid large screenshot/context payloads; rely on local debug and tests.

### Claimed Output
- Launch now has a press/squash beat, a backed-out lift to the upload start, then a smooth transfer onto the track.
- Hit cells now flash, emit a ring, shed particles/shards, and shrink out over a longer easing curve instead of hard disappearing.
- Exhausted shooters now pop, emit a ring/sparks, then drift/fade/shrink away.
- Returning shooters now tween directly from their current track position to the final assigned waiting slot with a small arc; the old intermediate transfer-exit route was removed from this path.

### Artifacts And Evidence
- Changed file: `src/game/scenes/GameScene.ts`.
- Validation passed: `npm run check` (`tsc --noEmit`, `vite build`).
- Validation passed: `npm run test:smoke` (8 Playwright tests passed).

## Steps
- 2026-06-01T17:27:29Z: task created
- 2026-06-01T17:31:19Z: Polish core gameplay transition animations
  - pushed_commit: b73a915
