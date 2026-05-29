# Align gameplay with Pixel Flow PRD

- task_id: task-20260529-181917-616768-align-gameplay-with-pixel-flow-prd
- branch: work/20260529-181916-508995-align-gameplay-with-pixel-flow-prd
- branch_slug: work__20260529-181916-508995-align-gameplay-with-pixel-flow-prd
- created_utc: 2026-05-29T18:19:17Z
- status: active

## Description
Revise the existing H5 MVP according to the provided Pixel Flow PRD: reserve pool is the only player input source, shooters enter the leftmost active slot, slots hold up to five stuck shooters, matching shooters auto-activate only when same-color edge blocks are exposed, shooters move on the surrounding track to matching row/column lines, shoot inward, combo across exposed lines while ammo remains, fail only when full stuck slots receive another reserve click, keep mock UI/static systems, verify and redeploy via GitHub Pages.

## Review Brief
### Original Request
Revise the existing H5 MVP according to the provided Pixel Flow PRD: reserve pool is the only player input source, shooters enter the leftmost active slot, slots hold up to five stuck shooters, matching shooters auto-activate only when same-color edge blocks are exposed, shooters move on the surrounding track to matching row/column lines, shoot inward, combo across exposed lines while ammo remains, fail only when full stuck slots receive another reserve click, keep mock UI/static systems, verify and redeploy via GitHub Pages.

### Assigned Scope
- Replace the existing gameplay state flow with the Pixel Flow PRD behavior.
- Make the bottom reserve pool the only player input source.
- Add five active slots below the board; clicked shooters fly into the leftmost empty slot.
- Auto-activate slotted shooters only when same-color edge blocks are exposed, then move them on the track to the matching row/column and shoot inward.
- Keep stuck shooters occupying slots until later eliminations expose their color.
- Fail only when all five slots are full/stuck and the player clicks another reserve shooter.
- Preserve the existing H5/Vite/Phaser deployment setup and static mock UI approach.

### Deliverables
- Updated level data with ammo values suitable for PRD-style shooter capacity.
- Reworked gameplay scene matching the PRD state flow.
- Updated smoke tests for reserve-click input, active-slot behavior, and public deploy viability.
- Validation evidence and redeployment to GitHub Pages.

### Validation Plan
- Run npm run check.
- Run npm run test:smoke.
- Run a local/mobile screenshot smoke check when feasible.
- Push to main and verify the GitHub Pages URL loads and can enter gameplay.

### Constraints And Non-Goals
- Do not implement real backend, purchases, ads, rankings, account deletion, or persistence systems.
- Keep side systems as mock/static UI only unless needed for gameplay verification.
- No unrelated refactors outside the game MVP/deployment surface.

### Claimed Output
- Replaced the old click-slot/orbit-once gameplay with PRD-style reserve-to-active-slot flow.
- Bottom reserve pool is now the only gameplay input source; clicked shooters fly into the leftmost empty active slot.
- Shooters with no exposed same-color edge block remain stuck in active slots.
- Matching shooters automatically leave slots, travel on the surrounding track, shoot inward, clear visible same-color blocks, consume ammo, and continue to the next exposed line while ammo remains.
- The first test level now uses ammo/capacity values and a grid designed to demonstrate stuck slots, exposure, and automatic activation.
- Failure now occurs when the player clicks a reserve shooter while all five active slots are occupied.
- Added static mock panels for menu-side systems and a Settings panel with toggle UI.

### Artifacts And Evidence
- Changed files: src/game/scenes/GameScene.ts, src/game/data/levels.ts, src/game/types.ts, src/main.ts, tests/smoke.spec.ts, src/game/scenes/MenuScene.ts.
- Validation passed: npm run check.
- Validation passed: npm run test:smoke.
- Visual smoke screenshots generated locally under test-results/: prd-game-initial.png, prd-game-stuck-slot.png, prd-game-after-clear.png, prd-settings-panel.png.

## Steps
- 2026-05-29T18:19:17Z: task created
- 2026-05-29T18:19:48Z: Document Pixel Flow PRD alignment task
  - pushed_commit: a0c7f53
- 2026-05-29T18:27:55Z: Rework gameplay to Pixel Flow slot rules
  - pushed_commit: dce6bbd
- 2026-05-29T18:29:57Z: Add static mock menu panels
  - pushed_commit: 8758693
- 2026-05-29T18:30:27Z: Record PRD gameplay validation
  - pushed_commit: 946c061
