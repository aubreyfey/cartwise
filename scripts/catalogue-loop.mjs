// Fetch the catalogue over as many attempts as it takes.
//
// Open Food Facts throttles hard: a couple of pages get through, then 503 for
// a while. build-catalogue.mjs is resumable, so the answer is not to push
// harder but to come back later, repeatedly, leaving a long gap. This is the
// polite version of persistence.
//
// Run with: npm run catalogue:loop -- ph

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const country = (process.argv[2] ?? 'ph').toLowerCase()
const GAP_MS = 30_000
const MAX_ATTEMPTS = 40

const saved = () => {
  try {
    return JSON.parse(readFileSync(`public/catalogue/${country}.json`, 'utf8')).length
  } catch {
    return 0
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

let stalled = 0

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const before = saved()
  const result = spawnSync(process.execPath, ['scripts/build-catalogue.mjs', country], {
    encoding: 'utf8',
  })
  const after = saved()

  console.log(
    `attempt ${String(attempt).padStart(2)} — ${after} products` +
      (after > before ? ` (+${after - before})` : ' (no progress)'),
  )

  if (result.status === 0) {
    console.log('\ncomplete')
    break
  }

  // Give up rather than keep leaning on a service that is clearly unwell.
  stalled = after > before ? 0 : stalled + 1
  if (stalled >= 6) {
    console.log('\nSix attempts with no progress — Open Food Facts is not answering.')
    console.log(`Partial catalogue kept at ${after} products. Re-run later to continue.`)
    break
  }

  await wait(GAP_MS)
}
