// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MAX_EDGE, approxBytes, fitWithin } from './listPhotos.js'
import {
  DEFAULT_BACKGROUND,
  PHOTO_BACKGROUND,
  backgroundOf,
  backgroundStyle,
  isPhotoBackground,
} from './backgrounds.js'

describe('fitWithin', () => {
  it('shrinks a phone photo to background size', () => {
    const { width, height } = fitWithin(4032, 3024)
    assert.equal(width, MAX_EDGE)
    assert.equal(height, 750)
  })

  it('keeps the aspect ratio', () => {
    const before = 4032 / 3024
    const { width, height } = fitWithin(4032, 3024)
    assert.ok(Math.abs(width / height - before) < 0.01)
  })

  it('caps the long edge whichever way the picture is turned', () => {
    for (const [w, h] of [[4032, 3024], [3024, 4032], [2000, 2000]]) {
      const fit = fitWithin(w, h)
      assert.ok(Math.max(fit.width, fit.height) <= MAX_EDGE, `${w}x${h}`)
    }
  })

  it('never enlarges — that costs bytes and buys nothing', () => {
    assert.deepEqual(fitWithin(320, 240), { width: 320, height: 240 })
  })

  it('never returns a zero dimension a canvas would reject', () => {
    for (const [w, h] of [[0, 0], [1, 100000], [NaN, 10], [-5, -5]]) {
      const fit = fitWithin(w, h)
      assert.ok(fit.width >= 1 && fit.height >= 1, `${w}x${h} -> ${JSON.stringify(fit)}`)
    }
  })
})

describe('approxBytes', () => {
  it('adds up the store', () => {
    assert.equal(approxBytes({ a: 'xxx', b: 'xx' }), 5)
  })

  it('copes with nothing stored', () => {
    assert.equal(approxBytes(undefined), 0)
    assert.equal(approxBytes({}), 0)
  })
})

describe('photo backgrounds', () => {
  it('recognises the photo marker', () => {
    assert.equal(isPhotoBackground(PHOTO_BACKGROUND), true)
    assert.equal(isPhotoBackground('mint'), false)
  })

  it('uses the photo when the list asks for one and it exists', () => {
    const cart = { background: PHOTO_BACKGROUND }
    assert.equal(backgroundOf(cart, 'data:image/webp;base64,AA'), PHOTO_BACKGROUND)
  })

  it('falls back when the picture has gone', () => {
    // Deleted, or never synced to this device. A grey hole where a card should
    // be is worse than the plain background.
    const cart = { background: PHOTO_BACKGROUND }
    assert.equal(backgroundOf(cart, undefined), DEFAULT_BACKGROUND)
    assert.equal(backgroundOf(cart, ''), DEFAULT_BACKGROUND)
  })

  it('still falls back for lists made before backgrounds existed', () => {
    assert.equal(backgroundOf({}), DEFAULT_BACKGROUND)
    assert.equal(backgroundOf(undefined), DEFAULT_BACKGROUND)
    assert.equal(backgroundOf({ background: 'chartreuse' }), DEFAULT_BACKGROUND)
  })

  it('quotes the data URL, which otherwise ends at its first comma', () => {
    const url = 'data:image/webp;base64,AAAA'
    const style = backgroundStyle(PHOTO_BACKGROUND, url)
    assert.ok(style['--card-bg'].includes(`url("${url}")`))
    assert.ok(style['--card-bg'].includes('cover'))
  })

  it('gives a photo the same value in both themes', () => {
    // A photograph has no dark variant; the scrim over it is what changes.
    const style = backgroundStyle(PHOTO_BACKGROUND, 'data:image/webp;base64,AA')
    assert.equal(style['--card-bg'], style['--card-bg-dark'])
  })

  it('does not produce a url() with nothing in it', () => {
    const style = backgroundStyle(PHOTO_BACKGROUND, undefined)
    assert.ok(!style['--card-bg'].includes('url('))
  })

  it('leaves the gradients working', () => {
    const style = backgroundStyle('mint')
    assert.ok(style['--card-bg'].startsWith('linear-gradient'))
    assert.notEqual(style['--card-bg'], style['--card-bg-dark'])
  })
})
