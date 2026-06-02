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
- Fix Git LFS tracking for AI-generated image asset directories that had been committed with machine-local absolute `.gitattributes` paths.
- Keep the existing image files usable locally while making the Git index store LFS pointer files for the tracked assets.
- Merge the corrected tracking state back to `main` after verification.

### Deliverables
- `.gitattributes` uses repo-relative directory rules for `GPT_rpixel_assets/**` and `Gemini_rpixel_assets/**`.
- Existing PNG assets in those directories are renormalized into Git LFS pointer entries in the index.
- Work branch and `main` are pushed after validation.

### Validation Plan
- `git check-attr -a -- GPT_rpixel_assets/monster_blue.png Gemini_rpixel_assets/monster_spritesheet.png GPT_rpixel_assets/track_frame.png`
- `git lfs ls-files`
- `git cat-file -p :GPT_rpixel_assets/monster_blue.png`
- `file GPT_rpixel_assets/monster_blue.png`
- `git lfs status`
- `git lfs fsck`

### Constraints And Non-Goals
- Do not inspect or modify image content; this task only fixes Git/LFS storage metadata.
- Do not rewrite repository history; convert the latest tree state with a normal commit.
- Do not touch gameplay, UI, or unrelated assets outside the two generated asset directories.

### Claimed Output
- Replaced absolute `.gitattributes` entries with two repo-relative recursive LFS patterns.
- Ran `git add --renormalize` for `GPT_rpixel_assets` and `Gemini_rpixel_assets`, converting 33 PNG entries to LFS pointers while preserving local working files as PNG images.

### Artifacts And Evidence
- `git check-attr` reports `filter: lfs`, `diff: lfs`, `merge: lfs`, and `text: unset` for sampled assets.
- `git lfs ls-files` lists the generated asset files under both asset directories.
- `git cat-file -p :GPT_rpixel_assets/monster_blue.png` shows a Git LFS pointer (`version https://git-lfs.github.com/spec/v1`).
- `file GPT_rpixel_assets/monster_blue.png` reports a normal PNG working-tree file.
- `git lfs status` shows the staged conversion from Git blobs to LFS objects.
- `git lfs fsck` completed with `Git LFS fsck OK`.

## Steps
- 2026-06-02T06:43:00Z: task created
- 2026-06-02T06:45:16Z: Fix asset Git LFS tracking
  - pushed_commit: f61ce7e
