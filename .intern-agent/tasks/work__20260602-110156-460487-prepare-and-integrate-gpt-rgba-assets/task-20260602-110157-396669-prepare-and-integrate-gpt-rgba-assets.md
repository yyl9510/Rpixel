# Prepare and integrate GPT RGBA assets

- task_id: task-20260602-110157-396669-prepare-and-integrate-gpt-rgba-assets
- branch: work/20260602-110156-460487-prepare-and-integrate-gpt-rgba-assets
- branch_slug: work__20260602-110156-460487-prepare-and-integrate-gpt-rgba-assets
- created_utc: 2026-06-02T11:01:57Z
- status: active

## Description
Pull latest GPT RGBA assets, add preprocessing to clean edge-connected gray/white background remnants, crop alpha bounds into consistent texture sizes, prefer GPT assets over Gemini fallbacks, and verify gameplay/visual positions.

## Review Brief
### Original Request
Pull latest GPT RGBA assets, add preprocessing to clean edge-connected gray/white background remnants, crop alpha bounds into consistent texture sizes, prefer GPT assets over Gemini fallbacks, and verify gameplay/visual positions.

### Assigned Scope
- Pull and use the latest GPT RGBA asset set from `main`.
- Clean edge-connected gray/white remnants from GPT PNGs before turning them into Phaser textures.
- Map GPT blocks, monsters, track frame, waiting slot frame, HUD icons, and booster buttons into the existing runtime texture keys so gameplay code keeps using the same keys.
- Keep Gemini assets as a fallback path without reintroducing removed decorative field chrome.

### Deliverables
- `src/game/assets.ts`: GPT asset preload sources, edge-background cleanup, tint/crop/resize processing, and compatibility texture mapping.
- `src/game/scenes/BootScene.ts`: GPT source images are preloaded before generated textures are created.
- Runtime validation evidence that GPT sources load and reserve/HUD label centering remains intact.

### Validation Plan
- `npm run typecheck`
- `npm run check`
- `npm run test:smoke`
- Playwright runtime probe: verify GPT asset map, 22 GPT image loads, five reserve columns, ammo/HUD center deltas, and corner pixel samples around reserve tokens.

### Constraints And Non-Goals
- Do not bulk-open full screenshots or large image batches; use local metadata and Playwright/canvas checks.
- Do not change gameplay rules or reserve/waiting/track movement behavior in this asset-integration step.
- Preserve existing texture key contracts used by `GameScene` and `ShooterToken`.

### Claimed Output
- GPT RGBA images are now the preferred source for blocks, monsters/shooters, track frame, waiting slot frame, HUD icons, booster icons, and the red button base.
- Edge-connected near-white GPT background pixels are flood-filled to transparent before trimming/scaling, preventing gray/white square remnants from appearing around sprites.
- Gemini generated textures remain as fallback if GPT sources are unavailable, but they do not overwrite GPT-created compatibility keys.

### Artifacts And Evidence
- Changed files: `src/game/assets.ts`, `src/game/scenes/BootScene.ts`.
- `npm run typecheck`: passed.
- `npm run check`: passed after final cleanup.
- `npm run test:smoke`: 8 passed.
- Playwright runtime probe: `__RPIXEL_GPT_ASSET_MAP__` contains blocks/monsters/track/waitingSlots/hud/boosters; 22 GPT asset responses loaded with no HTTP errors; reserve columns are `160,350,540,730,920`; max reserve ammo-label delta is `0`; speed label center delta is `(0,0)`; capacity label center delta is `(0,0.5)`; 20 reserve-token corner samples had `0` near-white remnants.

## Steps
- 2026-06-02T11:01:57Z: task created
- 2026-06-02T11:09:53Z: Prepare and integrate GPT RGBA assets
  - pushed_commit: 272a186
