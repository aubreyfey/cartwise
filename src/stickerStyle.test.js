// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'

import {
  DEFAULT_STICKER_STYLE,
  STICKER_STYLES,
  getStickerStyle,
  normaliseStickerStyle,
  resetStickerStyle,
  setStickerStyle,
  subscribeToStickerStyle,
} from './stickerStyle.js'
import { STICKER_EMOJI, STICKER_IDS, emojiFor, stickerFor } from './stickerCatalog.js'

describe('sticker style', () => {
  beforeEach(() => resetStickerStyle())

  it('starts on the device emoji, which is what the app asks the phone for', () => {
    assert.equal(getStickerStyle(), 'emoji')
    assert.equal(DEFAULT_STICKER_STYLE, 'emoji')
  })

  it('takes either known style', () => {
    for (const style of STICKER_STYLES) {
      assert.equal(setStickerStyle(style), style)
      assert.equal(getStickerStyle(), style)
    }
  })

  it('falls back rather than storing nonsense', () => {
    // A hand-edited key, or a value from a version that had a third set.
    for (const junk of ['sparkles', '', null, undefined, 42, {}]) {
      assert.equal(normaliseStickerStyle(junk), DEFAULT_STICKER_STYLE)
    }
    setStickerStyle('drawn')
    assert.equal(setStickerStyle('sparkles'), DEFAULT_STICKER_STYLE)
  })

  it('wakes subscribers when the style moves', () => {
    let calls = 0
    subscribeToStickerStyle(() => { calls += 1 })

    setStickerStyle('drawn')
    assert.equal(calls, 1)
  })

  it('stays quiet when it is set to what it already is', () => {
    // Every Sticker on the page subscribes to this, so a needless notify is a
    // needless re-render of the whole list.
    setStickerStyle('drawn')
    let calls = 0
    subscribeToStickerStyle(() => { calls += 1 })

    setStickerStyle('drawn')
    setStickerStyle('drawn')
    assert.equal(calls, 0)
  })

  it('stops notifying once unsubscribed', () => {
    let calls = 0
    const off = subscribeToStickerStyle(() => { calls += 1 })

    setStickerStyle('drawn')
    off()
    setStickerStyle('emoji')

    assert.equal(calls, 1)
  })
})

describe('sticker emoji', () => {
  it('has a character for every drawn sticker', () => {
    // The two sets have to agree, or switching to emoji silently turns some
    // rows into a basket.
    for (const id of STICKER_IDS) {
      assert.ok(STICKER_EMOJI[id], `${id} has an emoji`)
    }
    assert.deepEqual(
      Object.keys(STICKER_EMOJI).sort(),
      [...STICKER_IDS].sort(),
      'no emoji for a sticker that does not exist, and none missing',
    )
  })

  it('falls back to the basket the way the artwork does', () => {
    assert.equal(emojiFor('nothing-like-this'), STICKER_EMOJI.basket)
  })

  it('gives every item on a list something to show', () => {
    const names = ['Bananas', 'Whole Wheat Bread', 'Corned Beef', 'Fresh Milk', 'Zzz']
    for (const name of names) {
      assert.ok(emojiFor(stickerFor(name, 'other')).length > 0)
    }
  })

  it('uses one character per sticker, so they line up in a row', () => {
    for (const [id, glyph] of Object.entries(STICKER_EMOJI)) {
      const points = [...glyph]
      assert.ok(points.length <= 2, `${id} is a single emoji, not a sequence`)
      // Above the Basic Multilingual Plane, or a dingbat like ☕ that is not.
      assert.ok(
        points[0].codePointAt(0) > 0x2000,
        `${id} is a pictograph rather than a letter`,
      )
    }
  })
})
