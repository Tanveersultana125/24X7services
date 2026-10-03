// Renders screens of the web export (dist-web) in headless Chrome and saves
// phone-sized screenshots, so a change can be looked at rather than assumed.
//
//   node scripts/shot.mjs <outDir> <path> [<path> …] [--dark] [--width=390]
//
// Serves dist-web itself on a free port, seeds a saved location (so Home does
// not bounce to the location step), and reports console errors and
// exceptions per screen. Needs Chrome and `ws` (customerapp/node_modules).

import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const WebSocket = require(join(root, '..', 'node_modules', 'ws'))

const args = process.argv.slice(2)
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [, k, v] = a.slice(2).match(/^([^=]*)(?:=([\s\S]*))?$/)
    return [k, v ?? true]
  })
)
const [rawOutDir, ...paths] = args.filter((a) => !a.startsWith('--'))
// With MSYS_NO_PATHCONV=1, Git Bash hands over '/c/Users/...' untranslated,
// which Node would write under C:\c\. Turn it back into a drive path.
const outDir = rawOutDir.replace(/^\/([a-z])\//i, (_, drive) => `${drive.toUpperCase()}:/`)
const width = Number(flags.width ?? 390)
const height = Number(flags.height ?? 844)
const dark = Boolean(flags.dark)
const full = Boolean(flags.full)
const wait = Number(flags.wait ?? 3500)
mkdirSync(outDir, { recursive: true })

const dist = join(root, typeof flags.dist === 'string' ? flags.dist : 'dist-web')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json', '.mp4': 'video/mp4' }
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  let file = join(dist, url)
  if (!existsSync(file) || url.endsWith('/')) file = join(dist, 'index.html')
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
// --origin=http://localhost:3310 shoots an already-running server (the web
// app's dev server, say) instead of serving dist-web.
if (!flags.origin) await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = typeof flags.origin === 'string' ? flags.origin : `http://127.0.0.1:${server.address().port}`

const debugPort = 9555 + Math.floor(Math.random() * 300)
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${debugPort}`, '--no-first-run', '--disable-gpu',
  `--user-data-dir=${join(tmpdir(), `shot-${debugPort}`)}`, 'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200)
  try {
    const list = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()
    target = list.find((t) => t.type === 'page')
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.on('open', r))
let id = 0
const pending = new Map()
const problems = []
ws.on('message', (raw) => {
  const msg = JSON.parse(raw)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
  if (msg.method === 'Runtime.exceptionThrown') problems.push(`exception: ${msg.params.exceptionDetails.exception?.description?.split('\n').slice(0, flags.stack ? 8 : 1).join(' // ') ?? msg.params.exceptionDetails.text}`)
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    problems.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300)}`)
  }
})
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })

await send('Runtime.enable')
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true })
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] })

// Seed a saved location so Home renders instead of redirecting.
await send('Page.navigate', { url: `${origin}/__seed` })
await sleep(800)
const location = flags.nolocation ? null : { pincode: '560001', city: 'Bengaluru', area: 'MG Road', serviceable: true, checkedAt: Date.now() }
await send('Runtime.evaluate', { expression: `localStorage.clear(); ${location ? `localStorage.setItem('customerapp.location.v1', ${JSON.stringify(JSON.stringify(location))})` : ''}; ${flags.seed ? flags.seed : ''}` })

for (const path of paths) {
  problems.length = 0
  await send('Page.navigate', { url: origin + path })
  await sleep(wait)
  if (flags.eval) await send('Runtime.evaluate', { expression: flags.eval })
  if (flags.eval) await sleep(1500)
  let clip
  if (full) {
    const { result } = await send('Runtime.evaluate', { expression: `Math.max(...[...document.querySelectorAll('*')].map(e => e.scrollHeight))`, returnByValue: true })
    await send('Emulation.setDeviceMetricsOverride', { width, height: Math.min(result.result.value, 6000), deviceScaleFactor: 2, mobile: true })
    await sleep(800)
  }
  const shot = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) })
  const name = (path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root') + (dark ? '.dark' : '') + '.png'
  writeFileSync(join(outDir, name), Buffer.from(shot.result.data, 'base64'))
  const text = await send('Runtime.evaluate', { expression: 'location.pathname + " | " + document.body.innerText.slice(0, 400).replace(/\\s+/g, " ")', returnByValue: true })
  console.log(`\n== ${path} -> ${name}\n   ${text.result.result.value}`)
  for (const p of [...new Set(problems)].slice(0, 8)) console.log(`   ! ${p}`)
  if (full) await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true })
}

ws.close()
chrome.kill()
if (!flags.origin) server.close()
process.exit(0)
