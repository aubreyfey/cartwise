// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  defaultAisleOrder,
  isDefaultAisleOrder,
  moveAisle,
  normaliseAisleOrder,
  orderedCategories,
} from './aisleOrder.js'
import { CATEGORIES } from './categories.js'

const IDS = CATEGORIES.map((c) => c.id)

describe('normaliseAisleOrder', () => {
  it('leaves a complete order alone', () => {
    const shuffled = [...IDS].reverse()
    assert.deepEqual(normaliseAisleOrder(shuffled), shuffled)
  })

  it('fills in from the default when there is nothing stored', () => {
    for (const empty of [undefined, null, [], 'aisle', {}, 42]) {
      assert.deepEqual(normaliseAisleOrder(empty), IDS)
    }
  })

  it('drops aisles we no longer have', () => {
    const withGhost = ['produce', 'stationery', 'bakery']
    const result = normaliseAisleOrder(withGhost)
    assert.ok(!result.includes('stationery'))
    assert.deepEqual([...new Set(result)], result, 'and no duplicates')
  })

  it('drops repeats rather than rendering an aisle twice', () => {
    const result = normaliseAisleOrder(['produce', 'produce', 'bakery'])
    assert.equal(result.filter((id) => id === 'produce').length, 1)
  })

  it('always returns every aisle exactly once', () => {
    for (const input of [[], ['bakery'], ['other', 'produce'], IDS.slice(0, 3)]) {
      const result = normaliseAisleOrder(input)
      assert.deepEqual([...result].sort(), [...IDS].sort())
    }
  })

  it('puts a newly added aisle back beside its neighbour, not on the end', () => {
    // Someone who reordered their aisles in an older version should find a new
    // one where it belongs, not stranded at the bottom looking like a bug.
    const withoutDairy = IDS.filter((id) => id !== 'dairy')
    const result = normaliseAisleOrder(withoutDairy)
    assert.equal(
      result.indexOf('dairy'),
      IDS.indexOf('dairy'),
      'lands back in its shipped position',
    )
    assert.notEqual(result.at(-1), 'dairy')
  })

  it('keeps a custom order while restoring what was missing', () => {
    const custom = ['household', 'drinks', 'produce']
    const result = normaliseAisleOrder(custom)
    assert.ok(
      result.indexOf('household') < result.indexOf('drinks'),
      'the choices that were made are respected',
    )
    assert.ok(result.indexOf('drinks') < result.indexOf('produce'))
  })
})

describe('moveAisle', () => {
  it('moves one up and one down', () => {
    const order = ['produce', 'bakery', 'meat']
    assert.equal(moveAisle(order, 'bakery', -1)[0], 'bakery')
    assert.equal(moveAisle(order, 'produce', 1)[1], 'produce')
  })

  it('refuses to walk off either end', () => {
    const order = normaliseAisleOrder(IDS)
    assert.deepEqual(moveAisle(order, IDS[0], -1), order)
    assert.deepEqual(moveAisle(order, IDS.at(-1), 1), order)
  })

  it('ignores an aisle that is not there', () => {
    const order = normaliseAisleOrder(IDS)
    assert.deepEqual(moveAisle(order, 'stationery', 1), order)
  })

  it('never loses or duplicates an aisle', () => {
    let order = normaliseAisleOrder(IDS)
    for (const [id, delta] of [['meat', -1], ['meat', -1], ['other', -1], ['produce', 1]]) {
      order = moveAisle(order, id, delta)
      assert.deepEqual([...order].sort(), [...IDS].sort())
    }
  })

  it('does not mutate what it was given', () => {
    const order = ['produce', 'bakery', 'meat']
    const copy = [...order]
    moveAisle(order, 'meat', -1)
    assert.deepEqual(order, copy)
  })
})

describe('orderedCategories', () => {
  it('hands back whole categories, in order', () => {
    const custom = moveAisle(defaultAisleOrder(), 'household', -100 + 99)
    const rows = orderedCategories(custom)
    assert.equal(rows.length, CATEGORIES.length)
    for (const row of rows) {
      assert.ok(row.id && row.label && row.sticker, 'nothing undefined reaches the render')
    }
  })

  it('survives a stored order that is nonsense', () => {
    const rows = orderedCategories(['nope', null, 'produce'])
    assert.equal(rows.length, CATEGORIES.length)
    assert.ok(rows.every(Boolean))
  })
})

describe('isDefaultAisleOrder', () => {
  it('knows the shipped order', () => {
    assert.equal(isDefaultAisleOrder(defaultAisleOrder()), true)
    assert.equal(isDefaultAisleOrder(undefined), true, 'nothing stored is still default')
  })

  it('knows a rearranged one', () => {
    assert.equal(isDefaultAisleOrder(moveAisle(defaultAisleOrder(), 'meat', -1)), false)
  })
})
