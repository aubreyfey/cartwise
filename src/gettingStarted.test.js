// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gettingStarted, milestones } from './gettingStarted.js'

const DAY = 86_400_000
const NOW = new Date('2026-08-28T10:00:00').getTime()

const buy = (productId, storeId, price, dayOffset = 0) => ({
  productId,
  storeId,
  price,
  purchasedAt: NOW - dayOffset * DAY,
})

const idsDone = (data) =>
  milestones(data).filter((s) => s.done).map((s) => s.id)

describe('milestones', () => {
  it('starts with nothing done', () => {
    assert.deepEqual(idsDone({}), [])
  })

  it('counts a list with something on it', () => {
    assert.deepEqual(idsDone({ carts: [{ items: [{ name: 'Milk' }] }] }), ['list'])
  })

  it('does not count an empty list', () => {
    // A list created and never filled is not progress.
    assert.deepEqual(idsDone({ carts: [{ items: [] }] }), [])
  })

  it('counts a finished shop', () => {
    const done = idsDone({ trips: [{ id: 't1' }], carts: [{ items: [{ name: 'x' }] }] })
    assert.ok(done.includes('trip'))
  })

  it('unlocks price history only on a genuine second purchase', () => {
    const once = [buy('p1', 's1', 40, 0)]
    assert.ok(!idsDone({ purchases: once }).includes('history'))

    // Same product, same day, twice — one shop, not a history.
    const sameDay = [buy('p1', 's1', 40, 0), buy('p1', 's1', 42, 0)]
    assert.ok(!idsDone({ purchases: sameDay }).includes('history'))

    const twoDays = [buy('p1', 's1', 40, 7), buy('p1', 's1', 42, 0)]
    assert.ok(idsDone({ purchases: twoDays }).includes('history'))
  })

  it('unlocks comparison only across two different shops', () => {
    const oneShop = [buy('p1', 's1', 40), buy('p2', 's1', 20)]
    assert.ok(!idsDone({ purchases: oneShop }).includes('compare'))

    const twoShops = [buy('p1', 's1', 40), buy('p2', 's2', 20)]
    assert.ok(idsDone({ purchases: twoShops }).includes('compare'))
  })

  it('ignores unpriced purchases everywhere', () => {
    // They are real purchases but they teach the app nothing about price.
    const unpriced = [buy('p1', 's1', null, 7), buy('p1', 's2', null, 0)]
    const done = idsDone({ purchases: unpriced })
    assert.ok(!done.includes('history'))
    assert.ok(!done.includes('compare'))
  })

  it('ignores a purchase with no shop when counting shops', () => {
    const noShop = [buy('p1', null, 40), buy('p2', 's1', 20)]
    assert.ok(!idsDone({ purchases: noShop }).includes('compare'))
  })

  it('gives every milestone something it unlocks', () => {
    // The card's whole job is to say what you get, so a step with no promise
    // attached would be a bare chore.
    for (const step of milestones({})) {
      assert.ok(step.label, 'has a label')
      assert.ok(step.unlocks, `${step.id} says what it unlocks`)
    }
  })
})

describe('gettingStarted', () => {
  it('leads with the next thing to do', () => {
    const card = gettingStarted({ carts: [{ items: [{ name: 'Milk' }] }] })
    assert.equal(card.next.id, 'trip')
    assert.equal(card.done, 1)
    assert.equal(card.total, 4)
  })

  it('disappears once everything is done', () => {
    // A checklist that lingers after completion is clutter.
    const complete = {
      carts: [{ items: [{ name: 'Milk' }] }],
      trips: [{ id: 't1' }],
      purchases: [buy('p1', 's1', 40, 7), buy('p1', 's2', 42, 0)],
    }
    assert.equal(gettingStarted(complete), null)
  })

  it('survives being handed nothing at all', () => {
    assert.equal(gettingStarted({}).done, 0)
    assert.equal(gettingStarted(undefined).done, 0)
  })
})
