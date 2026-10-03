// Builds the web preview into a folder Vercel can serve as-is.
//
//   node scripts/web-deploy.mjs <outDir>
//   cd <outDir> && npx vercel@latest deploy --prod
//
// Two things a plain `expo export` leaves wrong for Vercel:
// - Expo puts fonts and icons from packages under assets/node_modules/, and
//   the Vercel CLI never uploads a folder named node_modules — so every font
//   404s to the SPA fallback. They move to assets/vendor/ and the bundle's
//   paths are rewritten to match.
// - Every route is client-side, so unknown paths fall back to index.html.

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const out = resolve(process.argv[2] ?? 'dist-vercel')
execSync(`npx expo export --platform web --output-dir "${out}"`, { stdio: 'inherit' })

const from = join(out, 'assets', 'node_modules')
if (existsSync(from)) renameSync(from, join(out, 'assets', 'vendor'))

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
let rewritten = 0
for (const file of walk(out).filter((f) => /\.(js|html|css|json)$/.test(f))) {
  const text = readFileSync(file, 'utf8')
  if (!text.includes('/assets/node_modules/')) continue
  writeFileSync(file, text.replaceAll('/assets/node_modules/', '/assets/vendor/'))
  rewritten++
}

writeFileSync(
  join(out, 'vercel.json'),
  JSON.stringify({ rewrites: [{ source: '/(.*)', destination: '/index.html' }], git: { deploymentEnabled: false } }, null, 2) + '\n'
)
console.log(`web-deploy: ${out} ready (${rewritten} file(s) repointed to assets/vendor)`)
