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
- Incorporate the follow-up Pixel Flow core restoration request: pseudo-3D blocks/shooters, irregular board, visible arrow track, track movement/facing, stronger hit feedback, treasure placeholder, and improved full-slot failure UI.

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
- [x] Main menu map, Play flow, surrounding static systems, settings panel.
- [x] Gameplay layout: top HUD, central board/track, five active slots, two-row reserve pool.
- [x] Reserve pool is the only input source.
- [x] Reserve shooters fly into leftmost empty active slot.
- [x] Mystery reserve shooters reveal only after preceding shooters are used enough to unlock them.
- [x] Stuck shooters stay in active slots until their color is exposed on the board edge.
- [x] Activated shooters move on the track to matching row/column extensions, face center, shoot inward, and consume ammo.
- [x] Combo continuation while ammo remains and same-color exposed blocks exist.
- [x] Failure only when full stuck active slots receive another reserve click and no stuck slot can currently activate.
- [x] Victory result UI with completed text, reward animation/mock, Continue, and 2X Reward.
- [x] Treasure/reward mock behavior when surrounding blocks expose it.
- [x] Irregular arch-style board layout using null cells rather than a fixed rectangular fill.
- [x] Pseudo-3D glossy block and shooter textures with directional shooter body rotation.
- [x] Visible arrowed track and stronger beam, shard, particle, shake, and treasure unlock feedback.
- [ ] Automated local and public deployment checks.

### Claimed Output
- H5 Pixel Flow prototype updated for practical PRD conformance using the existing Phaser/Vite/GitHub Pages stack.
- Core single-level logic now covers reserve-only input, leftmost slot entry, stuck/reactivated shooters, strict exposed-edge targeting, track movement, combo continuation, treasure unlock/reward mock, win/fail panels, and level progress persistence.
- Follow-up visual/gameplay restoration added pseudo-3D blocks/shooters, an irregular arch board, arrowed track, shooter body facing, stronger beam/shatter feedback, and a clearer full-slot failure panel.

### Artifacts And Evidence
- Changed files: src/game/assets.ts, src/game/data/levels.ts, src/game/scenes/GameScene.ts, src/game/scenes/MenuScene.ts, src/main.ts, tests/smoke.spec.ts.
- Local validation: npm run check passed; npm run test:smoke passed with 3/3 tests.
- Playwright visual artifacts generated under ignored test-results/: visual-menu.png, visual-settings.png, visual-gameplay.png, visual-stuck-slot.png, visual-win.png.
- Latest visual state check: canvas 1080x1920, nonblank luma/alpha samples, stuck-slot state blocks=37 slots=1 stuck=1 locked=7, win state blocks=0 treasure=true.
- Public GitHub Pages deployment verification is performed after merging/pushing main and reported in the final completion report.

## Steps
- 2026-05-29T18:37:56Z: task created
- 2026-05-29T18:38:45Z: Document PRD conformance checklist
  - pushed_commit: 1ca3388
- 2026-05-29T18:42:54Z: Tighten PRD gameplay rules
  - pushed_commit: fe5a9f0
- 2026-05-29T19:09:59Z: Stabilize PRD gameplay and smoke coverage
  - pushed_commit: af1efed
- 2026-05-29T19:16:52Z: Enhance Pixel Flow visuals and track gameplay
  - pushed_commit: aab70f4
- 2026-05-29T19:17:33Z: Record Pixel Flow conformance evidence
