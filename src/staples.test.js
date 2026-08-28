// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORY_BY_ID } from './categories.js'
import { STAPLES, searchStaples, stapleCount, stapleToListItem } from './staples.js'

describe('the staples list itself', () => {
  it('covers the things the packaged-food catalogue does not', () => {
    // These are the exact words that returned nothing useful from the Open
    // Food Facts catalogue, which is why this file exists.
    for (const word of ['carrot', 'cabbage', 'rice', 'egg', 'onion', 'garlic', 'chicken']) {
      assert.ok(searchStaples(word).length > 0, `no staple for "${word}"`)
    }
  })

  it('uses categories the app actually has', () => {
    // A category id with no entry in the library would render as "Other" and
    // silently lose the aisle.
    for (const item of STAPLES) {
      assert.ok(CATEGORY_BY_ID[item.category], `${item.name} has unknown category ${item.category}`)
    }
  })

  it('has no duplicate names', () => {
    const seen = new Set()
    for (const item of STAPLES) {
      const key = item.name.toLowerCase()
      assert.equal(seen.has(key), false, `duplicate staple: ${item.name}`)
      seen.add(key)
    }
  })

  it('gives every entry a unit', () => {
    for (const item of STAPLES) {
      assert.ok(item.unit && typeof item.unit === 'string', `${item.name} has no unit`)
    }
  })

  it('is big enough to be worth having and small enough to bundle', () => {
    assert.ok(stapleCount() > 150, `only ${stapleCount()} staples`)
    assert.ok(stapleCount() < 600, 'too many to keep in the main bundle')
  })
})

describe('searchStaples ranking', () => {
  it('puts the plain thing before the qualified thing', () => {
    // The whole point: "rice" must not return Brown rice first, and must not
    // return rice crackers at all.
    assert.equal(searchStaples('rice')[0].name, 'Rice')
    assert.equal(searchStaples('milk')[0].name, 'Milk')
    assert.equal(searchStaples('bread')[0].name, 'Bread')
  })

  it('matches an exact name above a longer one that starts the same', () => {
    assert.equal(searchStaples('chicken')[0].name, 'Chicken')
  })

  it('finds things by their local name', () => {
    assert.equal(searchStaples('bawang')[0].name, 'Garlic')
    assert.equal(searchStaples('itlog')[0].name, 'Eggs')
    assert.equal(searchStaples('bigas')[0].name, 'Rice')
    assert.equal(searchStaples('kamatis')[0].name, 'Tomatoes')
    assert.equal(searchStaples('toyo')[0].name, 'Soy sauce')
  })

  it('finds things by an alternative English name', () => {
    assert.equal(searchStaples('aubergine')[0].name, 'Eggplant')
    assert.equal(searchStaples('mince')[0].name, 'Ground beef')
    assert.equal(searchStaples('prawns')[0].name, 'Shrimp')
  })

  it('ranks a real name above someone else’s alias', () => {
    // "Soap" is a staple; "sabon" is an alias of it. Searching the real name
    // must not be beaten by a longer entry that merely aliases the word.
    assert.equal(searchStaples('soap')[0].name, 'Soap')
  })

  it('is case and punctuation insensitive', () => {
    assert.equal(searchStaples('  RICE  ')[0].name, 'Rice')
    assert.equal(searchStaples('soy-sauce')[0].name, 'Soy sauce')
  })

  it('returns nothing for an empty query rather than everything', () => {
    assert.deepEqual(searchStaples(''), [])
    assert.deepEqual(searchStaples('   '), [])
    assert.deepEqual(searchStaples(null), [])
  })

  it('returns nothing for a word that is not a grocery', () => {
    assert.deepEqual(searchStaples('helicopter'), [])
  })

  it('respects the limit', () => {
    assert.ok(searchStaples('a', { limit: 3 }).length <= 3)
  })

  it('matches a single letter without falling over', () => {
    assert.doesNotThrow(() => searchStaples('c'))
  })
})

describe('stapleToListItem', () => {
  const rice = searchStaples('rice')[0]

  it('carries the name, aisle and unit', () => {
    const item = stapleToListItem(rice)
    assert.equal(item.name, 'Rice')
    assert.equal(item.category, 'pantry')
    assert.equal(item.unit, 'kg')
    assert.equal(item.qty, 1)
  })

  it('leaves the price unknown rather than inventing one', () => {
    // A made-up price would poison the budget and the Vault exactly as it
    // would from any other source.
    assert.equal(stapleToListItem(rice).price, null)
  })

  it('has no brand or barcode, because a staple is a kind of thing', () => {
    const item = stapleToListItem(rice)
    assert.equal(item.brand, null)
    assert.equal(item.barcode, null)
  })
})
