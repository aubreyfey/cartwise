// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { VAULT_SORTS, sortVaultRows, vaultRows, vaultSummary } from './vaultStats.js'

const DAY = 86_400_000
const NOW = 1_760_000_000_000

const vault = [
  { id: 'rice', name: 'Rice', timesUsed: 9 },
  { id: 'milk', name: 'Milk', timesUsed: 4 },
  { id: 'soap', name: 'Soap', timesUsed: 1 },
]

// Rice: three prices, two shops, rising. Milk: one price. Soap: never priced.
const purchases = [
  { id: 'a', productId: 'rice', name: 'Rice', storeId: 's1', storeName: 'Savemore', price: 50, qty: 1, purchasedAt: NOW - 30 * DAY },
  { id: 'b', productId: 'rice', name: 'Rice', storeId: 's2', storeName: 'Gaisano', price: 62, qty: 1, purchasedAt: NOW - 10 * DAY },
  { id: 'c', productId: 'rice', name: 'Rice', storeId: 's1', storeName: 'Savemore', price: 58, qty: 1, purchasedAt: NOW - 2 * DAY },
  { id: 'd', productId: 'milk', name: 'Milk', storeId: 's1', storeName: 'Savemore', price: 90, qty: 1, purchasedAt: NOW - 5 * DAY },
  // In the basket, but nobody typed a price. Still a purchase.
  { id: 'e', productId: 'soap', name: 'Soap', storeId: 's1', storeName: 'Savemore', price: null, qty: 1, purchasedAt: NOW - DAY },
]

describe('vaultSummary', () => {
  it('counts what the Vault actually knows', () => {
    const s = vaultSummary(vault, purchases)
    assert.equal(s.products, 3)
    assert.equal(s.pricesRecorded, 4) // the unpriced soap is not a price
    assert.equal(s.shops, 2)
    assert.equal(s.priced, 2) // rice and milk
  })

  it('counts only products with enough history to show a trend', () => {
    // Milk has one price: a single point is not a trend.
    assert.equal(vaultSummary(vault, purchases).withHistory, 1)
  })

  it('is all zeroes for an empty Vault rather than throwing', () => {
    const s = vaultSummary([], [])
    assert.deepEqual(s, { products: 0, pricesRecorded: 0, shops: 0, withHistory: 0, priced: 0 })
  })

  it('survives being called with nothing at all', () => {
    assert.equal(vaultSummary().products, 0)
  })
})

describe('vaultRows', () => {
  const rows = vaultRows(vault, purchases, { now: NOW })
  const rice = rows.find((r) => r.item.id === 'rice')
  const milk = rows.find((r) => r.item.id === 'milk')
  const soap = rows.find((r) => r.item.id === 'soap')

  it('gives a row per Vault product, priced or not', () => {
    // A product with no price is still yours; hiding it would misreport size.
    assert.equal(rows.length, 3)
  })

  it('reports the most recent price paid, not the lowest', () => {
    assert.equal(rice.lastPaid, 58)
    assert.equal(rice.lastStore, 'Savemore')
  })

  it('measures the change from the first price, not the previous one', () => {
    // 58 now against 50 the first time.
    assert.equal(rice.change, 8)
  })

  it('names a cheapest shop only when there is another to beat', () => {
    assert.equal(rice.cheapest.storeName, 'Savemore')
    assert.equal(rice.shopCount, 2)
    // Milk has been bought at exactly one shop, so "cheapest" means nothing.
    assert.equal(milk.cheapest, null)
    assert.equal(milk.shopCount, 1)
  })

  it('says nothing about a product it has never seen a price for', () => {
    assert.equal(soap.stats, null)
    assert.equal(soap.lastPaid, null)
    assert.equal(soap.change, null)
    assert.equal(soap.daysSince, null)
  })

  it('counts days since the last priced purchase', () => {
    assert.equal(rice.daysSince, 2)
    assert.equal(milk.daysSince, 5)
  })
})

describe('sortVaultRows', () => {
  const rows = vaultRows(vault, purchases, { now: NOW })
  const ids = (sort) => sortVaultRows(rows, sort).map((r) => r.item.id)

  it('puts the most recently bought first', () => {
    assert.deepEqual(ids('recent'), ['rice', 'milk', 'soap'])
  })

  it('sinks never-priced products to the bottom rather than dropping them', () => {
    assert.equal(ids('recent').at(-1), 'soap')
    assert.equal(ids('dearer').at(-1), 'soap')
  })

  it('orders by how often you buy it', () => {
    assert.deepEqual(ids('used'), ['rice', 'milk', 'soap'])
  })

  it('puts the biggest price rise first', () => {
    assert.equal(ids('dearer')[0], 'rice')
  })

  it('sorts alphabetically, case-insensitively', () => {
    assert.deepEqual(ids('name'), ['milk', 'rice', 'soap'])
  })

  it('falls back to recent for a sort it does not know', () => {
    assert.deepEqual(ids('nonsense'), ids('recent'))
  })

  it('does not mutate the rows it was handed', () => {
    const before = rows.map((r) => r.item.id)
    sortVaultRows(rows, 'name')
    assert.deepEqual(rows.map((r) => r.item.id), before)
  })

  it('every advertised sort actually works', () => {
    for (const s of VAULT_SORTS) {
      assert.equal(sortVaultRows(rows, s.id).length, 3, s.id)
    }
  })
})
