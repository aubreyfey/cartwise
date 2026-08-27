// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { priceSource, searchVault, vaultCategories } from './vault.js'

const v = (name, extra = {}) => ({
  id: `v-${name}`,
  name,
  category: 'other',
  timesUsed: 1,
  price: null,
  prices: {},
  ...extra,
})

const VAULT = [
  v('Milk', { category: 'dairy', timesUsed: 9 }),
  v('Buttermilk', { category: 'dairy', timesUsed: 2 }),
  v('Cheddar Cheese', { category: 'dairy', timesUsed: 5 }),
  v('Babybel Mini Cheese', { category: 'dairy', timesUsed: 1, brand: 'Babybel' }),
  v('Bananas', { category: 'produce', timesUsed: 7 }),
  v('Whole Wheat Bread', { category: 'bakery', timesUsed: 4 }),
]

describe('searchVault', () => {
  it('lists the whole vault, most-bought first, when nothing is typed', () => {
    const result = searchVault(VAULT, {})
    assert.equal(result.length, VAULT.length)
    assert.equal(result[0].name, 'Milk')
  })

  it('puts a name that starts with the query first', () => {
    // "mil" should offer Milk before Buttermilk, however often either is bought.
    const names = searchVault(VAULT, { query: 'mil' }).map((i) => i.name)
    assert.equal(names[0], 'Milk')
    assert.ok(names.includes('Buttermilk'))
  })

  it('ranks a word inside the name above a bare substring', () => {
    const names = searchVault(VAULT, { query: 'cheese' }).map((i) => i.name)
    assert.deepEqual(names, ['Cheddar Cheese', 'Babybel Mini Cheese'])
  })

  it('breaks ties by how often it is bought', () => {
    const names = searchVault(VAULT, { query: 'b' }).map((i) => i.name)
    assert.equal(names[0], 'Bananas', 'bought 7 times, ahead of Buttermilk at 2')
  })

  it('finds things by the brand on the packet', () => {
    const names = searchVault(VAULT, { query: 'babybel' }).map((i) => i.name)
    assert.ok(names.includes('Babybel Mini Cheese'))
  })

  it('ignores case and surrounding space', () => {
    assert.equal(searchVault(VAULT, { query: '  MILK ' })[0].name, 'Milk')
  })

  it('narrows to one aisle', () => {
    const result = searchVault(VAULT, { category: 'produce' })
    assert.deepEqual(result.map((i) => i.name), ['Bananas'])
  })

  it('applies the aisle and the query together', () => {
    assert.deepEqual(searchVault(VAULT, { query: 'b', category: 'bakery' }).map((i) => i.name), [
      'Whole Wheat Bread',
    ])
  })

  it('returns nothing rather than everything when there is no match', () => {
    assert.deepEqual(searchVault(VAULT, { query: 'xylophone' }), [])
  })

  it('survives a vault with pieces missing', () => {
    const ragged = [{ id: 'a' }, { id: 'b', name: 'Milk' }, null].filter(Boolean)
    assert.doesNotThrow(() => searchVault(ragged, { query: 'mil' }))
    assert.equal(searchVault(ragged, { query: 'mil' })[0].name, 'Milk')
  })

  it('does not mutate the vault it was given', () => {
    const before = VAULT.map((i) => i.name)
    searchVault(VAULT, { query: 'cheese' })
    assert.deepEqual(VAULT.map((i) => i.name), before)
  })
})

describe('vaultCategories', () => {
  it('counts what is in each aisle', () => {
    const result = vaultCategories(VAULT, ['dairy', 'produce', 'bakery'])
    assert.deepEqual(result, [
      { id: 'dairy', count: 4 },
      { id: 'produce', count: 1 },
      { id: 'bakery', count: 1 },
    ])
  })

  it('leaves out aisles nothing has been bought from', () => {
    const ids = vaultCategories(VAULT, ['dairy', 'frozen', 'produce']).map((c) => c.id)
    assert.ok(!ids.includes('frozen'))
  })

  it('follows the order it is handed, so the strip matches the list', () => {
    const ids = vaultCategories(VAULT, ['bakery', 'produce', 'dairy']).map((c) => c.id)
    assert.deepEqual(ids, ['bakery', 'produce', 'dairy'])
  })

  it('copes with no order and an empty vault', () => {
    assert.deepEqual(vaultCategories([], ['dairy']), [])
    assert.equal(vaultCategories(VAULT).length, 3)
  })

  it('files an item with no category under other', () => {
    assert.deepEqual(vaultCategories([{ id: 'x', name: 'Thing' }], ['other']), [
      { id: 'other', count: 1 },
    ])
  })
})

describe('priceSource', () => {
  const item = v('Milk', { price: 80, prices: { s1: 89 } })

  it('names the shop when that shop has its own price', () => {
    assert.equal(priceSource(item, 's1'), 's1')
  })

  it('says the price came from somewhere else when this shop has none', () => {
    // The row shows the fallback, so it has to be able to admit where it is
    // from rather than passing it off as this shop's price.
    assert.equal(priceSource(item, 's2'), 'anywhere')
  })

  it('reports nothing when the item has never been priced', () => {
    assert.equal(priceSource(v('Mystery'), 's1'), null)
    assert.equal(priceSource(null, 's1'), null)
  })

  it('treats zero as unknown, the way the rest of the app does', () => {
    // Deliberate: prices are > 0 or null everywhere here, because "I haven't
    // priced this yet" and "this is free" are different claims and only one
    // belongs in a budget total. A zero must not be reported as this shop's
    // price, or the row would show "₱0.00" as though it were real.
    assert.equal(priceSource(v('Zero', { prices: { s1: 0 } }), 's1'), null)
    assert.equal(priceSource(v('Zero', { price: 0 }), null), null)
  })
})
