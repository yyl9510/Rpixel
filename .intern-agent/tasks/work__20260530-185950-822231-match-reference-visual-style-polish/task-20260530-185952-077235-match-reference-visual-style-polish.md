# Match reference visual style polish

- task_id: task-20260530-185952-077235-match-reference-visual-style-polish
- branch: work/20260530-185950-822231-match-reference-visual-style-polish
- branch_slug: work__20260530-185950-822231-match-reference-visual-style-polish
- created_utc: 2026-05-30T18:59:52Z
- status: complete

## Description
Use the uploaded Pixel Flow gameplay screenshot as visual reference. Improve the H5 game toward the reference: dark purple glossy conveyor with light blue rim and subtle moving chevrons, lower-left roller/transfer treatment, stronger black outlines, softer shadows, brighter cartoon highlights, cleaner colored bullet shots, and richer UI/background polish while preserving current gameplay logic and deployment.

## Review Brief
### Original Request
Use the uploaded Pixel Flow gameplay screenshot as visual reference. Improve the H5 game toward the reference: dark purple glossy conveyor with light blue rim and subtle moving chevrons, lower-left roller/transfer treatment, stronger black outlines, softer shadows, brighter cartoon highlights, cleaner colored bullet shots, and richer UI/background polish while preserving current gameplay logic and deployment.

### Assigned Scope
- Match the uploaded gameplay reference more closely using code-generated assets and Phaser drawing primitives.
- Preserve the already verified gameplay behavior: five active shooters, waiting-slot deque behavior, reserve column advancement, one shot per track step, 1x/5x speed control, and current win/lose rules.
- Focus this pass on track/conveyor styling, lower-left transfer visuals, shooter/block gloss and outline quality, and removal/avoidance of beam-like white projectile effects.

### Deliverables
- `src/game/scenes/GameScene.ts`: darker glossy conveyor track, subtle moving chevrons, lower-left ramp/roller treatment, and existing colored projectile behavior retained.
- `src/game/assets.ts`: stronger cartoon-style block and shooter materials with black outlines, shadows, highlights, and backpack-like shooter details.
- Visual sanity screenshot: `test-results/reference-style-polish-game.png`.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- `git diff --check`
- Source search to confirm no old beam/shake code remains: `rg -n "lineBetween\\(active\\.container|const beam|cameras\\.main\\.shake|shake\\(" src tests`
- Browser sanity check on local Vite server: canvas nonblank, conveyor marker count > 20, conveyor offset changes across multiple samples, screenshot captured.

### Constraints And Non-Goals
- Do not introduce external art assets in this pass; use the uploaded screenshot as reference and keep assets generated locally.
- Do not change core game balance or state-machine rules in this visual pass.
- Do not revert unrelated changes.
- Final verification should include GitHub Pages after merging to `main`.

### Claimed Output
- Track visual restyled to a dark purple conveyor with pale glowing rim and lower-alpha scrolling chevrons.
- Lower-left upload/download area restyled with pale striped ramp and purple roller/transfer lanes.
- Blocks and shooters restyled with stronger black outlines, thicker shadows, brighter highlights, and more toy-like/material depth.
- Projectile remains a compact same-color bullet instead of a white beam/exhaust.

### Artifacts And Evidence
- Local checks passed: `npm run check`, `npm run test:smoke` (8 passed), `git diff --check`, and no matches for old beam/shake source search.
- Local visual sanity passed on `http://127.0.0.1:5180/Rpixel/`: 51 conveyor markers, 7 distinct offset samples, nonblank canvas brightness 498895, screenshot saved to `test-results/reference-style-polish-game.png`.
- Changed files: `src/game/scenes/GameScene.ts`, `src/game/assets.ts`, this task record.

## Steps
- 2026-05-30T18:59:52Z: task created
- 2026-05-30T19:06:04Z: Match reference visual style polish
  - pushed_commit: 182c6a8
- 2026-05-30T19:10:59Z: completed - Complete reference visual style polish
  - pushed_commit: d1e0d83
