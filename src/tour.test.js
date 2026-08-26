// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { TOUR_PANELS, clampPanel } from './tour.js'
import { STICKER_IDS, stickerFor } from './stickerCatalog.js'

describe('tour content', () => {
  it('has a complete panel for every step', () => {
    assert.ok(TOUR_PANELS.length >= 6, 'enough to be worth paging through')
    for (const panel of TOUR_PANELS) {
      assert.ok(panel.id, 'has an id')
      assert.ok(panel.title?.length > 0, `${panel.id} has a title`)
      assert.ok(panel.body?.length > 0, `${panel.id} has body copy`)
      assert.ok(Array.isArray(panel.stickers) && panel.stickers.length > 0, `${panel.id} has stickers`)
    }
  })

  it('uses only stickers that actually exist', () => {
    // A typo here renders the fallback basket on every panel and looks like a
    // bug rather than a mistake in a data file.
    for (const panel of TOUR_PANELS) {
      for (const id of panel.stickers) {
        assert.ok(STICKER_IDS.includes(id), `${panel.id} references unknown sticker "${id}"`)
      }
    }
  })

  it('uses only tones that have a stylesheet rule', () => {
    const known = new Set(['violet', 'green', 'mint', 'rose', 'blue', 'amber', 'slate'])
    for (const panel of TOUR_PANELS) {
      assert.ok(known.has(panel.tone), `${panel.id} has unstyled tone "${panel.tone}"`)
    }
  })

  it('has unique ids so React keys do not collide', () => {
    const ids = TOUR_PANELS.map((p) => p.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('keeps copy short enough to read on a phone', () => {
    for (const panel of TOUR_PANELS) {
      assert.ok(panel.title.length <= 34, `${panel.id} title is ${panel.title.length} chars`)
      assert.ok(panel.body.length <= 180, `${panel.id} body is ${panel.body.length} chars`)
    }
  })
})

describe('sticker matching', () => {
  it('picks by name before falling back to the aisle', () => {
    // "Olive oil" is pantry, but the bottle reads better than a tin.
    assert.equal(stickerFor('Olive Oil', 'pantry'), 'oil')
    assert.equal(stickerFor('Sourdough Loaf', 'bakery'), 'baguette')
    assert.equal(stickerFor('Chicken Thighs', 'meat'), 'drumstick')
  })

  it('falls back to the aisle when the name says nothing', () => {
    assert.equal(stickerFor('Own-brand mystery box', 'dairy'), 'milk')
    assert.equal(stickerFor('', 'household'), 'paper')
  })

  it('always returns a sticker that exists', () => {
    for (const name of ['', 'zzz', 'Something Unusual', null]) {
      const id = stickerFor(name ?? '', 'nonsense-aisle')
      assert.ok(STICKER_IDS.includes(id), `got "${id}"`)
    }
  })
})

describe('clampPanel', () => {
  it('stays inside the tour', () => {
    assert.equal(clampPanel(-5), 0)
    assert.equal(clampPanel(0), 0)
    assert.equal(clampPanel(999), TOUR_PANELS.length - 1)
  })

  it('survives nonsense rather than rendering undefined', () => {
    assert.equal(clampPanel(NaN), 0)
    assert.equal(clampPanel(undefined), 0)
    assert.equal(clampPanel(2.7), 2)
  })

  it('copes with an empty tour', () => {
    assert.equal(clampPanel(3, 0), 0)
  })
})
