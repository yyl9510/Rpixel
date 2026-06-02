# fix asset git lfs tracking

- task_id: task-20260602-064300-970914-fix-asset-git-lfs-tracking
- branch: work/20260602-064300-084739-fix-asset-git-lfs-tracking
- branch_slug: work__20260602-064300-084739-fix-asset-git-lfs-tracking
- created_utc: 2026-06-02T06:43:00Z
- status: active

## Description
Fix asset Git LFS tracking after image assets were pushed with absolute .gitattributes paths. Convert rules to repo-relative patterns, renormalize GPT_rpixel_assets and Gemini_rpixel_assets so latest commits store LFS pointer files, verify git lfs ls-files and clean working tree, then merge to main.

## Review Brief
### Original Request
Fix asset Git LFS tracking after image assets were pushed with absolute .gitattributes paths. Convert rules to repo-relative patterns, renormalize GPT_rpixel_assets and Gemini_rpixel_assets so latest commits store LFS pointer files, verify git lfs ls-files and clean working tree, then merge to main.

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
- 2026-06-02T06:43:00Z: task created
