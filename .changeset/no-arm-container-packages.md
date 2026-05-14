---
"fnm": patch
---

Stop the ARM sanity-test CI step from caching container images in the GitHub package registry. The `githubToken` input on `run-on-arch-action` was optional (a build-speed optimization) but caused container packages to be published under the repository.
