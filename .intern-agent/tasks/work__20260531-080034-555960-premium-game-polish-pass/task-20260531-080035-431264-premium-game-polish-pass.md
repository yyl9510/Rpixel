# premium game polish pass

- task_id: task-20260531-080035-431264-premium-game-polish-pass
- branch: work/20260531-080034-555960-premium-game-polish-pass
- branch_slug: work__20260531-080034-555960-premium-game-polish-pass
- created_utc: 2026-05-31T08:00:35Z
- status: active

## Description
根据用户反馈继续提升 Pixel Flow H5 游戏画质：底部传送带慢速但清晰呈现传送带感；增强小怪和方块质感与阴影；优化小怪中间数字徽章；调整 0-5 容量数字避免被待选区遮挡；将 1x/5x 加速按钮放到顶部设置旁边并避免场地遮挡；整体提升高级游戏画质。

## Review Brief
### Original Request
根据用户反馈继续提升 Pixel Flow H5 游戏画质：底部传送带慢速但清晰呈现传送带感；增强小怪和方块质感与阴影；优化小怪中间数字徽章；调整 0-5 容量数字避免被待选区遮挡；将 1x/5x 加速按钮放到顶部设置旁边并避免场地遮挡；整体提升高级游戏画质。

### Assigned Scope
- Refine the current Phaser gameplay screen only: conveyor pacing/visual language, shooter/block material quality, active capacity and speed control placement, and in-shooter ammo badge readability.
- Preserve the existing core gameplay behavior and existing GitHub Pages deployment path.

### Deliverables
- Updated game scene layout and conveyor drawing in `src/game/scenes/GameScene.ts`.
- Updated generated block/shooter textures in `src/game/assets.ts`.
- Updated smoke tests if debug constants or visual timing expectations change.
- Local screenshot artifact for visual sanity check.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Run `git diff --check`.
- Capture a local Playwright screenshot and inspect visual positions/debug state.
- Push and verify GitHub Pages deployment after merging to `main`.

### Constraints And Non-Goals
- Keep changes scoped to visual polish and UI placement; do not rewrite level logic or asset pipeline in this pass.
- Do not introduce externally hosted assets or network-dependent runtime behavior.

### Claimed Output
- TODO: fill when reporting completion.

### Artifacts And Evidence
- TODO: fill with changed files, commits, generated artifacts, logs, screenshots, or test output.

## Steps
- 2026-05-31T08:00:35Z: task created
- 2026-05-31T08:02:42Z: Document premium polish task scope
