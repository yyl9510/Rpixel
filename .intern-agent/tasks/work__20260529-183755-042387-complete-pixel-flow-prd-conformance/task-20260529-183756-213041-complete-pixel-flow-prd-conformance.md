# Complete Pixel Flow PRD conformance

- task_id: task-20260529-183756-213041-complete-pixel-flow-prd-conformance
- branch: work/20260529-183755-042387-complete-pixel-flow-prd-conformance
- branch_slug: work__20260529-183755-042387-complete-pixel-flow-prd-conformance
- created_utc: 2026-05-29T18:37:56Z
- status: active

## Description
Continue implementation until the H5 game practically conforms to the provided Pixel Flow PRD: audit current gaps, improve reserve/slot/shooter rules, locked mystery shooters, win/lose/settlement UI, treasure/mock reward behavior, main menu and settings/static panels, visual feedback, automated checks, and GitHub Pages redeployment verification.

## Review Brief
### Original Request
Continue implementation until the H5 game practically conforms to the provided Pixel Flow PRD: audit current gaps, improve reserve/slot/shooter rules, locked mystery shooters, win/lose/settlement UI, treasure/mock reward behavior, main menu and settings/static panels, visual feedback, automated checks, and GitHub Pages redeployment verification.

### Assigned Scope
- Audit current H5 prototype against the provided Pixel Flow PRD and close practical conformance gaps.
- Preserve the existing Vite/TypeScript/Phaser/GitHub Pages setup.
- Improve gameplay rules, UI screens, mock panels, visual feedback, and validation coverage until the implementation is internally consistent with the PRD.

### Deliverables
- PRD conformance checklist in this task record.
- Updated gameplay state handling for reserve pool, active slots, locked mystery shooters, fail/win, treasure/reward mock flow, and result UI.
- Updated main menu static system entry points and settings/mock panels.
- Updated smoke tests covering PRD-critical flows.
- GitHub Pages deployment verification after merge.

### Validation Plan
- Run npm run check.
- Run npm run test:smoke.
- Use Playwright screenshots to inspect main menu, settings panel, gameplay, stuck slot, elimination, and result states.
- Verify public GitHub Pages loads the latest build and passes a PRD gameplay smoke check.

### Constraints And Non-Goals
- Offline-only H5 version: no real backend, purchase, ad SDK, ranking service, notifications, or account system.
- Static/mock panels are acceptable for networked systems per PRD.
- Aim for practical PRD conformance with generated/procedural art; final AI-generated bitmap assets are out of scope unless separately requested.

### PRD Conformance Checklist
- [ ] Main menu map, Play flow, surrounding static systems, settings panel.
- [ ] Gameplay layout: top HUD, central board/track, five active slots, two-row reserve pool.
- [ ] Reserve pool is the only input source.
- [ ] Reserve shooters fly into leftmost empty active slot.
- [ ] Mystery reserve shooters reveal only after preceding shooters are used enough to unlock them.
- [ ] Stuck shooters stay in active slots until their color is exposed on the board edge.
- [ ] Activated shooters move on the track to matching row/column extensions, face center, shoot inward, and consume ammo.
- [ ] Combo continuation while ammo remains and same-color exposed blocks exist.
- [ ] Failure only when full stuck active slots receive another reserve click.
- [ ] Victory result UI with completed text, reward animation/mock, Continue, and 2X Reward.
- [ ] Treasure/reward mock behavior when blocks expose it.
- [ ] Automated local and public deployment checks.

### Claimed Output
- TODO: fill when reporting completion.

### Artifacts And Evidence
- TODO: fill with changed files, commits, generated artifacts, logs, screenshots, or test output.

## Steps
- 2026-05-29T18:37:56Z: task created
- 2026-05-29T18:38:45Z: Document PRD conformance checklist
  - pushed_commit: 1ca3388
- 2026-05-29T18:42:54Z: Tighten PRD gameplay rules
  - pushed_commit: fe5a9f0
- 2026-05-29T19:09:59Z: Stabilize PRD gameplay and smoke coverage
  - pushed_commit: af1efed
