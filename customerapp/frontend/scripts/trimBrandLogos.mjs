/**
 * Trim each brand logo's viewBox down to the mark inside it.
 *
 * The files these come from normalise every logo into a 24×24 square with the
 * mark centred in it. That is right for an icon font and wrong for a grid: a
 * square device like Bosch fills its box, and a wide, short wordmark like
 * Samsung occupies a band about a quarter of the height — so when both are
 * drawn `object-contain` in the same tile, one is four times the optical size
 * of the other and the grid looks assembled rather than designed.
 *
 * So the viewBox is refitted to the drawing's own bounding box. Nothing about
 * the geometry changes; the box around it stops including empty space. After
 * this a wide mark fills the tile's width and a square one fills its height,
 * which is what makes them look like they belong to each other.
 *
 * Chrome does the measuring, because `getBBox()` is the browser's answer and
 * reimplementing it over path data is a bezier solver nobody should write
 * twice. Run it from `frontend/` after adding a logo:
 *
 *     node scripts/trimBrandLogos.mjs
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const FRONTEND = resolve(HERE, '..')
const DIR = join(FRONTEND, 'public', 'brands')

const CHROME =
  process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = Number(process.env.TRIM_PORT ?? 3408)
const DEBUG_PORT = Number(process.env.TRIM_CDP_PORT ?? 9346)

/** A hair of space, so a stroke that touches the edge is not clipped. */
const PAD = 0.5

const files = readdirSync(DIR).filter((name) => name.endsWith('.svg'))
if (files.length === 0) {
  console.log('No logos to trim.')
  process.exit(0)
}

const server = createServer((req, res) => {
  const name = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\//, '')
  try {
    const body = readFileSync(join(DIR, name))
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' })
    res.end(body)
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><title>trim</title>')
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
    `--user-data-dir=${join(process.env.TEMP ?? '/tmp', 'trim-profile-24x7')}`,
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
  new Promise((done) => {
    id += 1
    pending.set(id, done)
    ws.send(JSON.stringify({ id, method, params }))
  })

await new Promise((r) => ws.on('open', r))
await send('Runtime.enable')
await send('Page.enable')
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` })
await sleep(400)

for (const file of files) {
  const source = readFileSync(join(DIR, file), 'utf8')

  const script = `
    (async () => {
      const markup = await (await fetch(${JSON.stringify(`/${file}`)})).text()
      const holder = document.createElement('div')
      holder.style.cssText = 'position:absolute;left:-9999px;width:240px;height:240px'
      holder.innerHTML = markup
      document.body.appendChild(holder)
      const svg = holder.querySelector('svg')
      const box = svg.getBBox()
      holder.remove()
      return JSON.stringify({ x: box.x, y: box.y, width: box.width, height: box.height })
    })()
  `

  const res = await send('Runtime.evaluate', {
    expression: script,
    awaitPromise: true,
    returnByValue: true,
  })

  const raw = res.result?.result?.value
  if (typeof raw !== 'string') {
    console.error(`  ${file}: could not measure it`)
    continue
  }

  const box = JSON.parse(raw)
  if (!(box.width > 0 && box.height > 0)) {
    console.error(`  ${file}: empty bounding box, left alone`)
    continue
  }

  const round = (n) => Math.round(n * 1000) / 1000
  const viewBox = [
    round(box.x - PAD),
    round(box.y - PAD),
    round(box.width + PAD * 2),
    round(box.height + PAD * 2),
  ].join(' ')

  const trimmed = source.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
  if (trimmed === source) {
    // Either it has no viewBox at all, or it already fits — the second is the
    // usual case on a re-run and is not worth reporting as a problem.
    console.log(
      source.includes('viewBox=')
        ? `  ${file} already fits`
        : `  ${file}: no viewBox to trim`
    )
    continue
  }

  writeFileSync(join(DIR, file), trimmed)
  console.log(`  ${file} -> viewBox="${viewBox}"`)
}

ws.close()
chrome.kill()
server.close()
console.log(`${files.length} logo${files.length === 1 ? '' : 's'} checked.`)
process.exit(0)
