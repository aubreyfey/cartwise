// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  expectedRange,
  overBy,
  paidRange,
  rangeVerdict,
  setExpectedRange,
  suggestExpected,
} from './priceRange.js'

const DAY = 86_400_000
const NOW = 1_760_000_000_000

const buy = (productId, price, storeName, daysAgo = 0) => ({
  id: `p-${productId}-${price}`,
  productId,
  name: productId,
  storeId: storeName,
  storeName,
  price,
  qty: 1,
  purchasedAt: NOW - daysAgo * DAY,
})

const purchases = [
  buy('rice', 52, 'Savemore', 30),
  buy('rice', 58, 'Gaisano', 10),
  buy('rice', 55, 'Savemore', 2),
  buy('milk', 90, 'Savemore', 5),
  // In the basket, never priced. Must not become a range of zero.
  { ...buy('soap', 0, 'Savemore', 1), price: null },
]

describe('paidRange', () => {
  it('reports the lowest and highest actually paid', () => {
    const r = paidRange(purchases, 'rice')
    assert.equal(r.low, 52)
    assert.equal(r.high, 58)
    assert.equal(r.count, 3)
  })

  it('names where each end came from, so the range is checkable', () => {
    const r = paidRange(purchases, 'rice')
    assert.equal(r.lowStore, 'Savemore')
    assert.equal(r.highStore, 'Gaisano')
  })

  it('does not call a single price a range', () => {
    // "₱90–₱90" dresses one data point up as a spread.
    const r = paidRange(purchases, 'milk')
    assert.equal(r.low, 90)
    assert.equal(r.high, 90)
    assert.equal(r.spread, false)
  })

  it('is null for a product never priced', () => {
    assert.equal(paidRange(purchases, 'soap'), null)
    assert.equal(paidRange(purchases, 'nothing'), null)
    assert.equal(paidRange([], 'rice'), null)
    assert.equal(paidRange(), null)
  })
})

describe('expectedRange', () => {
  it('reads a range someone has set', () => {
    assert.deepEqual(expectedRange({ expectedLow: 50, expectedHigh: 60 }), { low: 50, high: 60 })
  })

  it('rights a range typed the wrong way round', () => {
    // A slip, not an error worth refusing.
    assert.deepEqual(expectedRange({ expectedLow: 60, expectedHigh: 50 }), { low: 50, high: 60 })
  })

  it('is null unless both ends are real prices', () => {
    assert.equal(expectedRange({ expectedLow: 50 }), null)
    assert.equal(expectedRange({ expectedHigh: 60 }), null)
    assert.equal(expectedRange({ expectedLow: 0, expectedHigh: 60 }), null)
    assert.equal(expectedRange({}), null)
    assert.equal(expectedRange(), null)
  })
})

describe('rangeVerdict', () => {
  const expected = { low: 50, high: 60 }

  it('places a price against the range', () => {
    assert.equal(rangeVerdict(45, expected), 'below')
    assert.equal(rangeVerdict(55, expected), 'within')
    assert.equal(rangeVerdict(72, expected), 'above')
  })

  it('counts the ends as inside', () => {
    assert.equal(rangeVerdict(50, expected), 'within')
    assert.equal(rangeVerdict(60, expected), 'within')
  })

  it('is null when there is nothing to judge against', () => {
    // Not 'within'. No opinion is different from approval, and a caller that
    // treats null as a pass would show a tick for an unset range.
    assert.equal(rangeVerdict(55, null), null)
    assert.equal(rangeVerdict(null, expected), null)
    assert.equal(rangeVerdict(0, expected), null)
  })
})

describe('overBy', () => {
  const expected = { low: 50, high: 60 }

  it('measures how far outside a price is', () => {
    assert.equal(overBy(72, expected), 12)
    assert.equal(overBy(45, expected), 5)
  })

  it('is zero inside the range, and zero with no range', () => {
    assert.equal(overBy(55, expected), 0)
    assert.equal(overBy(55, null), 0)
  })
})

describe('suggestExpected', () => {
  it('pads what was actually paid, so a peso does not trip it', () => {
    const s = suggestExpected({ low: 52, high: 58 })
    assert.ok(s.low < 52, `${s.low} should sit under the lowest paid`)
    assert.ok(s.high > 58, `${s.high} should sit over the highest paid`)
  })

  it('never suggests a negative floor', () => {
    assert.ok(suggestExpected({ low: 1, high: 2 }).low >= 0)
  })

  it('is null with no history, rather than guessing', () => {
    // Guessing a range for a product nobody has bought would be the app
    // inventing a price, which it does not do.
    assert.equal(suggestExpected(null), null)
  })
})

describe('setExpectedRange', () => {
  it('stores both ends on the item', () => {
    const item = setExpectedRange({ id: 'v1', name: 'Rice' }, { low: 50, high: 60 })
    assert.equal(item.expectedLow, 50)
    assert.equal(item.expectedHigh, 60)
    assert.equal(item.name, 'Rice')
  })

  it('sorts the ends however they arrive', () => {
    const item = setExpectedRange({}, { low: 60, high: 50 })
    assert.equal(item.expectedLow, 50)
    assert.equal(item.expectedHigh, 60)
  })

  it('clears the range without leaving the fields behind', () => {
    const item = setExpectedRange({ id: 'v1', expectedLow: 50, expectedHigh: 60 }, null)
    assert.equal('expectedLow' in item, false)
    assert.equal('expectedHigh' in item, false)
    assert.equal(item.id, 'v1')
  })

  it('does not mutate the item it was given', () => {
    const before = { id: 'v1' }
    setExpectedRange(before, { low: 1, high: 2 })
    assert.equal('expectedLow' in before, false)
  })
})

describe('the two ranges together', () => {
  it('a suggested range accepts every price it was built from', () => {
    // The point of the padding: a range drawn from three trips must not flag
    // the trips it came from.
    const paid = paidRange(purchases, 'rice')
    const suggested = suggestExpected(paid)
    for (const price of [52, 55, 58]) {
      assert.equal(rangeVerdict(price, suggested), 'within', `${price} should be inside`)
    }
  })
})
