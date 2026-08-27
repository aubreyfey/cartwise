// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ACCENTS,
  DEFAULT_ACCENT,
  DEFAULT_PAPER,
  DEFAULT_SATURATION,
  DEFAULT_TEXTURE,
  DEFAULT_TEXTURE_STRENGTH,
  PAPERS,
  TEXTURES,
  accentOf,
  defaultLook,
  desaturate,
  levelOf,
  paperOf,
  textureInk,
  textureOf,
} from './theme.js'

describe('look choices', () => {
  it('keeps anything it recognises', () => {
    for (const a of ACCENTS) assert.equal(accentOf(a.id), a.id)
    for (const p of PAPERS) assert.equal(paperOf(p.id), p.id)
    for (const t of TEXTURES) assert.equal(textureOf(t.id), t.id)
  })

  it('falls back rather than painting the app with undefined', () => {
    for (const junk of ['chartreuse', '', null, undefined, 7, {}]) {
      assert.equal(accentOf(junk), DEFAULT_ACCENT)
      assert.equal(paperOf(junk), DEFAULT_PAPER)
      assert.equal(textureOf(junk), DEFAULT_TEXTURE)
    }
  })

  it('ships every paper with both schemes', () => {
    // --bg is set inline, which beats the stylesheet's dark block, so a paper
    // missing its dark value would light up the whole app at night.
    for (const paper of PAPERS) {
      assert.match(paper.light, /^#[0-9a-f]{6}$/i, `${paper.id} light`)
      assert.match(paper.dark, /^#[0-9a-f]{6}$/i, `${paper.id} dark`)
      assert.ok(paper.label, `${paper.id} is nameable`)
    }
  })

  it('defaults to the look the app shipped with', () => {
    assert.deepEqual(defaultLook(), {
      accent: DEFAULT_ACCENT,
      texture: DEFAULT_TEXTURE,
      paper: DEFAULT_PAPER,
      textureStrength: DEFAULT_TEXTURE_STRENGTH,
      saturation: DEFAULT_SATURATION,
    })
  })
})

describe('levelOf', () => {
  it('holds a slider inside its track', () => {
    assert.equal(levelOf(-40, 50), 0)
    assert.equal(levelOf(0, 50), 0)
    assert.equal(levelOf(63, 50), 63)
    assert.equal(levelOf(100, 50), 100)
    assert.equal(levelOf(9000, 50), 100)
  })

  it('rounds, so a slider never stores a fraction', () => {
    assert.equal(levelOf(42.4, 50), 42)
    assert.equal(levelOf(42.6, 50), 43)
  })

  it('uses the fallback for anything that is not a number', () => {
    for (const junk of [null, undefined, '', 'lots', NaN, {}]) {
      assert.equal(levelOf(junk, 40), 40)
    }
  })

  it('reads a numeric string, which is what a range input gives back', () => {
    assert.equal(levelOf('72', 40), 72)
  })
})

describe('textureInk', () => {
  it('turns the slider off completely at zero', () => {
    // Not "nearly none" — Plain has to actually be plain.
    assert.equal(textureInk(0), '0.00%')
  })

  it('lands the default on the 7% that reads as a ground', () => {
    assert.equal(textureInk(DEFAULT_TEXTURE_STRENGTH), '7.20%')
  })

  it('rises with the slider and stops somewhere legible', () => {
    const at = (n) => Number.parseFloat(textureInk(n))
    assert.ok(at(0) < at(40), 'more ink as it moves right')
    assert.ok(at(40) < at(100))
    assert.ok(at(100) <= 18, 'never so dark the pattern becomes content')
  })
})

describe('desaturate', () => {
  it('leaves a colour alone at full saturation', () => {
    assert.equal(desaturate('#7b5ea7', 100), '#7b5ea7')
  })

  it('drains all the colour out at zero', () => {
    const grey = desaturate('#7b5ea7', 0)
    const [r, g, b] = grey.slice(1).match(/../g).map((h) => parseInt(h, 16))
    assert.equal(r, g)
    assert.equal(g, b)
  })

  it('keeps the brightness it started with', () => {
    // Mixing every accent towards one fixed mid-grey would drag pale colours
    // darker and dark ones lighter, so the app would change brightness while
    // claiming to change only saturation.
    const lum = (hex) => {
      const [r, g, b] = hex.slice(1).match(/../g).map((h) => parseInt(h, 16))
      return 0.299 * r + 0.587 * g + 0.114 * b
    }
    for (const accent of ACCENTS) {
      for (const level of [0, 25, 60, 100]) {
        assert.ok(
          Math.abs(lum(desaturate(accent.color, level)) - lum(accent.color)) < 1.5,
          `${accent.id} at ${level} keeps its brightness`,
        )
      }
    }
  })

  it('moves steadily between the two ends', () => {
    const chroma = (hex) => {
      const [r, g, b] = hex.slice(1).match(/../g).map((h) => parseInt(h, 16))
      return Math.max(r, g, b) - Math.min(r, g, b)
    }
    const steps = [0, 20, 40, 60, 80, 100].map((n) => chroma(desaturate('#2f6fa8', n)))
    for (let i = 1; i < steps.length; i += 1) {
      assert.ok(steps[i] > steps[i - 1], 'more colour at every step right')
    }
  })

  it('always returns something CSS can parse', () => {
    for (const accent of ACCENTS) {
      for (const level of [0, 1, 50, 99, 100, -20, 500, null]) {
        assert.match(desaturate(accent.color, level), /^#[0-9a-f]{6}$/i)
      }
    }
  })

  it('copes with the short hex form', () => {
    assert.match(desaturate('#abc', 50), /^#[0-9a-f]{6}$/i)
  })
})
