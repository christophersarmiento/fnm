---
"fnm": patch
---

Fix a flaky `FNM_AUTH_HEADER` e2e test. The proxy server tracked the last observed `Authorization` header in a single global variable, which parallel test workers clobbered. Auth headers are now recorded per-test via a unique mirror path prefix.
