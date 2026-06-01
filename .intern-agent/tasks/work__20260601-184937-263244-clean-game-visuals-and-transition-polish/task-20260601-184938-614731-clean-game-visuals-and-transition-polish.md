# clean game visuals and transition polish

- task_id: task-20260601-184938-614731-clean-game-visuals-and-transition-polish
- branch: work/20260601-184937-263244-clean-game-visuals-and-transition-polish
- branch_slug: work__20260601-184937-263244-clean-game-visuals-and-transition-polish
- created_utc: 2026-06-01T18:49:38Z
- status: active

## Description
User requested: add smooth transition when waiting-area shooters shift left after launching the leftmost waiting shooter; redesign the dense low-quality arrow track into a cleaner harmonious track; remove bottom blank area under four booster buttons; remove useless white decorative objects near lower-left/right-upper playfield; simplify overall game visuals by removing unnecessary patterns, lines, recessed panel complexity, and keeping the screen cleaner/fresher.

## Review Brief
### Original Request
User requested: add smooth transition when waiting-area shooters shift left after launching the leftmost waiting shooter; redesign the dense low-quality arrow track into a cleaner harmonious track; remove bottom blank area under four booster buttons; remove useless white decorative objects near lower-left/right-upper playfield; simplify overall game visuals by removing unnecessary patterns, lines, recessed panel complexity, and keeping the screen cleaner/fresher.

### Assigned Scope
- Add a visible, eased shift animation when waiting-area shooters compact left after one launches.
- Redesign the dense arrow track into a cleaner, calmer track with fewer subtle flow markers.
- Remove unused transfer-lane/white decorative objects and reduce panel/line clutter across the playfield.
- Make the bottom booster bar fill the bottom area cleanly so the four buttons no longer sit above an empty strip.

### Deliverables
- Scoped visual and animation updates in `src/game/scenes/GameScene.ts`.
- Smoke test updates only if debug constants need to track revised layout values.
- Validation evidence from `npm run check` and `npm run test:smoke`.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Use lightweight Playwright/debug checks if needed; avoid full screenshot viewing.

### Constraints And Non-Goals
- Do not change level rules, shooter capacity, ammo totals, or board data.
- Keep changes focused on visual presentation and transition timing.

### Claimed Output
- Waiting-area compaction now uses a 280ms eased slide with a small lift/settle instead of the old 150ms straight tween.
- Removed the unused transfer-lane/ramp decorations and replaced dense chevron arrows with fewer subtle rounded flow markers.
- Simplified background, board panel, waiting slots, and reserve panel by removing extra lines, gloss bars, and nested decorative layers.
- Expanded the bottom booster bar to fill the area under the four buttons and moved badges inside the bar.

### Artifacts And Evidence
- Changed file: `src/game/scenes/GameScene.ts`.
- Validation: `npm run check` passed.
- Validation: `npm run test:smoke` passed, 8/8.
- Lightweight Playwright/pixel debug: track marker count 31, spacing 132; bottom pixels at y=1910 are booster-bar color, not background blank.

## Steps
- 2026-06-01T18:49:38Z: task created
- 2026-06-01T18:58:00Z: implemented waiting-slot shift animation and visual cleanup for track, board, reserve, waiting area, and bottom bar.
- 2026-06-01T19:00:00Z: `npm run check`, `npm run test:smoke`, and lightweight Playwright pixel/debug checks passed.
- 2026-06-01T18:55:21Z: Clean game visuals and waiting transitions
  - pushed_commit: aae1631
