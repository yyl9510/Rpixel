# Replace game visuals with Gemini assets

- task_id: task-20260602-081049-518218-replace-game-visuals-with-gemini-assets
- branch: work/20260602-081048-545226-replace-game-visuals-with-gemini-assets
- branch_slug: work__20260602-081048-545226-replace-game-visuals-with-gemini-assets
- created_utc: 2026-06-02T08:10:49Z
- status: active

## Description
Use Gemini generated resources for the current Rpixel game visuals, map each spritesheet frame to the correct gameplay part, then verify layout/positions with build, smoke test, and Playwright visual/debug checks.

## Review Brief
### Original Request
Use Gemini generated resources for the current Rpixel game visuals, map each spritesheet frame to the correct gameplay part, then verify layout/positions with build, smoke test, and Playwright visual/debug checks.

### Assigned Scope
- Replace the current generated game visuals with Gemini-generated resource sheets where they map cleanly to existing gameplay parts.
- Preserve gameplay coordinates, click targets, ammo label centering, and waiting/reserve layout.
- Verify that each mapped part renders at the intended position: board blocks, shooter tokens, track frame, waiting slots, HUD icons, and booster buttons/icons.

### Deliverables
- `BootScene` preloads the six Gemini resource sheets.
- `assets.ts` crops Gemini sheets into existing texture keys (`block-*`, `pig-*`, `shooter-*`) and Gemini UI texture keys.
- `GameScene` uses Gemini textures for track frame, waiting slot frames, HUD coin/gear/plus, and booster buttons/icons while keeping original coordinates.

### Validation Plan
- `npm run typecheck`
- `npm run check`
- `npm run test:smoke`
- Playwright coordinate/pixel validation for Gemini texture map, reserve columns, ammo label deltas, board block samples, HUD samples, track samples, waiting slot sample, booster samples, and an active shooter on track.

### Constraints And Non-Goals
- Do not change gameplay rules, level data, or animation timing.
- Do not open full screenshots for visual review; use debug state and local pixel sampling.
- Do not edit the source Gemini PNG assets.

### Claimed Output
- Added a Gemini asset processing layer that loads the LFS-backed sheets, crops the relevant frames, removes the baked gray checkerboard background, recolors missing color variants from available Gemini frames, and keeps old procedural graphics as fallback.
- Replaced board blocks, menu/game pig textures, active shooter textures, track frame, waiting slot frames, HUD icons, and booster visuals with Gemini-derived textures.

### Artifacts And Evidence
- `npm run typecheck` passed.
- `npm run check` passed; Vite emitted the six Gemini image assets into `dist/assets`.
- `npm run test:smoke` passed: 8/8 tests.
- Playwright pixel validation found `__RPIXEL_GEMINI_ASSET_MAP__` populated for blocks, monsters, track, waiting slots, HUD, and boosters.
- Reserve columns stayed aligned at x=160/350/540/730/920 for rows y=1538 and y=1686; ammo label max delta was 0.
- Pixel samples for HUD, board blocks, track, waiting slot, reserve token, booster icons, and active shooter all had low checker-background ratios, confirming the gray sheet background was not visible in-game.

## Steps
- 2026-06-02T08:10:49Z: task created
- 2026-06-02T08:23:00Z: Replace game visuals with Gemini assets
  - pushed_commit: 3ee5ea5
