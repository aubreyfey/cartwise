// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  BACKGROUNDS,
  DEFAULT_BACKGROUND,
  backgroundOf,
  backgroundStyle,
} from './backgrounds.js'

describe('list backgrounds', () => {
  it('offers a decent spread, each complete', () => {
    assert.ok(BACKGROUNDS.length >= 8, 'enough to feel like a choice')
    for (const bg of BACKGROUNDS) {
      assert.ok(bg.id, 'has an id')
      assert.ok(bg.label, `${bg.id} has a label`)
      assert.ok(bg.light, `${bg.id} has a light value`)
      assert.ok(bg.dark, `${bg.id} has a dark value`)
    }
  })

  it('has unique ids and labels', () => {
    const ids = BACKGROUNDS.map((b) => b.id)
    const labels = BACKGROUNDS.map((b) => b.label)
    assert.equal(new Set(ids).size, ids.length)
    assert.equal(new Set(labels).size, labels.length)
  })

  it('uses only well-formed colour values', () => {
    // A stray character here silently renders as no background at all.
    for (const bg of BACKGROUNDS) {
      for (const value of [bg.light, bg.dark]) {
        assert.ok(
          /^(var\(--[\w-]+\)|linear-gradient\([^)]*\))$/.test(value),
          `${bg.id}: "${value}"`,
        )
        // Hex colours must be 3, 6 or 8 digits; 7 is a typo that CSS ignores.
        for (const hex of value.match(/#[0-9a-fA-F]+/g) ?? []) {
          assert.ok([4, 7, 9].includes(hex.length), `${bg.id}: bad hex ${hex}`)
        }
      }
    }
  })

  it('includes a plain option so a list can opt out', () => {
    assert.ok(BACKGROUNDS.some((b) => b.id === DEFAULT_BACKGROUND))
  })
})

describe('backgroundOf', () => {
  it('falls back for a list made before backgrounds existed', () => {
    assert.equal(backgroundOf({ name: 'Old' }), DEFAULT_BACKGROUND)
    assert.equal(backgroundOf({ name: 'Odd', background: 'neon-zebra' }), DEFAULT_BACKGROUND)
    assert.equal(backgroundOf(null), DEFAULT_BACKGROUND)
  })

  it('keeps a real choice', () => {
    assert.equal(backgroundOf({ background: 'mint' }), 'mint')
  })
})

describe('backgroundStyle', () => {
  it('gives both themes so the stylesheet can pick', () => {
    const style = backgroundStyle('mint')
    assert.ok(style['--card-bg'])
    assert.ok(style['--card-bg-dark'])
    assert.notEqual(style['--card-bg'], style['--card-bg-dark'], 'light and dark differ')
  })

  it('never returns undefined for an unknown id', () => {
    const style = backgroundStyle('nonsense')
    assert.ok(style['--card-bg'])
  })
})
