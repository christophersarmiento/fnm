// @ts-check

import { createServer } from "node:http"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import fetch from "node-fetch"
import chalk from "chalk"
import pRetry from "p-retry"

const baseDir = path.join(process.cwd(), ".proxy")
try {
  fs.mkdirSync(baseDir, { recursive: true })
} catch (e) {}

/** @type {Map<string, Promise<{ headers: Record<string, string>, body: ArrayBuffer }>>} */
const cache = new Map()

/**
 * Authorization headers observed per test marker. Tests route fnm through a
 * unique `/__authcheck/<marker>/...` prefix so parallel tests (which all share
 * this single proxy) don't clobber each other's observations.
 * @type {Map<string, string | null>}
 */
const authByMarker = new Map()

/**
 * @param {object} opts
 * @param {string} opts.pathname
 * @param {string} opts.headersFilename
 * @param {string} opts.filename
 */
const download = async ({ pathname, filename, headersFilename }) => {
  const response = await fetch(
    "https://nodejs.org/dist/" + pathname.replace(/^\/+/, ""),
    {
      compress: false,
    },
  )
  const headers = Object.fromEntries(response.headers.entries())
  headers.__status__ = String(response.status)
  const body = await response.arrayBuffer()
  fs.writeFileSync(headersFilename, JSON.stringify(headers))
  fs.writeFileSync(filename, Buffer.from(body))
  return { headers, body }
}

export const server = createServer((req, res) => {
  let pathname = req.url ?? "/"

  const lastAuthMatch = pathname.match(/^\/__last_auth\/([^/]+)\/?$/)
  if (lastAuthMatch) {
    const marker = lastAuthMatch[1]
    res.writeHead(200, { "content-type": "application/json" })
    res.end(
      JSON.stringify({
        seen: authByMarker.has(marker),
        authorization: authByMarker.get(marker) ?? null,
      }),
    )
    return
  }

  // Requests routed through a per-test marker prefix: record the auth header
  // under that marker, then strip the prefix so the upstream path is the real
  // nodejs.org/dist path (and shares the on-disk cache with normal requests).
  const markerMatch = pathname.match(/^\/__authcheck\/([^/]+)(\/.*)$/)
  if (markerMatch) {
    const [, marker, realPath] = markerMatch
    authByMarker.set(marker, req.headers["authorization"] ?? null)
    pathname = realPath
  }

  const hash = crypto
    .createHash("sha1")
    .update(pathname ?? "/")
    .digest("hex")
  const extension = path.extname(pathname)
  const filename = path.join(baseDir, hash) + extension
  const headersFilename = path.join(baseDir, hash) + ".headers.json"
  try {
    const { __status__ = "200", ...headers } = JSON.parse(
      fs.readFileSync(headersFilename, "utf-8"),
    )
    const status = parseInt(__status__, 10)
    const body = fs.createReadStream(filename)
    console.log(chalk.green.dim(`[proxy] hit: ${pathname} -> ${filename}`))
    res.writeHead(status, headers)
    body.pipe(res)
  } catch {
    let promise = cache.get(filename)
    if (!promise) {
      console.log(chalk.red.dim(`[proxy] miss: ${pathname} -> ${filename}`))
      promise = pRetry(
        () => download({ pathname, headersFilename, filename }),
        {
          retries: 5,
          maxTimeout: 5000,
          onFailedAttempt: (error) => {
            console.error(
              chalk.red(
                `[proxy] ${chalk.bold("error")}: ${error.message}, retries left: ${error.retriesLeft}`,
              ),
            )
          },
        },
      )
      cache.set(filename, promise)
      promise.finally(() => cache.delete(filename))
    }

    promise.then(
      ({ headers: { __status__ = "200", ...headers }, body }) => {
        res.writeHead(parseInt(__status__, 10), headers)
        res.end(Buffer.from(body))
      },
      (err) => {
        console.error(err)
        res.writeHead(500)
        res.end()
      },
    )
  }
})
