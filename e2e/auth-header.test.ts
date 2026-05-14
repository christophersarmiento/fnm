import { script } from "./shellcode/script.js"
import { Bash } from "./shellcode/shells.js"
import describe from "./describe.js"
import crypto from "node:crypto"

type AuthProbe = { seen: boolean; authorization: string | null }

describe(Bash, () => {
  test(`forwards FNM_AUTH_HEADER as Authorization on dist mirror requests`, async () => {
    const marker = crypto.randomUUID()
    await script(Bash)
      .addExtraEnvVar("FNM_AUTH_HEADER", "Bearer test-token-xyz")
      .addExtraEnvVar(
        "FNM_NODE_DIST_MIRROR",
        `http://localhost:8080/__authcheck/${marker}`
      )
      .then(Bash.env({}))
      .then(Bash.call("fnm", ["ls-remote"]))
      .execute(Bash)

    const res = await fetch(`http://localhost:8080/__last_auth/${marker}`)
    const { seen, authorization } = (await res.json()) as AuthProbe
    expect(seen).toBe(true)
    expect(authorization).toBe("Bearer test-token-xyz")
  })

  test(`sends no Authorization header when FNM_AUTH_HEADER is unset`, async () => {
    const marker = crypto.randomUUID()
    await script(Bash)
      .addExtraEnvVar(
        "FNM_NODE_DIST_MIRROR",
        `http://localhost:8080/__authcheck/${marker}`
      )
      .then(Bash.env({}))
      .then(Bash.call("fnm", ["ls-remote"]))
      .execute(Bash)

    const res = await fetch(`http://localhost:8080/__last_auth/${marker}`)
    const { seen, authorization } = (await res.json()) as AuthProbe
    expect(seen).toBe(true)
    expect(authorization).toBeNull()
  })
})
