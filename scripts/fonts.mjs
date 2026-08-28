// Fetch the Google Fonts CSS as a modern browser would, then pull down every
// woff2 it references so the app can serve its own type.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CSS =
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap'

// Without a modern UA, Google serves the legacy truetype build.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const res = await fetch(CSS, { headers: { 'user-agent': UA } })
if (!res.ok) throw new Error(`css ${res.status}`)
let css = await res.text()

const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]))]
console.log(`${urls.length} font files referenced`)

mkdirSync('public/fonts', { recursive: true })

let n = 0
for (const url of urls) {
  const r = await fetch(url, { headers: { 'user-agent': UA } })
  if (!r.ok) {
    console.error(`  failed ${url} ${r.status}`)
    continue
  }
  const buf = Buffer.from(await r.arrayBuffer())
  // Name from the path so the files are stable across re-runs.
  const name = url.split('/').slice(-2).join('-').replace(/[^\w.-]/g, '_')
  writeFileSync(join('public/fonts', name), buf)
  // Relative, so the stylesheet works under a subpath too.
  css = css.split(url).join(`./${name}`)
  n += 1
}

writeFileSync('public/fonts/fonts.css', css)
console.log(`saved ${n} files + fonts.css`)
