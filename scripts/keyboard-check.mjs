// Do the sheets actually stay above the keyboard?
//
// Headless Chrome has no soft keyboard, so focusing an input would prove
// nothing. Instead: set --vvh/--vvb directly, exactly as viewport.js does from
// the visualViewport API, and measure where each sheet's bottom edge lands
// against the top of the "keyboard".
import { execFile } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9388
const HEIGHT = 932
const KEYBOARD = 320 // a plausible iPhone keyboard, in CSS pixels

const child = execFile(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-allow-origins=*',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:\\Users\\aubre\\Desktop\\pocketsave\\node_modules\\.cache\\cdp6',
  `--window-size=430,${HEIGHT}`, 'about:blank',
])

let list = null
for (let i = 0; i < 40 && !list; i++) {
  await wait(500)
  try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json() } catch {}
}
if (!list) { child.kill(); throw new Error('devtools never came up') }

const sock = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl)
let id = 0
const pending = new Map()
sock.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
})
const call = (m, p = {}) =>
  new Promise((r) => { const n = ++id; pending.set(n, r); sock.send(JSON.stringify({ id: n, method: m, params: p })) })

await new Promise((r) => sock.addEventListener('open', r))
await call('Page.enable'); await call('Runtime.enable')

const ev = async (expr) => {
  const res = await call('Runtime.evaluate', { expression: expr, returnByValue: true })
  return res?.result?.value
}

const D = "document.getElementById('f').contentDocument"
const W = "document.getElementById('f').contentWindow"

const measure = (selector) => `(() => {
  const d = ${D}, w = ${W}
  const el = d.querySelector(${JSON.stringify(selector)})
  if (!el) return { found: false }
  const r = el.getBoundingClientRect()
  const vvb = parseFloat(getComputedStyle(d.documentElement).getPropertyValue('--vvb')) || 0
  const keyboardTop = w.innerHeight - vvb
  return {
    found: true,
    sheetTop: Math.round(r.top),
    sheetBottom: Math.round(r.bottom),
    keyboardTop: Math.round(keyboardTop),
    windowHeight: w.innerHeight,
    clearsKeyboard: r.bottom <= keyboardTop + 1,
    overlapPx: Math.max(0, Math.round(r.bottom - keyboardTop)),
  }
})()`

const openKeyboard = `(() => {
  const d = ${D}
  d.documentElement.style.setProperty('--vvh', ${HEIGHT - KEYBOARD} + 'px')
  d.documentElement.style.setProperty('--vvb', '${KEYBOARD}px')
  return true
})()`

/**
 * Click a button by visible text or aria-label.
 *
 * Scoped to the open sheet when there is one: "Fresh Milk" also matches
 * "Mark Fresh Milk as eaten" on the expiry screen behind the sheet, and that
 * button comes first in the DOM — so the search result was never being
 * clicked and the milk was quietly being eaten instead.
 */
const clickIn = (label) => `(() => {
  const d = ${D}
  const scope = d.querySelector('.psearch') || d.querySelector('.sheet') || d
  const find = (root) => [...root.querySelectorAll('button')].find((x) =>
    ((x.textContent || '') + ' ' + (x.getAttribute('aria-label') || '')).includes(${JSON.stringify(label)}))
  const b = find(scope) || find(d)
  if (b) b.click()
  return !!b
})()`

/** Set the search box's value the way React will notice. */
const typeIn = (text) => `(() => {
  const d = ${D}, w = ${W}
  const input = d.querySelector('.psearch__input') || d.querySelector('input[type=search]')
  if (!input) return false
  const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set
  setter.call(input, ${JSON.stringify(text)})
  input.dispatchEvent(new w.Event('input', { bubbles: true }))
  return true
})()`

async function check(name, steps, selector) {
  await call('Page.navigate', { url: 'http://localhost:5173/shotgen.html?h=932' })
  await wait(5000)

  for (const step of steps) {
    if (step.startsWith('type:')) {
      await ev(typeIn(step.slice(5)))
      await wait(900)
      continue
    }
    const hit = await ev(clickIn(step))
    if (!hit) {
      console.log(`\n${name}\n  could not find a button matching "${step}"`)
      return false
    }
    await wait(1100)
  }

  const before = await ev(measure(selector))
  if (!before?.found) {
    console.log(`\n${name}\n  ${selector} never appeared`)
    return false
  }

  await ev(openKeyboard)
  await wait(600)
  const after = await ev(measure(selector))

  console.log(`\n${name}`)
  console.log(`  keyboard closed : bottom ${before.sheetBottom}px  (window ${before.windowHeight}px)`)
  console.log(`  keyboard open   : bottom ${after.sheetBottom}px   (keyboard top ${after.keyboardTop}px)`)
  console.log(`  moved up by     : ${before.sheetBottom - after.sheetBottom}px`)
  console.log(`  ${after.clearsKeyboard ? '  → CLEARS the keyboard' : `  → HIDDEN BEHIND IT by ${after.overlapPx}px`}`)
  return after.clearsKeyboard
}

// The + on a list opens the search sheet directly.
const a = await check('Search for a product', ['Grocery Time', 'Add an item'], '.psearch')

// "Track item expiry" opens the SAME search sheet in expiry mode; picking a
// product from it is what opens the track sheet.
const b = await check(
  'Track item expiry',
  ['Expiry', 'Track item expiry', 'type:milk', 'Fresh Milk'],
  '.trackx',
)

console.log(`\n${a && b ? 'BOTH SHEETS CLEAR THE KEYBOARD' : 'AT LEAST ONE SHEET IS STILL COVERED'}`)

sock.close(); child.kill()
