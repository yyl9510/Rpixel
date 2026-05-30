# Align Pixel Flow visuals to reference screenshots

- task_id: task-20260530-015617-570113-align-pixel-flow-visuals-to-reference-screenshots
- branch: work/20260530-015616-794981-align-pixel-flow-visuals-to-reference-screenshots
- branch_slug: work__20260530-015616-794981-align-pixel-flow-visuals-to-reference-screenshots
- created_utc: 2026-05-30T01:56:17Z
- status: active

## Description
User provided latest main menu and gameplay screenshots and asked to start implementing closer visual alignment. Scope: keep existing gameplay rules, but visually align main menu and gameplay screens with reference: dense pixel board, thick arrow track, five slots, two-row shooter reserve, bottom prop buttons, stronger 3D/clay generated assets, and deploy to GitHub Pages after validation.

## Review Brief
### Original Request
User provided latest main menu and gameplay screenshots and asked to start implementing closer visual alignment. Scope: keep existing gameplay rules, but visually align main menu and gameplay screens with reference: dense pixel board, thick arrow track, five slots, two-row shooter reserve, bottom prop buttons, stronger 3D/clay generated assets, and deploy to GitHub Pages after validation.

### Assigned Scope
- Align the existing Phaser H5 prototype more closely with the provided main-menu and gameplay screenshots.
- Preserve the already-implemented Pixel Flow state rules while changing layout, generated assets, and level density.
- Keep backend, purchase, ads, ranking, and account behavior as static/mock UI only.

### Deliverables
- Dense reference-style gameplay board with a larger pixel-art matrix and matching shooter reserves.
- Gameplay UI closer to screenshot: thick rounded track with arrows, large central board, 5 slots, compact reserve rows, and bottom prop bar.
- More polished generated block/shooter/button visuals where practical in code-native Phaser graphics.
- Updated smoke tests that validate behavior without relying on old hardcoded reserve coordinates.
- Fresh local validation, screenshot smoke artifacts, merge to main, and GitHub Pages verification.

### Validation Plan
- Run npm run check.
- Run npm run test:smoke.
- Use Playwright to inspect/screenshot menu, gameplay, stuck-slot state, and win state.
- Verify GitHub Actions succeeds after merge to main.
- Verify public GitHub Pages loads the latest bundle and passes a public browser smoke path.

### Constraints And Non-Goals
- Do not replace the existing Phaser/Vite stack.
- Do not add real networked purchases, ads, leaderboards, account, or notification logic.
- Do not weaken the already validated slot, stuck, exposed-edge, combo, win, and fail rules to make visuals easier.
- Prefer procedural/code-native assets in this pass rather than introducing external generated bitmap asset files.

### Claimed Output
- TODO: fill when reporting completion.

### Artifacts And Evidence
- TODO: fill with changed files, commits, generated artifacts, logs, screenshots, or test output.

## Steps
- 2026-05-30T01:56:17Z: task created
- 2026-05-30T01:58:42Z: Document screenshot visual alignment scope
  - pushed_commit: 6d9b141
