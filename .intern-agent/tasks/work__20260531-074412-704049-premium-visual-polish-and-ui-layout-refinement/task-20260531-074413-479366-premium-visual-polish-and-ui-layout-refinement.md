# Premium visual polish and UI layout refinement

- task_id: task-20260531-074413-479366-premium-visual-polish-and-ui-layout-refinement
- branch: work/20260531-074412-704049-premium-visual-polish-and-ui-layout-refinement
- branch_slug: work__20260531-074412-704049-premium-visual-polish-and-ui-layout-refinement
- created_utc: 2026-05-31T07:44:13Z
- status: active

## Description
User feedback: slow down the conveyor visual so it reads as a belt without racing; improve overall premium/high-quality look with shadows and material feel; make shooters larger and more polished; redesign shooter ammo number so it sits centered inside the shooter instead of oversized/right-low; move 0-5 active capacity label so reserve area does not cover it; move 1x/5x speed toggle next to the top-left settings instead of overlapping the board. Keep gameplay logic intact, validate, push and deploy.

## Review Brief
### Original Request
User feedback: slow down the conveyor visual so it reads as a belt without racing; improve overall premium/high-quality look with shadows and material feel; make shooters larger and more polished; redesign shooter ammo number so it sits centered inside the shooter instead of oversized/right-low; move 0-5 active capacity label so reserve area does not cover it; move 1x/5x speed toggle next to the top-left settings instead of overlapping the board. Keep gameplay logic intact, validate, push and deploy.

### Assigned Scope
- Slow the visual conveyor animation while keeping it visibly belt-like with stronger chevrons and subtle shadowing.
- Improve shooter/block material quality using generated asset updates: stronger shadows, black outlines, gloss panels, and more structured backpack-like shooters.
- Redesign shooter ammo display as a centered in-body badge instead of an oversized external-looking number.
- Move the speed toggle away from the board to the top-left settings area and move the active capacity label out from under the lower UI.
- Preserve the current gameplay rules and click/state-machine behavior.

### Deliverables
- `src/game/scenes/GameScene.ts`: conveyor speed/chevron visuals, speed toggle placement, capacity label placement, shooter token scale and ammo badge layout.
- `src/game/assets.ts`: improved generated block and shooter textures with heavier shadows, bevels, gloss, side details, and rim treatment.
- `src/main.ts`: debug type additions for updated conveyor and speed-toggle state.
- `tests/smoke.spec.ts`: updated speed-toggle coordinates and conveyor speed assertions.
- Local screenshot artifact: `test-results/premium-visual-polish-game.png`.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- `git diff --check`
- Local Playwright screenshot/sanity pass to inspect final gameplay layout and debug state.
- After merge: push `main`, wait for GitHub Pages Action success, and run a versioned online sanity check.

### Constraints And Non-Goals
- No external binary art assets in this pass; continue with generated Phaser/CSS-style visuals.
- Do not change core game balance, board contents, ammo totals, win/lose rules, or max active shooter count.
- Keep changes scoped to requested visual/layout polish and matching tests.

### Claimed Output
- Conveyor visual speed reduced from shooter speed to `220` at 1x, with a capped 5x visual multiplier so it still reads as a belt without racing.
- Conveyor chevrons are brighter and more dimensional, retaining a clear moving-belt signal at slower speed.
- Speed toggle moved to the top-left next to settings at `(214, 82)`.
- Active capacity label moved into its own dark capsule near the lower-left track area so the reserve/waiting UI does not cover it.
- Shooter tokens are larger, darker-shadowed, and use a centered translucent ammo badge inside the body.
- Generated shooter/block textures now have stronger shadow, bevel, gloss, side-arm, and depth treatment.

### Artifacts And Evidence
- `npm run check` passed.
- `npm run test:smoke` passed: 8/8 Playwright tests.
- `git diff --check` passed.
- Local screenshot/sanity passed: `test-results/premium-visual-polish-game.png`, scene `game`, track speed `820`, conveyor speed `220`, active capacity `1-5`, 51 conveyor markers.

## Steps
- 2026-05-31T07:44:13Z: task created
- 2026-05-31T07:52:32Z: Polish premium visuals and UI placement
