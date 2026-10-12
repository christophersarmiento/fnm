import { describe as vitestDescribe } from "vitest"
import { WinCmd } from "./shellcode/shells.js"
import { Shell } from "./shellcode/shells/types.js"

export default function describe(
  shell: Pick<Shell, "name">,
  fn: () => void,
): void {
  if (shell === WinCmd) {
    // wincmd tests do not work right now and I don't have a Windows machine to fix it
    // maybe in the future when I have some time to spin a VM to check what's happening.
    vitestDescribe.skip("WinCmd", fn)
    return
  }

  vitestDescribe(shell.name(), fn)
}
