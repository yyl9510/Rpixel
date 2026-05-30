# Harden shooter hit zones

- task_id: task-20260530-164551-762618-harden-shooter-hit-zones
- branch: work/20260530-164550-751385-harden-shooter-hit-zones
- branch_slug: work__20260530-164550-751385-harden-shooter-hit-zones
- created_utc: 2026-05-30T16:45:51Z
- status: active

## Description
User still reports shooters are hard or impossible to click. Replace fragile container-only clicks with explicit large transparent hit zones for reserve first-row shooters and waiting slots, keep active capacity gating, avoid duplicate launches, validate and deploy.

## Review Brief
### Original Request
User still reports shooters are hard or impossible to click. Replace fragile container-only clicks with explicit large transparent hit zones for reserve first-row shooters and waiting slots, keep active capacity gating, avoid duplicate launches, validate and deploy.

### Assigned Scope
- Harden manual shooter launching so reserve first-row shooters and waiting-area shooters remain clickable even when the sprite/container hit area misses.
- Preserve active capacity gating and avoid duplicate launches from a single tap.

### Deliverables
- Explicit transparent hit zones above all reserve first-row shooters.
- Explicit transparent hit zones above all waiting shooters, including those still entering the waiting area.
- Rebuild hit zones whenever reserve or waiting-slot state changes.

### Validation Plan
- `npm run check`
- `npm run test:smoke`
- Manual Playwright short-viewport regression for edge-clicking all three reserve first-row shooters and one waiting shooter.
- GitHub Pages deployment verification after merge.

### Constraints And Non-Goals
- Do not change core gameplay rules, capacity count, waiting overflow death, reserve column advancement, or ammo/block balance.

### Claimed Output
- Added a high-depth transparent manual hit layer with per-shooter launch zones.
- The hit layer now catches taps on reserve first-row shooters and waiting shooters with larger touch targets than the visual sprites.
- One pointer event still launches at most one shooter.

### Artifacts And Evidence
- Changed file: `src/game/scenes/GameScene.ts`.
- Validation passed locally: `npm run check`; `npm run test:smoke` (`6 passed`).
- Manual short-viewport Playwright regression passed for all first-row reserve shooter edge clicks and waiting shooter edge click.

## Steps
- 2026-05-30T16:45:51Z: task created
- 2026-05-30T16:49:42Z: Add explicit shooter hit zones
