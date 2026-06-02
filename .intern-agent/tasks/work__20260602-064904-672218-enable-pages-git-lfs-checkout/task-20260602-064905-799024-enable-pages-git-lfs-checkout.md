# Enable Pages Git LFS checkout

- task_id: task-20260602-064905-799024-enable-pages-git-lfs-checkout
- branch: work/20260602-064904-672218-enable-pages-git-lfs-checkout
- branch_slug: work__20260602-064904-672218-enable-pages-git-lfs-checkout
- created_utc: 2026-06-02T06:49:05Z
- status: complete

## Description
Ensure GitHub Pages workflow checks out Git LFS files so generated image assets are available as real PNGs during future builds.

## Review Brief
### Original Request
Ensure GitHub Pages workflow checks out Git LFS files so generated image assets are available as real PNGs during future builds.

### Assigned Scope
- Update the GitHub Pages workflow so `actions/checkout` downloads Git LFS files during CI builds.
- Keep the change limited to deployment workflow configuration.

### Deliverables
- `.github/workflows/deploy.yml` checkout step includes `with: lfs: true`.

### Validation Plan
- Inspect workflow diff.
- Merge to `main`, push, and verify the triggered Pages workflow completes successfully.

### Constraints And Non-Goals
- Do not modify gameplay or asset content.
- Do not change build, test, or deploy job ordering beyond LFS checkout configuration.

### Claimed Output
- Enabled Git LFS checkout in the Pages workflow so generated image assets will be real PNG files in future builds that import them.

### Artifacts And Evidence
- `git diff -- .github/workflows/deploy.yml` shows only the `lfs: true` checkout configuration.

## Steps
- 2026-06-02T06:49:05Z: task created
- 2026-06-02T06:49:42Z: completed - Enable Pages Git LFS checkout
