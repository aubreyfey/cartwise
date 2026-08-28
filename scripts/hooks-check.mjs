// Hooks must not sit below an early return.
//
// This exists because it shipped. useEdgeSwipe was declared beside the render
// branches it affected, which are below `if (showOnboarding) return`. A
// returning user never hits that return, so every hook ran and the app was
// fine. A first-time visitor does hit it, runs one hook fewer on the second
// render, and React throws "rendered fewer hooks than expected".
//
// So the app worked perfectly for the only person testing it and crashed for
// everyone opening the link for the first time. Nothing caught it: the unit
// tests never render, and every screenshot harness seeds storage that skips
// onboarding.
//
// The rule React enforces is "same hooks, same order, every render". This
// checks the structural proxy: within a component, no hook call may follow a
// return that can be reached before it.
//
// Accuracy matters more than reach here — a checker that cries wolf gets
// switched off. So it tracks what opened every brace: a `return` inside a
// callback (a useMemo body, a map, an event handler) is not an early return
// and must not be reported as one. Only returns in the component's own control
// flow count.
//
//   node scripts/hooks-check.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const FILES = [
  'src/App.jsx',
  ...readdirSync('src/components')
    .filter((n) => n.endsWith('.jsx'))
    .map((n) => join('src/components', n)),
]

const HOOK = /(?:^|[^.\w])(use[A-Z]\w*)\s*\(/
const COMPONENT = /^(?:export default )?function ([A-Z]\w*)\s*\(/

/** Does this line open a function rather than a plain block? */
const opensFunction = (line) =>
  /=>\s*\{/.test(line) ||
  /\bfunction\b[^)]*\)\s*\{/.test(line) ||
  /\b(then|catch|finally|map|filter|forEach|reduce|find|some|every|sort)\s*\(/.test(line)

const problems = []

for (const file of FILES) {
  const lines = readFileSync(file, 'utf8').split('\n')

  let inComponent = null
  // One frame per open brace inside the component: 'fn' or 'block'.
  let stack = []
  let firstReturn = null

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.replace(/\/\/.*$/, '')
    const trimmed = line.trim()

    if (!inComponent) {
      const match = raw.match(COMPONENT)
      if (match) {
        inComponent = match[1]
        stack = []
        firstReturn = null
      }
      continue
    }

    // A return that is reachable in the component's own control flow: every
    // enclosing frame is a plain block, not a callback.
    const atComponentLevel = stack.every((frame) => frame === 'block')
    if (
      atComponentLevel &&
      firstReturn === null &&
      /^(return\b|if\s*\(.*\)\s*return\b)/.test(trimmed) &&
      !/=>/.test(trimmed)
    ) {
      firstReturn = i + 1
    }

    if (firstReturn !== null && atComponentLevel) {
      const match = trimmed.match(HOOK)
      if (match && !trimmed.startsWith('*')) {
        problems.push({
          file,
          component: inComponent,
          line: i + 1,
          hook: match[1],
          afterReturn: firstReturn,
          text: trimmed.slice(0, 80),
        })
      }
    }

    // Update the brace stack for this line.
    for (const ch of line) {
      if (ch === '{') stack.push(opensFunction(line) ? 'fn' : 'block')
      else if (ch === '}') {
        stack.pop()
        if (stack.length === 0 && /^\}/.test(raw)) {
          inComponent = null
          firstReturn = null
        }
      }
    }
  }
}

if (problems.length === 0) {
  console.log(`hooks: clean across ${FILES.length} components`)
  process.exit(0)
}

console.error(`${problems.length} hook(s) below an early return:\n`)
for (const p of problems) {
  console.error(
    `  ${p.file}:${p.line}  in <${p.component}>, ${p.hook}() runs after the return on line ${p.afterReturn}`,
  )
  console.error(`    ${p.text}\n`)
}
console.error('Move them above every return in the component body.')
process.exit(1)
