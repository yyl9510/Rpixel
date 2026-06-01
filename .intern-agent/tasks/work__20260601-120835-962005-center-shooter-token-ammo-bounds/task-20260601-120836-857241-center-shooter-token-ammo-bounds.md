# Center shooter token ammo bounds

- task_id: task-20260601-120836-857241-center-shooter-token-ammo-bounds
- branch: work/20260601-120835-962005-center-shooter-token-ammo-bounds
- branch_slug: work__20260601-120835-962005-center-shooter-token-ammo-bounds
- created_utc: 2026-06-01T12:08:36Z
- status: active

## Description
用户追问小怪是否为类，以及为什么数字像是左上角落在小怪中心；复查后发现 ShooterToken 已是类，但 ammoLabelDebug 检查的是 Text transform 原点，不是实际文字 bounds 中心。需要把实际 bounds 居中逻辑放到 ShooterToken 内部，并验证。

## Review Brief
### Original Request
用户追问小怪是否为类，以及为什么数字像是左上角落在小怪中心；复查后发现 ShooterToken 已是类，但 ammoLabelDebug 检查的是 Text transform 原点，不是实际文字 bounds 中心。需要把实际 bounds 居中逻辑放到 ShooterToken 内部，并验证。

### Assigned Scope
- TODO: summarize the agreed scope before delegating or implementing.

### Deliverables
- TODO: list expected files, artifacts, decisions, or reports.

### Validation Plan
- TODO: list tests, commands, source checks, or review criteria.

### Constraints And Non-Goals
- TODO: list constraints such as no restart, no unrelated refactors, file ownership, or deployment limits.

### Claimed Output
- TODO: fill when reporting completion.

### Artifacts And Evidence
- TODO: fill with changed files, commits, generated artifacts, logs, screenshots, or test output.

## Steps
- 2026-06-01T12:08:36Z: task created
