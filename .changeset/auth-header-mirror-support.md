---
"fnm": minor
---

Add `FNM_AUTH_HEADER` env variable. When set, its value is forwarded verbatim as the `Authorization` HTTP header on requests to the Node.js dist mirror, enabling fnm to work with private/auth-protected mirrors.

```sh-session
$ export FNM_AUTH_HEADER="Bearer ghp_xxxxxxxxxxxx"
$ fnm install 22
```
