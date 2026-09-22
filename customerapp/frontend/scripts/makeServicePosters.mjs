/**
 * Pull one still out of every service clip.
 *
 * A service card shows a clip only at the top of the appliance page; the rest
 * of the page shows a still, because six clips playing down one screen is six
 * decoders, six downloads and a page that cannot hold anyone's eye anywhere.
 * The still has to be of *that* service, though — falling back to the
 * appliance drawing would put the same picture on every card and turn a list
 * of services into a list of the same thing.
 *
 * So each poster is a frame of the clip it stands in for, taken from the
 * middle where the work is actually happening rather than from frame zero,
 * which on several of these is the scene before anything has moved.
 *
 * Chrome does the decoding, not ffmpeg. ffmpeg would be one command, but it is
 * not a dependency of this project and is not installed on the machines that
 * touch these; Chrome is already here because `make_service_clips.py` draws
 * the frames with it. The page loads the clip, seeks, paints it into a canvas
 * and hands back a JPEG.
 *
 * Run from `frontend/` after regenerating the clips:
 *
 *     node scripts/makeServicePosters.mjs             # all of them
 *     node scripts/makeServicePosters.mjs ac-service  # or just one
 */
import { spawn } from 'node:child_process'
import { readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const FRONTEND = resolve(HERE, '..')
const CLIPS = join(FRONTEND, 'public', 'services')

const CHROME =
  process.env.CHROME ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = Number(process.env.POSTER_PORT ?? 3407)
const DEBUG_PORT = Number(process.env.POSTER_CDP_PORT ?? 9345)

/** Where in the clip the still is taken from. The middle, where the work is. */
const SEEK_FRACTION = 0.5
/** The card is 16:9 and never wider than a phone at 2x. */
const WIDTH = 1280
const HEIGHT = 720
const QUALITY = 0.82

const only = process.argv[2]
const clips = readdirSync(CLIPS)
  .filter((name) => name.endsWith('.mp4'))
  .filter((name) => !only || name === `${only}.mp4`)

if (clips.length === 0) {
  console.error(only ? `No clip called ${only}.mp4` : 'No clips found.')
  process.exit(1)
}

// A local server, because a <video> loaded from file:// cannot be painted into
// a canvas — the canvas is tainted and toDataURL throws.
const server = createServer((req, res) => {
  const name = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\//, '')
  const file = join(CLIPS, name)
  try {
    const body = readFileSync(file)
    statSync(file)
    res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': body.length })
    res.end(body)
  } catch {
    res.writeHead(404).end('no')
  }
})
await new Promise((done) => server.listen(PORT, '127.0.0.1', done))

const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    `--user-data-dir=${join(process.env.TEMP ?? '/tmp', 'poster-profile-24x7')}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function page() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()
      const found = list.find((t) => t.type === 'page')
      if (found) return found
    } catch {}
    await sleep(250)
  }
  throw new Error('Chrome never came up')
}

const target = await page()
// `ws` lives in the workspace root, and an absolute Windows path is not a
// URL the ESM loader will take — it has to be file://.
const { default: WebSocket } = await import(
  pathToFileURL(resolve(FRONTEND, '..', 'node_modules', 'ws', 'index.js')).href
)
const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false })
let id = 0
const pending = new Map()
ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString())
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve_) => {
    id += 1
    pending.set(id, resolve_)
    ws.send(JSON.stringify({ id, method, params }))
  })

await new Promise((r) => ws.on('open', r))
await send('Runtime.enable')
await send('Page.enable')
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` })
await sleep(500)

for (const clip of clips) {
  const url = `http://127.0.0.1:${PORT}/${clip}`
  const script = `
    (async () => {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.crossOrigin = 'anonymous'
      video.src = ${JSON.stringify(url)}
      await new Promise((ok, no) => {
        video.onloadedmetadata = ok
        video.onerror = () => no(new Error('could not load'))
      })
      video.currentTime = video.duration * ${SEEK_FRACTION}
      await new Promise((ok) => { video.onseeked = ok })
      const canvas = document.createElement('canvas')
      canvas.width = ${WIDTH}
      canvas.height = ${HEIGHT}
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', ${QUALITY})
    })()
  `

  const res = await send('Runtime.evaluate', {
    expression: script,
    awaitPromise: true,
    returnByValue: true,
  })

  const data = res.result?.result?.value
  if (typeof data !== 'string' || !data.startsWith('data:image/jpeg')) {
    console.error(`  ${clip}: no frame came back`)
    continue
  }

  const out = join(CLIPS, clip.replace(/\.mp4$/, '.jpg'))
  writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'))
  console.log(`  ${clip} -> ${clip.replace(/\.mp4$/, '.jpg')}`)
}

ws.close()
chrome.kill()
server.close()
console.log(`${clips.length} poster${clips.length === 1 ? '' : 's'} written.`)
process.exit(0)
