// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { STICKER_EMOJI, STICKER_IDS, emojiFor, stickerFor } from './stickerCatalog.js'

const iconFor = (name, category = 'produce') => stickerFor(name, category)

describe('sticker matching: substring collisions', () => {
  // Every one of these was a real wrong icon in the app. The matcher does
  // substring tests, so any keyword that lives inside a longer word will grab
  // it unless anchored.
  const collisions = [
    ['Watermelon', 'melon', 'contains "water", which is a drinks keyword'],
    ['Pineapple', 'pineapple', 'contains "apple"'],
    ['Apple Juice', 'apple', 'contains "ice" inside "juice"'],
    // The fruit wins over the aisle, and it should: the list is already
    // grouped under a FROZEN header, so an ice cube would repeat what the
    // section says while the apple says what the thing actually is.
    ['Frozen Apple Juice', 'apple', 'what it is beats where it lives'],
    ['Grapefruit', 'citrus', 'contains "grape"'],
    ['Green Apple', 'apple', 'the boundary must still allow a leading word'],
  ]

  for (const [name, expected, why] of collisions) {
    it(`${name} -> ${expected} (${why})`, () => {
      assert.equal(iconFor(name), expected)
    })
  }

  it('never returns a drink for a fruit', () => {
    for (const fruit of ['Watermelon', 'Honeydew Melon', 'Cantaloupe']) {
      assert.notEqual(iconFor(fruit), 'bottle', fruit)
    }
  })

  it('still matches the plain words the anchors guard', () => {
    assert.equal(iconFor('Drinking Water', 'drinks'), 'bottle')
    assert.equal(iconFor('Ice', 'frozen'), 'ice')
    assert.equal(iconFor('Frozen Peas', 'frozen'), 'ice')
    assert.equal(iconFor('Apples'), 'apple')
  })
})

describe('sticker matching: fruit', () => {
  const fruit = [
    ['Mango', 'mango'],
    ['Ripe Mangoes', 'mango'],
    ['Orange', 'citrus'],
    ['Lemon', 'citrus'],
    ['Calamansi', 'citrus'],
    ['Dalandan', 'citrus'],
    ['Pomelo', 'citrus'],
    ['Grapes', 'grapes'],
    ['Raisins', 'grapes'],
    ['Strawberries', 'berry'],
    ['Blueberry Jam', 'berry'],
    ['Avocado', 'avocado'],
    ['Banana', 'banana'],
  ]

  for (const [name, expected] of fruit) {
    it(`${name} -> ${expected}`, () => assert.equal(iconFor(name), expected))
  }

  it('falls back to the aisle for fruit we have no icon for', () => {
    // Better a generic produce leaf than a confidently wrong picture.
    assert.equal(iconFor('Papaya'), 'leaf')
    assert.equal(iconFor('Rambutan'), 'leaf')
  })
})

describe('catalogue integrity', () => {
  it('has an emoji for every id, including the new fruit', () => {
    for (const id of STICKER_IDS) {
      assert.ok(STICKER_EMOJI[id], `${id} has an emoji`)
    }
  })

  it('has no emoji for an id that does not exist', () => {
    assert.deepEqual(Object.keys(STICKER_EMOJI).sort(), [...STICKER_IDS].sort())
  })

  it('only ever returns an id the drawings know about', () => {
    const known = new Set(STICKER_IDS)
    const names = [
      'Mango', 'Watermelon', 'Apple Juice', 'Zzzz', '', 'Corned Beef',
      'Whole Wheat Bread', 'Dish Soap', 'Alaska Condensed Milk',
    ]
    for (const name of names) {
      const id = stickerFor(name, 'other')
      assert.ok(known.has(id), `${name} -> ${id}`)
      assert.ok(emojiFor(id), `${id} renders`)
    }
  })
})
