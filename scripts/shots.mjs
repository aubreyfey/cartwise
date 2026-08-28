// Captures the eight app screens the App Store panels and the in-app tour are
// built from. Run `npm run dev` first — these are real screenshots of the
// running app, which is the whole point of them.
//
//   node scripts/shots.mjs            # all of them
//   node scripts/shots.mjs list home  # just these
import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const ORIGIN = process.env.SHOT_ORIGIN || 'http://localhost:5173'
const OUT = resolve('marketing', 'shots')
const PROFILE = resolve('node_modules', '.cache', 'shotgen-profile')

// `click` walks the app by button label, `scroll` scrolls the app iframe
// afterwards. Both are handled inside shotgen.html.
const SHOTS = {
  home: {},
  budget: { click: 'Grocery Time' },
  list: { click: 'Grocery Time', scroll: 920 },
  shopping: { click: 'Grocery Time|Shopping' },
  compare: { click: 'Grocery Time', scroll: 648 },
  receipt: { click: 'Grocery Time|Finish trip' },
  insights: { click: 'Trips' },
  vault: { click: 'Vault' },
  expiry: { click: 'Expiry' },
}

function capture(name, { click, scroll, h = 932 }) {
  const q = new URLSearchParams({ h: String(h) })
  if (click) q.set('click', click)
  if (scroll) q.set('scroll', String(scroll))
  const file = join(OUT, `${name}.png`)
  execFileSync(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=12000',
    `--window-size=430,${h}`,
    `--screenshot=${file}`,
    `--user-data-dir=${PROFILE}`,
    `${ORIGIN}/shotgen.html?${q}`,
  ], { stdio: 'ignore' })
  console.log(`${name}.png`)
}

if (!EDGE) {
  console.error('Microsoft Edge not found; nothing to screenshot with.')
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })
const wanted = process.argv.slice(2)
const names = wanted.length ? wanted : Object.keys(SHOTS)
for (const name of names) {
  if (!SHOTS[name]) {
    console.error(`No such shot: ${name}. Known: ${Object.keys(SHOTS).join(', ')}`)
    process.exit(1)
  }
  capture(name, SHOTS[name])
}
