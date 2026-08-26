// Run with: npm test
// Covers the pure logic — category guessing, money parsing, Vault price
// memory, and the store comparison. The React components are not tested here.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { guessCategory } from './categories.js'
import { formatMoney, lineTotal, parseMoney, parsePrice, sumLines } from './money.js'
import { formatQty, normalizeQty, stepFor } from './units.js'
import { isPerishable, suggestedExpiry } from './pantry.js'
import { compareStores, addStore } from './stores.js'
import {
  findVaultItem,
  forgetStorePrices,
  priceFor,
  rememberItem,
  rememberPrice,
  suggest,
} from './vault.js'

describe('guessCategory', () => {
  it('matches known items', () => {
    assert.equal(guessCategory('bananas'), 'produce')
    assert.equal(guessCategory('sourdough'), 'bakery')
    assert.equal(guessCategory('chicken thighs'), 'meat')
  })

  it('folds plurals back to the singular keyword', () => {
    assert.equal(guessCategory('carrots'), 'produce')
    assert.equal(guessCategory('berries'), 'produce')
    assert.equal(guessCategory('potatoes'), 'produce')
  })

  it('is case- and punctuation-insensitive', () => {
    assert.equal(guessCategory('  Whole MILK, 2% '), 'dairy')
  })

  it('falls back to other', () => {
    assert.equal(guessCategory('birthday candles'), 'other')
    assert.equal(guessCategory(''), 'other')
  })
})

describe('parseMoney', () => {
  it('accepts formatted input', () => {
    assert.equal(parseMoney('$4.20'), 4.2)
    assert.equal(parseMoney('4,20'), 4.2)
    assert.equal(parseMoney(3.5), 3.5)
  })

  it('treats junk and negatives as zero', () => {
    assert.equal(parseMoney(''), 0)
    assert.equal(parseMoney('free'), 0)
    assert.equal(parseMoney(null), 0)
    assert.equal(parseMoney('-5'), 0)
  })

  it('formats without throwing on bad input', () => {
    assert.equal(typeof formatMoney(NaN), 'string')
  })
})

describe('unknown prices', () => {
  it('treats a blank price box as unknown, not free', () => {
    assert.equal(parsePrice(''), null)
    assert.equal(parsePrice('   '), null)
    assert.equal(parsePrice(null), null)
    assert.equal(parsePrice(undefined), null)
    assert.equal(parsePrice('nonsense'), null)
    assert.equal(parsePrice('4.20'), 4.2)
    assert.equal(parsePrice(0), null, 'zero is not a real price')
  })

  it('gives no line total for an unpriced row', () => {
    assert.equal(lineTotal({ qty: 2, price: null }), null)
    assert.equal(lineTotal({ qty: 2, price: 3 }), 6)
  })

  it('leaves unpriced rows out of the total and counts them instead', () => {
    const { total, unpriced } = sumLines([
      { qty: 2, price: 3 },
      { qty: 1, price: null },
      { qty: 1, price: 4 },
    ])
    assert.equal(total, 10, 'the unpriced row did not count as zero')
    assert.equal(unpriced, 1)
  })
})

describe('suggested expiry', () => {
  const NOW = new Date(2026, 2, 15, 15, 30).getTime()

  it('suggests a date only for things that actually go off', () => {
    assert.equal(suggestedExpiry('meat', NOW), '2026-03-18', '3 days')
    assert.equal(suggestedExpiry('dairy', NOW), '2026-03-25', '10 days')
    assert.equal(suggestedExpiry('produce', NOW), '2026-03-22', '7 days')
  })

  it('declines to guess for shelf-stable aisles', () => {
    for (const c of ['pantry', 'household', 'drinks', 'snacks', 'other']) {
      assert.equal(suggestedExpiry(c, NOW), null)
      assert.equal(isPerishable(c), false)
    }
  })

  it('pads months and days to two digits', () => {
    const early = new Date(2026, 0, 1, 9).getTime()
    assert.equal(suggestedExpiry('meat', early), '2026-01-04')
  })

  it('rolls over month ends correctly', () => {
    const endOfMonth = new Date(2026, 0, 30, 12).getTime()
    assert.equal(suggestedExpiry('meat', endOfMonth), '2026-02-02')
  })
})

describe('units', () => {
  it('steps whole for countable units and fine for weight', () => {
    assert.equal(stepFor('pc'), 1)
    assert.equal(stepFor('bag'), 1)
    assert.equal(stepFor('kg'), 0.25)
  })

  it('keeps fractions for weight and rounds countable quantities', () => {
    assert.equal(normalizeQty('0.51', 'kg'), 0.51)
    assert.equal(normalizeQty('2.6', 'pc'), 3)
    assert.equal(normalizeQty('0', 'pc'), 1, 'never drops below one')
    assert.equal(normalizeQty('-4', 'kg'), 0.25)
    assert.equal(normalizeQty('junk', 'pc'), 1)
  })

  it('prints quantities without trailing zeros', () => {
    assert.equal(formatQty(2), '2')
    assert.equal(formatQty(0.51), '0.51')
    assert.equal(formatQty(1.5), '1.5')
  })
})

describe('Vault price memory', () => {
  const base = () =>
    rememberItem([], {
      name: 'Milk',
      category: 'dairy',
      price: 3,
      qty: 2,
      storeId: 'aldi',
    })

  it('records the price against the store and as the anywhere-price', () => {
    const [milk] = base()
    assert.equal(milk.price, 3)
    assert.equal(milk.prices.aldi, 3)
    assert.equal(milk.defaultQty, 2)
    assert.equal(milk.timesUsed, 1)
  })

  it('bumps usage instead of duplicating on re-add', () => {
    const vault = rememberItem(base(), {
      name: 'milk',
      category: 'dairy',
      price: 0,
      qty: 1,
      storeId: 'aldi',
    })
    assert.equal(vault.length, 1)
    assert.equal(vault[0].timesUsed, 2)
  })

  it('never overwrites a known price with an unknown one', () => {
    for (const blank of [null, 0]) {
      const vault = rememberItem(base(), {
        name: 'Milk',
        category: 'dairy',
        price: blank,
        qty: 1,
        storeId: 'aldi',
      })
      assert.equal(vault[0].price, 3, 'anywhere-price survived')
      assert.equal(vault[0].prices.aldi, 3, 'store price survived')
    }
  })

  it('files the old figure under previous when a price changes', () => {
    const vault = rememberPrice(base(), 'Milk', 3.5, 'aldi')
    assert.equal(vault[0].prices.aldi, 3.5)
    assert.equal(vault[0].previous.aldi, 3, 'so the row can flag the rise')
  })

  it('does not record a previous price when nothing changed', () => {
    const vault = rememberPrice(base(), 'Milk', 3, 'aldi')
    assert.equal(vault[0].previous.aldi, undefined)
  })

  it('keeps prices per store', () => {
    const vault = rememberPrice(base(), 'Milk', 4.5, 'costco')
    const milk = findVaultItem(vault, 'MILK')
    assert.equal(milk.prices.aldi, 3)
    assert.equal(milk.prices.costco, 4.5)
    assert.equal(milk.price, 4.5, 'anywhere-price tracks the latest')
  })

  it('priceFor falls back to the anywhere-price, strict does not', () => {
    const [milk] = base()
    assert.equal(priceFor(milk, 'aldi'), 3)
    assert.equal(priceFor(milk, 'tesco'), 3, 'falls back')
    assert.equal(priceFor(milk, 'tesco', { strict: true }), null, 'no fallback')
    assert.equal(priceFor(null, 'aldi'), null)
  })

  it('forgets a deleted store without touching other prices', () => {
    const vault = forgetStorePrices(rememberPrice(base(), 'Milk', 4.5, 'costco'), 'aldi')
    const milk = findVaultItem(vault, 'Milk')
    assert.equal(milk.prices.aldi, undefined)
    assert.equal(milk.prices.costco, 4.5)
  })
})

describe('suggest', () => {
  const vault = [
    { id: '1', name: 'Milk', price: 3, timesUsed: 1 },
    { id: '2', name: 'Milk chocolate', price: 2, timesUsed: 9 },
    { id: '3', name: 'Almond milk', price: 5, timesUsed: 20 },
  ]

  it('ranks prefix matches above contains matches, popularity breaking ties', () => {
    const names = suggest(vault, 'mil').map((s) => s.name)
    assert.deepEqual(names, ['Milk chocolate', 'Milk', 'Almond milk'])
  })

  it('drops the item whose name is already typed in full', () => {
    const names = suggest(vault, 'milk').map((s) => s.name)
    assert.ok(!names.includes('Milk'))
  })

  it('returns nothing for an empty query', () => {
    assert.deepEqual(suggest(vault, '   '), [])
  })
})

describe('compareStores', () => {
  const stores = [
    { id: 'a', name: 'Aldi' },
    { id: 'b', name: 'Costco' },
  ]

  it('totals the list at each store', () => {
    const vault = [
      { id: '1', name: 'Milk', price: 3, prices: { a: 3, b: 4 } },
      { id: '2', name: 'Eggs', price: 5, prices: { a: 5, b: 4 } },
    ]
    const items = [
      { name: 'Milk', qty: 2 },
      { name: 'Eggs', qty: 1 },
    ]
    const result = compareStores(stores, vault, items)
    assert.equal(result.totals[0].total, 11) // 3*2 + 5
    assert.equal(result.totals[1].total, 12) // 4*2 + 4
    assert.equal(result.cheapest.store.name, 'Aldi')
    assert.equal(result.savings, 1)
    assert.equal(result.comparable, 2)
  })

  it('only counts items priced at EVERY store', () => {
    // Caviar is priced at Aldi only. If it counted, Costco would look
    // cheaper purely because it has no price on file for it.
    const vault = [
      { id: '1', name: 'Milk', price: 3, prices: { a: 3, b: 2 } },
      { id: '2', name: 'Caviar', price: 90, prices: { a: 90 } },
    ]
    const items = [
      { name: 'Milk', qty: 1 },
      { name: 'Caviar', qty: 1 },
    ]
    const result = compareStores(stores, vault, items)
    assert.equal(result.comparable, 1, 'only milk is comparable')
    assert.equal(result.total, 2, 'but the list has two items')
    assert.equal(result.totals[0].total, 3)
    assert.equal(result.totals[1].total, 2)
    assert.equal(result.cheapest.store.name, 'Costco')
  })

  it('returns null when there is nothing meaningful to compare', () => {
    const vault = [{ id: '1', name: 'Milk', price: 3, prices: { a: 3 } }]
    assert.equal(compareStores([stores[0]], vault, [{ name: 'Milk', qty: 1 }]), null,
      'needs two stores')
    assert.equal(compareStores(stores, vault, []), null, 'needs items')
    assert.equal(compareStores(stores, vault, [{ name: 'Milk', qty: 1 }]), null,
      'needs an item priced at both')
    assert.equal(compareStores(stores, [], [{ name: 'Milk', qty: 1 }]), null,
      'needs the item in the vault')
  })
})

describe('addStore', () => {
  it('rejects blanks and case-insensitive duplicates', () => {
    const one = addStore([], 'Aldi')
    assert.equal(one.length, 1)
    assert.equal(addStore(one, '  aldi ').length, 1, 'duplicate ignored')
    assert.equal(addStore(one, '   ').length, 1, 'blank ignored')
    assert.equal(addStore(one, 'Costco').length, 2)
  })
})
