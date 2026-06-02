# Remove leftover drawn field chrome

- task_id: task-20260602-083414-115661-remove-leftover-drawn-field-chrome
- branch: work/20260602-083413-140069-remove-leftover-drawn-field-chrome
- branch_slug: work__20260602-083413-140069-remove-leftover-drawn-field-chrome
- created_utc: 2026-06-02T08:34:14Z
- status: active

## Description
Clean up leftover self-drawn visuals after Gemini asset replacement: remove procedural conveyor markers from the field, remove the dark board backing panel so the field is represented by the Gemini track/field texture, and remove the distracting white four-arrow refresh icon from the lower-right visual area while preserving gameplay coordinates and tests.

## Review Brief
### Original Request
Clean up leftover self-drawn visuals after Gemini asset replacement: remove procedural conveyor markers from the field, remove the dark board backing panel so the field is represented by the Gemini track/field texture, and remove the distracting white four-arrow refresh icon from the lower-right visual area while preserving gameplay coordinates and tests.

### Assigned Scope
- Remove leftover procedural field chrome after the Gemini asset pass.
- Keep gameplay coordinates, hit zones, track speed, and debug state stable.
- Confirm the field is represented by the Gemini texture instead of extra drawn panels or conveyor strips.

### Deliverables
- Remove visible conveyor plate objects from the track while preserving virtual conveyor offset/marker debug values.
- Remove the dark board backing panel behind the block grid.
- Remove the field texture's detached lower-right white sparkle/four-arrow artifact by keeping only the largest alpha component of the processed track texture.
- Reduce the extra drawn background panel behind the field.

### Validation Plan
- `npm run typecheck`
- `npm run check`
- `npm run test:smoke`
- Playwright local pixel checks for the former right-bottom sparkle area, former conveyor marker bands, and board backing area.

### Constraints And Non-Goals
- Do not change level data, shooter movement, reserve/waiting coordinates, or click zones.
- Do not edit the Gemini source PNGs; clean artifacts during texture processing.
- Do not inspect full screenshots; use local crops and Playwright pixel/debug checks.

### Claimed Output
- Replaced visible conveyor plates with virtual conveyor metrics only.
- Removed black board panels drawn behind the grid.
- Added track texture component filtering so detached source-sheet decoration does not render in the field.

### Artifacts And Evidence
- `npm run typecheck` passed.
- `npm run check` passed.
- `npm run test:smoke` passed: 8/8 tests.
- Local crop confirmed the white four-arrow/sparkle artifact was embedded in `Gemini_rpixel_assets/track_frame.png` near the source right-bottom corner.
- Playwright pixel sample at the former field right-bottom sparkle location reported `whiteRatio=0` and `cyanWhiteRatio=0`.
- Playwright samples on former conveyor marker bands reported no pure-white marker ratio; board center backing sample reported low dark ratio, confirming the black board backing panel is gone.

## Steps
- 2026-06-02T08:34:14Z: task created
- 2026-06-02T08:38:47Z: Remove leftover drawn field chrome
