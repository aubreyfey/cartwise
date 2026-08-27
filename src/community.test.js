// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  HORIZON_DAYS,
  bestOption,
  estimateBasket,
  freshness,
  makeReport,
  pricesForProduct,
  productKey,
  reportsFromPurchases,
  storeKey,
} from './community.js'

const DAY = 86_400_000
const NOW = new Date('2026-08-27T14:00:00').getTime()
const ago = (days) => NOW - days * DAY

const report = (name, store, price, days = 0, extra = {}) =>
  makeReport({
    product: { name, ...extra },
    storeName: store,
    price,
    at: ago(days),
  })

describe('product identity', () => {
  it('pools on the barcode when there is one', () => {
    // The only thing two strangers reliably agree on.
    const a = productKey({ name: 'Alaska Condensed Milk 300ml', barcode: '4800361410816' })
    const b = productKey({ name: 'alaska condensed', barcode: '4800361410816' })
    assert.equal(a.key, b.key)
    assert.equal(a.exact, true)
  })

  it('falls back to the name, and says the match is not exact', () => {
    const k = productKey({ name: 'Alaska Condensed Milk' })
    assert.match(k.key, /^name:/)
    assert.equal(k.exact, false)
  })

  it('pools names that differ only in case and punctuation', () => {
    assert.equal(
      productKey({ name: 'Alaska  Condensed Milk!' }).key,
      productKey({ name: 'alaska condensed milk' }).key,
    )
  })

  it('refuses a short or absent barcode rather than pooling on noise', () => {
    assert.equal(productKey({ name: 'Milk', barcode: '123' }).exact, false)
  })

  it('is null when there is nothing to key on', () => {
    assert.equal(productKey({}), null)
    assert.equal(productKey({ name: '   ' }), null)
  })
})

describe('store identity', () => {
  it('treats the same shop written differently as one shop', () => {
    assert.equal(storeKey('Gaisano'), storeKey('  gaisano '))
    assert.equal(storeKey('SM Supermarket'), storeKey('sm supermarket'))
  })

  it('keeps different shops apart', () => {
    assert.notEqual(storeKey('Gaisano'), storeKey('Robinsons'))
  })

  it('is null for nothing', () => {
    assert.equal(storeKey(''), null)
    assert.equal(storeKey(null), null)
  })
})

describe('makeReport', () => {
  it('carries no identifier of any kind', () => {
    // The whole feature is not worth building if it costs people this.
    const r = report('Milk', 'Gaisano', 42.5)
    const keys = Object.keys(r)
    for (const banned of ['userId', 'deviceId', 'tripId', 'purchaseId', 'listId', 'id']) {
      assert.ok(!keys.includes(banned), `${banned} must not be in a report`)
    }
  })

  it('rounds the time to the day it happened', () => {
    // A precise timestamp plus a shop is a movement record.
    const r = makeReport({ product: { name: 'Milk' }, storeName: 'Gaisano', price: 10, at: NOW })
    assert.equal(new Date(r.reportedAt).getHours(), 0)
    assert.equal(new Date(r.reportedAt).getMinutes(), 0)
  })

  it('refuses to report an unknown price', () => {
    for (const junk of [null, undefined, 0, -3, 'lots', NaN]) {
      assert.equal(makeReport({ product: { name: 'Milk' }, storeName: 'X', price: junk }), null)
    }
  })

  it('refuses a report with no shop, rather than pooling it under nothing', () => {
    assert.equal(makeReport({ product: { name: 'Milk' }, storeName: '', price: 10 }), null)
  })

  it('refuses a report with no identifiable product', () => {
    assert.equal(makeReport({ product: {}, storeName: 'Gaisano', price: 10 }), null)
  })
})

describe('reportsFromPurchases', () => {
  it('turns your own history into reports, skipping the unpriced', () => {
    const vault = [{ id: 'p1', name: 'Milk', barcode: '4800361410816' }]
    const purchases = [
      { productId: 'p1', name: 'Milk', storeName: 'Gaisano', price: 42.5, purchasedAt: ago(1) },
      { productId: 'p1', name: 'Milk', storeName: 'Gaisano', price: null, purchasedAt: ago(2) },
      { productId: 'x', name: 'Bread', storeName: 'SM', price: 74, purchasedAt: ago(3) },
    ]
    const reports = reportsFromPurchases(purchases, vault)
    assert.equal(reports.length, 2)
    assert.ok(reports[0].productKey.startsWith('ean:'), 'uses the Vault barcode')
  })
})

describe('freshness', () => {
  it('says today, yesterday, then counts days', () => {
    assert.equal(freshness(NOW, NOW).label, 'reported today')
    assert.equal(freshness(ago(1), NOW).label, 'reported yesterday')
    assert.equal(freshness(ago(4), NOW).label, 'reported 4 days ago')
  })

  it('marks anything past the horizon as stale', () => {
    assert.equal(freshness(ago(HORIZON_DAYS), NOW).stale, false)
    assert.equal(freshness(ago(HORIZON_DAYS + 1), NOW).stale, true)
  })
})

describe('pricesForProduct', () => {
  const key = productKey({ name: 'Condensed Milk' }).key
  const reports = [
    report('Condensed Milk', 'Gaisano', 42.5, 0),
    report('Condensed Milk', 'SM Supermarket', 44, 1),
    report('Condensed Milk', 'Robinsons', 46.25, 4),
    report('Condensed Milk', 'Gaisano', 39, 9),
    report('Other Thing', 'Gaisano', 5, 0),
  ]

  it('gives one row per shop, cheapest first', () => {
    const rows = pricesForProduct(reports, key, NOW)
    assert.deepEqual(rows.map((r) => r.storeName), ['Gaisano', 'SM Supermarket', 'Robinsons'])
  })

  it('uses the newest sighting at each shop, not the cheapest', () => {
    // An old bargain is not what the shop charges now.
    const gaisano = pricesForProduct(reports, key, NOW).find((r) => r.storeName === 'Gaisano')
    assert.equal(gaisano.price, 42.5)
  })

  it('counts how many sightings back each shop', () => {
    const gaisano = pricesForProduct(reports, key, NOW).find((r) => r.storeName === 'Gaisano')
    assert.equal(gaisano.sightings, 2)
  })

  it('leaves other products out', () => {
    assert.equal(pricesForProduct(reports, key, NOW).length, 3)
  })

  it('attaches how old each price is', () => {
    const rows = pricesForProduct(reports, key, NOW)
    assert.equal(rows.find((r) => r.storeName === 'Robinsons').label, 'reported 4 days ago')
  })
})

describe('estimateBasket', () => {
  const basket = [
    { name: 'Milk', qty: 2 },
    { name: 'Bread', qty: 1 },
    { name: 'Eggs', qty: 1 },
  ]
  const reports = [
    report('Milk', 'Gaisano', 40, 1),
    report('Bread', 'Gaisano', 70, 1),
    report('Eggs', 'Gaisano', 200, 2),
    report('Milk', 'SM', 44, 1),
    report('Bread', 'SM', 74, 1),
    report('Eggs', 'SM', 210, 1),
    // Robinsons only knows one of the three.
    report('Milk', 'Robinsons', 30, 1),
  ]

  it('multiplies by quantity', () => {
    const g = estimateBasket(basket, reports, NOW).find((e) => e.storeName === 'Gaisano')
    assert.equal(g.total, 40 * 2 + 70 + 200)
  })

  it('reports coverage, and only totals what the shop actually prices', () => {
    const rob = estimateBasket(basket, reports, NOW).find((e) => e.storeName === 'Robinsons')
    assert.equal(rob.covered, 1)
    assert.equal(rob.of, 3)
    assert.equal(rob.complete, false)
    assert.equal(rob.total, 30 * 2, 'only the milk')
    assert.deepEqual(rob.missing, ['Bread', 'Eggs'])
  })

  it('ranks complete baskets above cheap partial ones', () => {
    // Robinsons totals ₱60 against Gaisano's ₱350 purely by not knowing two
    // thirds of the list. Sorting on price alone sends you to the wrong shop.
    const ranked = estimateBasket(basket, reports, NOW)
    assert.equal(ranked[0].storeName, 'Gaisano')
    assert.equal(ranked.at(-1).storeName, 'Robinsons')
  })

  it('ignores stale prices when building a total', () => {
    const withOld = [...reports, report('Eggs', 'Old Shop', 1, HORIZON_DAYS + 5)]
    const shops = estimateBasket(basket, withOld, NOW).map((e) => e.storeName)
    assert.ok(!shops.includes('Old Shop'))
  })

  it('says how old the oldest price in the estimate is', () => {
    const g = estimateBasket(basket, reports, NOW).find((e) => e.storeName === 'Gaisano')
    assert.equal(g.oldestDays, 2)
  })

  it('copes with an empty basket or no reports', () => {
    assert.deepEqual(estimateBasket([], reports, NOW).every((e) => e.covered === 0), true)
    assert.deepEqual(estimateBasket(basket, [], NOW), [])
  })
})

describe('bestOption', () => {
  const basket = [{ name: 'Milk', qty: 1 }, { name: 'Bread', qty: 1 }]

  it('recommends the cheapest shop that can price everything', () => {
    const reports = [
      report('Milk', 'Gaisano', 40), report('Bread', 'Gaisano', 70),
      report('Milk', 'SM', 44), report('Bread', 'SM', 74),
    ]
    const result = bestOption(estimateBasket(basket, reports, NOW))
    assert.equal(result.best.storeName, 'Gaisano')
    assert.equal(result.saving, (44 + 74) - (40 + 70))
  })

  it('never recommends a shop that cannot price the whole basket', () => {
    // Even though its subtotal is by far the lowest.
    const reports = [
      report('Milk', 'Gaisano', 40), report('Bread', 'Gaisano', 70),
      report('Milk', 'Cheap But Partial', 1),
    ]
    const result = bestOption(estimateBasket(basket, reports, NOW))
    assert.equal(result.best.storeName, 'Gaisano')
  })

  it('reports no saving when only one shop knows the whole basket', () => {
    // "Cheapest of one" is not a finding.
    const reports = [report('Milk', 'Gaisano', 40), report('Bread', 'Gaisano', 70)]
    const result = bestOption(estimateBasket(basket, reports, NOW))
    assert.equal(result.saving, null)
    assert.equal(result.comparedAcross, 1)
  })

  it('is null when nothing can price the basket', () => {
    const reports = [report('Milk', 'Gaisano', 40)]
    assert.equal(bestOption(estimateBasket(basket, reports, NOW)), null)
    assert.equal(bestOption([]), null)
  })
})
