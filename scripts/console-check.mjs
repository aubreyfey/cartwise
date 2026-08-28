// Walk the app's screens over the devtools protocol and report every console
// error, uncaught exception and failed request. Screenshots show what a screen
// looks like; they say nothing about what it logged.
import { execFile } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9333
const PROFILE = 'C:\\Users\\aubre\\Desktop\\pocketsave\\node_modules\\.cache\\cdp'

const child = execFile(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--window-size=430,932',
  'about:blank',
])

// Wait for the debugger to actually accept connections rather than guessing.
let list = null
for (let i = 0; i < 40 && !list; i++) {
  await wait(500)
  try {
    list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
  } catch {
    /* not up yet */
  }
}
if (!list) {
  child.kill()
  throw new Error('devtools never came up')
}

const page = list.find((t) => t.type === 'page')
const sock = new WebSocket(page.webSocketDebuggerUrl)

const problems = []
let id = 0
const send = (method, params = {}) => sock.send(JSON.stringify({ id: ++id, method, params }))

sock.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    const text = msg.params.args
      .map((a) => a.value ?? a.description ?? a.preview?.description ?? '')
      .join(' ')
      .slice(0, 300)
    problems.push(`console.${msg.params.type}: ${text}`)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails
    problems.push(`EXCEPTION: ${(d.exception?.description ?? d.text ?? '').slice(0, 300)}`)
  }
  if (msg.method === 'Network.loadingFailed' && !/ABORTED/.test(msg.params.errorText)) {
    problems.push(`request failed: ${msg.params.errorText}`)
  }
})

await new Promise((r) => sock.addEventListener('open', r))
send('Runtime.enable')
send('Network.enable')
send('Page.enable')

// CHECK_ORIGIN lets this run against a built dist/ as well as the dev
// server — the service worker only registers in a production build, so the
// dev run cannot see anything it logs.
const origin = process.env.CHECK_ORIGIN || 'http://localhost:5173'
send('Page.navigate', { url: origin + '/shotgen.html?h=932' })
await wait(5000)

const LABELS = {
  Vault: 'Vault',
  Expiry: 'Expiry',
  Trips: 'Trips',
  Recipes: 'Recipes',
  Settings: 'Settings',
  'Privacy & credits': 'Privacy',
  Home: 'Home',
}

for (const [name, label] of Object.entries(LABELS)) {
  send('Runtime.evaluate', {
    expression: `(() => {
      const d = document.getElementById('f').contentDocument
      const b = [...d.querySelectorAll('button')].find((x) =>
        ((x.textContent || '') + (x.getAttribute('aria-label') || '')).includes(${JSON.stringify(label)}))
      if (b) b.click()
      return !!b
    })()`,
  })
  await wait(1400)
  process.stdout.write(`${name} `)
}

// And the two sheets, which are where most of the recent work landed.
send('Runtime.evaluate', {
  expression: `(() => {
    const d = document.getElementById('f').contentDocument
    const b = [...d.querySelectorAll('button')].find((x) => (x.textContent||'').includes('Grocery Time'))
    if (b) b.click()
    return !!b
  })()`,
})
await wait(1500)
send('Runtime.evaluate', {
  expression: `(() => {
    const d = document.getElementById('f').contentDocument
    const b = [...d.querySelectorAll('button')].find((x) =>
      ((x.textContent||'')+(x.getAttribute('aria-label')||'')).includes('Add an item'))
    if (b) b.click()
    return !!b
  })()`,
})
await wait(2000)
console.log('\n')

sock.close()
child.kill()

const unique = [...new Set(problems)]
if (unique.length === 0) console.log('clean: no console errors, no exceptions, no failed requests')
else {
  console.log(`${unique.length} distinct problems:`)
  for (const p of unique) console.log('  ' + p)
}
