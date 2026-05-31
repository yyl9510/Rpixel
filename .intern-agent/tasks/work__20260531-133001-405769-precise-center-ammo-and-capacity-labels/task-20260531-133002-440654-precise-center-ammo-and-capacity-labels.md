# precise center ammo and capacity labels

- task_id: task-20260531-133002-440654-precise-center-ammo-and-capacity-labels
- branch: work/20260531-133001-405769-precise-center-ammo-and-capacity-labels
- branch_slug: work__20260531-133001-405769-precise-center-ammo-and-capacity-labels
- created_utc: 2026-05-31T13:30:02Z
- status: active

## Description
用户再次反馈：小怪中间数字仍然没放到小怪中心，场上 0-5 容量数字也没有放到显示区域中心。需要按实际视觉/坐标精确修正数字中心位置，并验证。

## Review Brief
### Original Request
用户再次反馈：小怪中间数字仍然没放到小怪中心，场上 0-5 容量数字也没有放到显示区域中心。需要按实际视觉/坐标精确修正数字中心位置，并验证。

### Assigned Scope
- Replace approximate label positioning with bounds-based centering for shooter ammo labels and the active capacity text.
- Treat the shooter container center as the target center for every visible reserve ammo label.
- Treat the capacity pill position as the target center for `0-5` and later capacity labels.
- Add automated assertions so future visual polish cannot drift these labels off-center again.

### Deliverables
- `src/game/scenes/GameScene.ts`: bounds-centered ammo/capacity text helpers and reserve label debug output.
- `src/main.ts`: debug type for reserve label centering evidence.
- `tests/smoke.spec.ts`: assertions for capacity text center and reserve ammo label center deltas.

### Validation Plan
- Run `npm run check`.
- Run `npm run test:smoke`.
- Run `git diff --check`.
- Capture one local screenshot after the change and inspect label placement.
- Push branch, merge to `main`, verify GitHub Pages workflow, and run online sanity check.

### Constraints And Non-Goals
- Keep changes scoped to label positioning and test/debug coverage.
- Avoid bulk screenshot review.

### Claimed Output
- Ammo text bounds are now programmatically centered on each shooter container center instead of using hand-tuned offsets.
- Active capacity text bounds are now programmatically centered on the capacity pill center after every label update.
- Smoke tests now fail if capacity text center or visible reserve ammo label centers drift by more than 1 game unit.

### Artifacts And Evidence
- Changed files: `src/game/scenes/GameScene.ts`, `src/main.ts`, `tests/smoke.spec.ts`.
- Validation: `npm run check` passed; `npm run test:smoke` passed 8/8; `git diff --check` passed.
- Local visual/debug evidence: `/tmp/rpixel-label-center-current.png` captured the pre-fix state; `/tmp/rpixel-label-center-fixed.png` captured the bounds-centered result. Debug output showed all six reserve labels with `deltaX: 0` and `deltaY: 0`; capacity bounds centered at the pill center within rounding.

## Steps
- 2026-05-31T13:30:02Z: task created
- 2026-05-31T13:35:22Z: Implement bounds-based centering for ammo and capacity labels
- 2026-05-31T13:35:43Z: Precisely center ammo and capacity labels
