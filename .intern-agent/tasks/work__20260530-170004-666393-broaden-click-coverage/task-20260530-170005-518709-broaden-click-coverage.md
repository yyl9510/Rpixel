# Broaden click coverage

- task_id: task-20260530-170005-518709-broaden-click-coverage
- branch: work/20260530-170004-666393-broaden-click-coverage
- branch_slug: work__20260530-170004-666393-broaden-click-coverage
- created_utc: 2026-05-30T17:00:05Z
- status: active

## Description
Continue after explicit shooter hit zones by adding stronger automated coverage for reserve first-row and waiting slot clickability across edge/corner positions. Fix any remaining clickability issues, validate, push, and deploy.

## Review Brief
### Original Request
Continue after explicit shooter hit zones by adding stronger automated coverage for reserve first-row and waiting slot clickability across edge/corner positions. Fix any remaining clickability issues, validate, push, and deploy.

### Assigned Scope
- Add stronger regression coverage for the explicit shooter hit zones.
- Cover all three reserve first-row columns and all five waiting slots using edge-position clicks.

### Deliverables
- A Playwright smoke test that launches all first-row reserve columns from the edge of their hit zones.
- The same test fills five waiting slots and relaunches all five from right to left using edge clicks.

### Validation Plan
- `npx playwright test tests/smoke.spec.ts -g "edge hit zones"`
- `npm run check`
- `npm run test:smoke`
- GitHub Pages deployment verification after merge.

### Constraints And Non-Goals
- Do not change gameplay behavior unless the stronger regression exposes a real bug.
- Keep the existing active capacity and waiting overflow rules unchanged.

### Claimed Output
- Added a dedicated edge-hit-zone smoke regression covering three reserve columns and five waiting positions.
- No gameplay code change was needed in this slice because the hardened hit-zone implementation passed the expanded coverage.

### Artifacts And Evidence
- Changed files: `tests/smoke.spec.ts`, task record.
- Validation passed locally: targeted edge-hit-zone test; `npm run check`; `npm run test:smoke` (`7 passed`).

## Steps
- 2026-05-30T17:00:05Z: task created
- 2026-05-30T17:03:18Z: Broaden shooter hit zone smoke coverage
  - pushed_commit: e48aca1
