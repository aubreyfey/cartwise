// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { existsSync } from 'node:fs'

import { SLIDE_MS, TOUR_PANELS, clampPanel, tourImage, windowAround } from './tour.js'
import { STICKER_IDS, stickerFor } from './stickerCatalog.js'

describe('tour content', () => {
  it('has a complete panel for every slide', () => {
    assert.ok(TOUR_PANELS.length >= 6, 'enough to be worth paging through')
    for (const panel of TOUR_PANELS) {
      assert.ok(panel.id, 'has an id')
      assert.ok(panel.image, `${panel.id} names an image`)
      assert.ok(panel.title?.length > 0, `${panel.id} has a title`)
      assert.ok(panel.body?.length > 0, `${panel.id} has body copy`)
    }
  })

  it('points at images that are actually on disk', () => {
    // The text is baked into these pictures, so a missing file is not a
    // cosmetic gap — the whole slide is gone.
    for (const panel of TOUR_PANELS) {
      const path = `public/tour/${panel.image}.webp`
      assert.ok(existsSync(path), `${panel.id} expects ${path}; run npm run tour:images`)
    }
  })

  it('has unique ids and images so nothing renders twice', () => {
    const ids = TOUR_PANELS.map((p) => p.id)
    const images = TOUR_PANELS.map((p) => p.image)
    assert.equal(new Set(ids).size, ids.length, 'ids are unique')
    assert.equal(new Set(images).size, images.length, 'images are unique')
  })

  it('keeps the alternative text short enough to hear', () => {
    for (const panel of TOUR_PANELS) {
      assert.ok(panel.title.length <= 40, `${panel.id} title is ${panel.title.length} chars`)
      assert.ok(panel.body.length <= 130, `${panel.id} body is ${panel.body.length} chars`)
    }
  })

  it('holds each slide long enough to read', () => {
    assert.ok(SLIDE_MS >= 3000, 'not a flicker')
    assert.ok(SLIDE_MS <= 8000, 'not a wait')
  })
})

describe('tourImage', () => {
  it('respects the base path so it works on a subpath host', () => {
    const panel = TOUR_PANELS[0]
    assert.equal(tourImage(panel, '/'), `/tour/${panel.image}.webp`)
    assert.equal(tourImage(panel, '/cartwise/'), `/cartwise/tour/${panel.image}.webp`)
  })

  it('never produces a doubled slash', () => {
    for (const base of ['/', '//', '/cartwise/']) {
      assert.ok(!tourImage(TOUR_PANELS[0], base).includes('//'))
    }
  })
})

describe('windowAround', () => {
  it('keeps the current slide and its neighbours', () => {
    assert.deepEqual([...windowAround(3, 8)].sort((a, b) => a - b), [2, 3, 4])
  })

  it('does not run off either end', () => {
    assert.deepEqual([...windowAround(0, 8)].sort((a, b) => a - b), [0, 1])
    assert.deepEqual([...windowAround(7, 8)].sort((a, b) => a - b), [6, 7])
  })

  it('copes with a single slide', () => {
    assert.deepEqual([...windowAround(0, 1)], [0])
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
