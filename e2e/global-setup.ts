// @ts-expect-error -- untyped JavaScript module
import { server } from "../tests/proxy-server/index.mjs"

export default function setup() {
  server.listen(8080)

  return () => {
    server.close()
  }
}
