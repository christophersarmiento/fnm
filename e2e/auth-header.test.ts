import { script } from "./shellcode/script.js"
import { Bash } from "./shellcode/shells.js"
import describe from "./describe.js"

describe(Bash, () => {
  test(`forwards FNM_AUTH_HEADER as Authorization on dist mirror requests`, async () => {
    await script(Bash)
      .addExtraEnvVar("FNM_AUTH_HEADER", "Bearer test-token-xyz")
      .then(Bash.env({}))
      .then(Bash.call("fnm", ["ls-remote"]))
      .execute(Bash)

    const res = await fetch("http://localhost:8080/__last_auth")
    const { authorization } = (await res.json()) as { authorization: string | null }
    expect(authorization).toBe("Bearer test-token-xyz")
  })

  test(`sends no Authorization header when FNM_AUTH_HEADER is unset`, async () => {
    await script(Bash)
      .then(Bash.env({}))
      .then(Bash.call("fnm", ["ls-remote"]))
      .execute(Bash)

    const res = await fetch("http://localhost:8080/__last_auth")
    const { authorization } = (await res.json()) as { authorization: string | null }
    expect(authorization).toBeNull()
  })
})
