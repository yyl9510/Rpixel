# Prototype procedural animation polish

- task_id: task-20260610-061117-946653-prototype-procedural-animation-polish
- branch: work/20260610-061116-599235-prototype-procedural-animation-polish
- branch_slug: work__20260610-061116-599235-prototype-procedural-animation-polish
- created_utc: 2026-06-10T06:11:17Z
- status: active

## Description
Implement a first pass of no-new-art procedural animation polish for the Phaser game: smoother shooter launch/return/queue motion, hit/block disappearance feedback, ammo-empty disappearance, and click feedback using existing images, tweens, and generated particles/shapes.

## Review Brief
### Original Request
Implement a first pass of no-new-art procedural animation polish for the Phaser game: smoother shooter launch/return/queue motion, hit/block disappearance feedback, ammo-empty disappearance, and click feedback using existing images, tweens, and generated particles/shapes.

### Assigned Scope
- Create a first pass of no-new-art animation polish using the existing Phaser scene, existing shooter/block textures, tweens, and generated geometry.
- Improve shooter launch, waiting/reserve movement, return-to-waiting, projectile flight, block hit/disappear, ammo-exhaust disappearance, and tap feedback.
- Keep gameplay rules, texture assets, level data, and public debug contracts intact.

### Deliverables
- `src/game/scenes/GameScene.ts` animation polish only.
- No new image assets, no third-party animation library, and no Unity-related migration.
- Runtime-visible effects: arced launch/return paths, squash/stretch, ghost trails, landing pulses, recoil, projectile trails, stronger block impact, and smoother queue compaction.

### Validation Plan
- `npm run typecheck`
- `npm run check`
- `npm run test:smoke`
- Manual/runtime review through the dev server or deployed Pages page.

### Constraints And Non-Goals
- Do not add or request new art for this first pass.
- Do not introduce GSAP, Spine, DragonBones, Unity, or other new runtime dependencies yet.
- Avoid changing gameplay timing enough to break existing smoke flows.
- Avoid screenshot-heavy validation; use tests and live page review.

### Claimed Output
- Added procedural animation helpers for quadratic paths, shooter trails, projectile trails, launch dust, click pulses, landing settle, and shooter recoil.
- Shooter launch now uses a curved path with squash/stretch, ghost trails, launch dust, and landing settle.
- Reserve and waiting queue movement now uses eased/arched motion, staggered compaction, visual stretch, trails, and landing settle instead of plain linear shifts.
- Shooter return to waiting now follows a fixed arced path into the target slot and settles there.
- Projectile flight is visible with a curved short path and trail; shooters recoil when firing.
- Block clearing now has screen shake, flash tint, expanding block silhouette, existing particles/shards, and shrink-out.
- Ammo-exhaust disappearance now has a stronger burst/trail and squash-then-collapse animation.

### Artifacts And Evidence
- Changed file: `src/game/scenes/GameScene.ts`.
- `npm run typecheck`: passed.
- `npm run check`: passed.
- `npm run test:smoke`: 8 passed.

## Steps
- 2026-06-10T06:11:17Z: task created
- 2026-06-10T06:17:41Z: Prototype procedural animation polish
