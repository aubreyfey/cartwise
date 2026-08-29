// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { priceGap, productShops, seenAgo } from './productMap.js'

const DAY = 86_400_000
const NOW = 1_760_000_000_000

const CEBU = { lat: 10.3157, lon: 123.8854 }
const NEARBY = { lat: 10.32, lon: 123.89 }

const stores = [
  { id: 's1', name: 'Savemore', location: CEBU },
  { id: 's2', name: 'Public Market', location: NEARBY },
  // Real shop, no location saved — still sells things.
  { id: 's3', name: 'Corner Store' },
]

const buy = (storeId, storeName, price, daysAgo) => ({
  id: `p-${storeId}-${price}`,
  productId: 'rice',
  name: 'Rice',
  storeId,
  storeName,
  price,
  qty: 1,
  purchasedAt: NOW - daysAgo * DAY,
})

const purchases = [
  buy('s1', 'Savemore', 58, 30),
  buy('s2', 'Public Market', 52, 10),
  buy('s3', 'Corner Store', 64, 5),
  buy('s1', 'Savemore', 56, 2),
]

describe('productShops', () => {
  const shops = productShops(purchases, stores, 'rice')

  it('lists every shop it has been bought at, cheapest first', () => {
    assert.deepEqual(shops.all.map((s) => s.name), ['Public Market', 'Savemore', 'Corner Store'])
  })

  it('carries the price paid at each', () => {
    assert.equal(shops.all[0].price, 52)
    // The most recent Savemore price, not the oldest.
    assert.equal(shops.all[1].price, 56)
  })

  it('splits the ones the map can show from the ones it cannot', () => {
    assert.deepEqual(shops.located.map((s) => s.name), ['Public Market', 'Savemore'])
    assert.deepEqual(shops.unlocated.map((s) => s.name), ['Corner Store'])
  })

  it('keeps unlocated shops rather than dropping them', () => {
    // They still sell the thing. Dropping them would make the list lie about
    // where you can buy it.
    assert.equal(shops.all.length, 3)
  })

  it('names the cheapest only when there is another to beat', () => {
    assert.equal(shops.cheapest.name, 'Public Market')
    const one = productShops([buy('s1', 'Savemore', 58, 1)], stores, 'rice')
    assert.equal(one.cheapest, null)
  })

  it('survives a shop that has since been deleted', () => {
    const orphan = productShops([buy('gone', 'Closed Shop', 40, 1)], stores, 'rice')
    assert.equal(orphan.all[0].name, 'Closed Shop')
    assert.equal(orphan.all[0].location, null)
    assert.equal(orphan.all[0].store, null)
  })

  it('ignores a location that is not usable', () => {
    // 0,0 is in the Atlantic and is what a broken sensor returns.
    const broken = [{ id: 's1', name: 'Savemore', location: { lat: 0, lon: 0 } }]
    const r = productShops([buy('s1', 'Savemore', 58, 1)], broken, 'rice')
    assert.equal(r.located.length, 0)
    assert.equal(r.all.length, 1)
  })

  it('is empty for a product never bought', () => {
    const none = productShops(purchases, stores, 'nothing')
    assert.deepEqual(none.all, [])
    assert.equal(none.cheapest, null)
  })

  it('survives being called with nothing', () => {
    assert.deepEqual(productShops().all, [])
  })
})

describe('priceGap', () => {
  it('measures cheapest against dearest', () => {
    const gap = priceGap(productShops(purchases, stores, 'rice'))
    assert.equal(gap.low, 52)
    assert.equal(gap.high, 64)
    assert.equal(gap.difference, 12)
    assert.equal(gap.cheapest.name, 'Public Market')
    assert.equal(gap.dearest.name, 'Corner Store')
  })

  it('is null when there is only one shop', () => {
    assert.equal(priceGap(productShops([buy('s1', 'Savemore', 58, 1)], stores, 'rice')), null)
  })

  it('is null when every shop charges the same', () => {
    // "Save ₱0 by going to the other shop" is not a finding.
    const same = [buy('s1', 'Savemore', 50, 2), buy('s2', 'Public Market', 50, 1)]
    assert.equal(priceGap(productShops(same, stores, 'rice')), null)
  })

  it('is null for nothing at all', () => {
    assert.equal(priceGap(null), null)
    assert.equal(priceGap({ all: [] }), null)
  })
})

describe('seenAgo', () => {
  it('reads naturally', () => {
    assert.equal(seenAgo(NOW, NOW), 'today')
    assert.equal(seenAgo(NOW - DAY, NOW), 'yesterday')
    assert.equal(seenAgo(NOW - 9 * DAY, NOW), '9 days ago')
    assert.equal(seenAgo(NOW - 70 * DAY, NOW), '2 months ago')
    assert.equal(seenAgo(NOW - 400 * DAY, NOW), '1 years ago')
  })

  it('is null when there is no date', () => {
    assert.equal(seenAgo(null), null)
    assert.equal(seenAgo(undefined), null)
  })
})
