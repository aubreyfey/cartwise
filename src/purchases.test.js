// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  forgetTripPurchases,
  historyFor,
  lastPurchasedAt,
  makePurchase,
  priceStats,
  recordTripPurchases,
  removePurchase,
  storeComparison,
  updatePurchase,
} from './purchases.js'

const DAY = 86_400_000
const AUG = 1_756_000_000_000

const buy = (productId, price, at, storeId = 's1', storeName = 'Gaisano') =>
  makePurchase({ productId, name: 'Babybel', price, purchasedAt: at, storeId, storeName })

describe('makePurchase', () => {
  it('keeps a real price and nulls an unknown one', () => {
    assert.equal(makePurchase({ productId: 'p', name: 'x', price: 289.5 }).price, 289.5)
    for (const junk of [null, undefined, 0, -4, 'lots', NaN]) {
      assert.equal(makePurchase({ productId: 'p', name: 'x', price: junk }).price, null)
    }
  })

  it('carries the name as well as the id', () => {
    // A receipt outlives the packet: a purchase has to stay readable after the
    // Vault item behind it is forgotten.
    const p = makePurchase({ productId: 'p1', name: 'Babybel Mini Cheese', price: 10 })
    assert.equal(p.name, 'Babybel Mini Cheese')
    assert.ok(p.id)
  })
})

describe('recordTripPurchases', () => {
  const vault = [
    { id: 'p1', name: 'Babybel Mini Cheese' },
    { id: 'p2', name: 'Fresh Milk' },
  ]
  const trip = {
    id: 't1',
    storeId: 's1',
    storeName: 'Gaisano',
    completedAt: AUG,
    items: [
      { name: 'Babybel Mini Cheese', qty: 1, price: 289.5, unit: 'pc' },
      { name: 'Fresh Milk', qty: 2, price: 89, unit: 'bottle' },
    ],
  }

  it('writes one record per line, linked to the Vault product', () => {
    const result = recordTripPurchases([], trip, vault)
    assert.equal(result.length, 2)
    assert.deepEqual(result.map((p) => p.productId), ['p1', 'p2'])
    assert.ok(result.every((p) => p.tripId === 't1'))
    assert.ok(result.every((p) => p.purchasedAt === AUG))
  })

  it('matches the Vault by name regardless of case or spacing', () => {
    const messy = { ...trip, items: [{ name: '  fresh MILK ', qty: 1, price: 89 }] }
    assert.equal(recordTripPurchases([], messy, vault)[0].productId, 'p2')
  })

  it('still records something the Vault has never heard of', () => {
    const odd = { ...trip, items: [{ name: 'Mystery Item', qty: 1, price: 12 }] }
    const [record] = recordTripPurchases([], odd, vault)
    assert.equal(record.productId, null)
    assert.equal(record.name, 'Mystery Item')
  })

  it('appends rather than replacing', () => {
    const existing = [buy('p1', 100, AUG - DAY)]
    assert.equal(recordTripPurchases(existing, trip, vault).length, 3)
  })

  it('does nothing for a trip with no items', () => {
    assert.deepEqual(recordTripPurchases([], { id: 't', items: [] }, vault), [])
    assert.deepEqual(recordTripPurchases([], null, vault), [])
  })
})

describe('historyFor', () => {
  const purchases = [
    buy('p1', 305, AUG + 60 * DAY),
    buy('p1', 289.5, AUG),
    buy('p1', 275, AUG + 14 * DAY, 's2', 'SM'),
    buy('p2', 89, AUG),
    makePurchase({ productId: 'p1', name: 'Babybel', price: null, purchasedAt: AUG + DAY }),
  ]

  it('returns only this product, oldest first', () => {
    const history = historyFor(purchases, 'p1')
    assert.deepEqual(history.map((p) => p.price), [289.5, 275, 305])
  })

  it('leaves out unpriced lines — they cannot join a price history', () => {
    assert.equal(historyFor(purchases, 'p1').length, 3)
  })

  it('narrows to one shop', () => {
    assert.deepEqual(historyFor(purchases, 'p1', { storeId: 's2' }).map((p) => p.price), [275])
  })

  it('is empty for a product never bought', () => {
    assert.deepEqual(historyFor(purchases, 'nope'), [])
  })
})

describe('priceStats', () => {
  const purchases = [
    buy('p1', 289.5, AUG),
    buy('p1', 275, AUG + 14 * DAY, 's2', 'SM'),
    buy('p1', 305, AUG + 60 * DAY),
  ]

  it('reports the shape of the history', () => {
    const stats = priceStats(purchases, 'p1')
    assert.equal(stats.count, 3)
    assert.equal(stats.lowest.price, 275)
    assert.equal(stats.highest.price, 305)
    assert.equal(stats.latest.price, 305)
    assert.equal(stats.first.price, 289.5)
    assert.ok(Math.abs(stats.average - 289.8333) < 0.01)
  })

  it('measures the change from first to latest, not lowest to highest', () => {
    assert.ok(Math.abs(priceStats(purchases, 'p1').change - 15.5) < 0.001)
  })

  it('refuses to report a change from a single purchase', () => {
    // One price is not a trend, and rendering "+₱0.00" would imply it is.
    assert.equal(priceStats([buy('p1', 289.5, AUG)], 'p1').change, null)
  })

  it('returns null rather than zeroes when there is nothing priced', () => {
    // An average of no numbers is not 0.00.
    assert.equal(priceStats([], 'p1'), null)
    assert.equal(priceStats([buy('p2', 10, AUG)], 'p1'), null)
  })

  it('names the shop behind the lowest price', () => {
    assert.equal(priceStats(purchases, 'p1').lowest.storeName, 'SM')
  })
})

describe('storeComparison', () => {
  const purchases = [
    buy('p1', 289.5, AUG),
    buy('p1', 275, AUG + 14 * DAY, 's2', 'SM'),
    buy('p1', 305, AUG + 60 * DAY),
    buy('p1', 298, AUG + 20 * DAY, 's3', 'Robinsons'),
  ]

  it('gives the latest price per shop, cheapest first', () => {
    const rows = storeComparison(purchases, 'p1')
    assert.deepEqual(rows.map((r) => r.storeName), ['SM', 'Robinsons', 'Gaisano'])
    assert.equal(rows.find((r) => r.storeName === 'Gaisano').price, 305, 'the newer Gaisano price')
  })

  it('marks the cheapest', () => {
    const rows = storeComparison(purchases, 'p1')
    assert.equal(rows[0].cheapest, true)
    assert.ok(rows.slice(1).every((r) => !r.cheapest))
  })

  it('marks nothing cheapest when there is only one shop to compare', () => {
    // "Cheapest of one" is not a finding.
    const rows = storeComparison([buy('p1', 289.5, AUG)], 'p1')
    assert.equal(rows.length, 1)
    assert.equal(rows[0].cheapest, false)
  })

  it('says when a price was last seen, so a stale one reads as stale', () => {
    const row = storeComparison(purchases, 'p1').find((r) => r.storeName === 'SM')
    assert.equal(row.lastSeen, AUG + 14 * DAY)
  })

  it('counts how often each shop was priced', () => {
    const twice = [...purchases, buy('p1', 270, AUG + 90 * DAY, 's2', 'SM')]
    assert.equal(storeComparison(twice, 'p1').find((r) => r.storeId === 's2').count, 2)
  })

  it('copes with a purchase that has no shop', () => {
    const rows = storeComparison([makePurchase({ productId: 'p1', name: 'x', price: 10 })], 'p1')
    assert.equal(rows.length, 1)
    assert.equal(rows[0].storeId, null)
  })
})

describe('editing and forgetting', () => {
  const purchases = [buy('p1', 289.5, AUG), buy('p1', 275, AUG + DAY, 's2', 'SM')]

  it('removes one record', () => {
    assert.equal(removePurchase(purchases, purchases[0].id).length, 1)
  })

  it('patches one without letting its id be rewritten', () => {
    const result = updatePurchase(purchases, purchases[0].id, { price: 300, id: 'hacked' })
    assert.equal(result[0].price, 300)
    assert.equal(result[0].id, purchases[0].id)
  })

  it('takes a trip’s purchases with it when the trip is deleted', () => {
    const withTrip = recordTripPurchases(purchases, {
      id: 't9', storeId: 's1', completedAt: AUG, items: [{ name: 'x', qty: 1, price: 5 }],
    }, [])
    assert.equal(withTrip.length, 3)
    assert.equal(forgetTripPurchases(withTrip, 't9').length, 2)
  })
})

describe('lastPurchasedAt', () => {
  it('finds the most recent, priced or not', () => {
    const purchases = [
      buy('p1', 289.5, AUG),
      makePurchase({ productId: 'p1', name: 'x', price: null, purchasedAt: AUG + 5 * DAY }),
    ]
    assert.equal(lastPurchasedAt(purchases, 'p1'), AUG + 5 * DAY)
  })

  it('is null for something never bought', () => {
    assert.equal(lastPurchasedAt([], 'p1'), null)
  })
})
