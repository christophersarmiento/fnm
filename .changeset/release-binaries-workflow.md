---
"fnm": patch
---

Add a `release binaries` GitHub Actions workflow that builds the per-platform binaries and publishes them as `fnm-<platform>.zip` assets on a GitHub Release when a tag is pushed. Remove the `release to cargo` workflow, as releases are published only via GitHub Releases.
