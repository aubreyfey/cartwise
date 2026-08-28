// Build the bundled product catalogue.
//
// CartWise ships no product database of its own, and inventing one is not an
// option. This pulls a real one: Open Food Facts, filtered to a country, cut
// down to the four fields a grocery list actually needs, and written out as a
// compact asset the app lazy-loads the first time someone searches.
//
// LICENCE. Open Food Facts data is ODbL 1.0. Two obligations follow and both
// are met in the app rather than here: Open Food Facts is credited visibly in
// Settings, and the extract this produces is itself ODbL. That means the
// product catalogue is open data — your prices, lists and history remain
// yours, but the list of what exists on a shelf is not a moat.
//
// Run with: npm run catalogue -- ph
//           npm run catalogue -- ph,us,gb

import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const OUT = join('public', 'catalogue')
const PAGE = 100
// Open Food Facts asks for a slow hand and enforces it: at one request a
// second it starts returning 503 a few pages in. Three seconds gets through.
const PAUSE_MS = 3000
const RETRIES = 5

// A real, contactable agent, which is what their API terms ask for.
const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'CartWise/0.1 (grocery list; github.com/aubreyfey/cartwise)',
}

// The country subdomain scopes the search on its own, which is both simpler
// and the route that is actually up: world/api/v2 is currently 503ing while
// ph.openfoodfacts.org answers fine.
const COUNTRIES = {
  ph: 'ph', us: 'us', gb: 'uk', au: 'au', sg: 'sg',
  my: 'my', id: 'id', th: 'th', jp: 'jp', in: 'in',
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    if (text.trim().startsWith('<')) throw new Error('HTML, not JSON')
    return JSON.parse(text)
  } catch (error) {
    if (attempt >= RETRIES) throw error
    // Exponential rather than linear: a 503 here means "you are going too
    // fast", and the answer to that is to actually slow down.
    await wait(PAUSE_MS * 2 ** attempt)
    return getJson(url, attempt + 1)
  }
}

/**
 * Crowdsourced data is messy: "bear brand (w) 33g" alongside proper names.
 * Tidy what is safely tidyable and drop what is not worth shipping.
 */
function clean(product) {
  let name = String(product.product_name ?? '').trim().replace(/\s+/g, ' ')
  if (name.length < 3 || name.length > 90) return null
  // Anything with no letters at all is a code or a size, not a name.
  if (!/\p{L}/u.test(name)) return null

  // all-lowercase entries are common and look careless in a list; Title Case
  // them. Names with any existing capital are left exactly as typed, because
  // brands capitalise deliberately and we would only get it wrong.
  if (name === name.toLowerCase()) {
    name = name.replace(/\b\p{L}[\p{L}']*/gu, (w) => w[0].toUpperCase() + w.slice(1))
  }

  const brand = String(product.brands ?? '').split(',')[0].trim().slice(0, 40) || ''

  // "3" is not a quantity. Keep only sizes that carry a unit.
  const raw = String(product.quantity ?? '').trim()
  const size = /\d/.test(raw) && /[a-zA-Z]/.test(raw) ? raw.slice(0, 24) : ''

  const code = String(product.code ?? '').replace(/\D/g, '')
  if (code.length < 8) return null

  return [code, name, brand, size]
}

async function fetchCountry(slug, code) {
  const rows = new Map()
  let page = 1
  let total = null

  // Anything already on disk from a previous run.
  const partial = join(OUT, `${code}.json`)
  try {
    for (const row of JSON.parse(readFileSync(partial, 'utf8'))) rows.set(row[0], row)
    if (rows.size > 0) {
      page = Math.floor(rows.size / PAGE) + 1
      console.log(`  resuming from ${rows.size} products, page ${page}`)
    }
  } catch {
    // Nothing to resume from; start at the beginning.
  }

  while (true) {
    const url =
      `https://${slug}.openfoodfacts.org/cgi/search.pl?action=process&json=1` +
      `&fields=code,product_name,brands,quantity&page_size=${PAGE}&page=${page}`

    const body = await getJson(url)
    if (total === null) {
      total = body.count ?? 0
      console.log(`  ${slug}: ${total} products, ${Math.ceil(total / PAGE)} pages`)
    }

    const products = body.products ?? []
    if (products.length === 0) break

    for (const product of products) {
      const row = clean(product)
      // Keyed by barcode, so the same product listed twice collapses.
      if (row) rows.set(row[0], row)
    }

    console.log(`  page ${page} — ${rows.size} kept`)
    // Written every page, so a failure costs one page rather than all of them.
    writeFileSync(partial, JSON.stringify([...rows.values()]))
    page += 1
    if ((page - 1) * PAGE >= total) break
    await wait(PAUSE_MS)
  }

  return [...rows.values()]
}

async function main() {
  const wanted = (process.argv[2] ?? 'ph')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)

  await mkdir(OUT, { recursive: true })
  const index = []

  for (const code of wanted) {
    const slug = COUNTRIES[code]
    if (!slug) {
      console.error(`Unknown country "${code}". Known: ${Object.keys(COUNTRIES).join(', ')}`)
      process.exitCode = 1
      return
    }

    console.log(`\nFetching ${slug}…`)
    const rows = await fetchCountry(slug, code)

    const json = JSON.stringify(rows)
    const file = join(OUT, `${code}.json`)
    await writeFile(file, json)

    const gz = gzipSync(Buffer.from(json)).length
    console.log(
      `  ${file} — ${rows.length} products, ` +
        `${Math.round(json.length / 1024)} KB raw, ~${Math.round(gz / 1024)} KB gzipped`,
    )
    index.push({ code, slug, count: rows.length })
  }

  await writeFile(join(OUT, 'index.json'), JSON.stringify({ countries: index }, null, 2) + '\n')
  console.log('\nWrote catalogue/index.json')
  console.log('Data © Open Food Facts contributors, ODbL 1.0')
}

main().catch((error) => {
  console.error('\n' + error.message)
  process.exitCode = 1
})
