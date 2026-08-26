// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { addCart, findCart, initialCarts, makeCart, removeCart, renameCart, updateCart } from './carts.js'
import { byRecent, completeTrip, insights } from './trips.js'

describe('carts', () => {
  it('names an unnamed list by position', () => {
    const carts = addCart([makeCart('A')], '   ')
    assert.equal(carts[1].name, 'List 2')
  })

  it('renames, ignoring blanks', () => {
    const [cart] = [makeCart('Groceries')]
    assert.equal(renameCart([cart], cart.id, 'Party')[0].name, 'Party')
    assert.equal(renameCart([cart], cart.id, '  ')[0].name, 'Groceries')
  })

  it('updates one cart via patch or function, leaving others alone', () => {
    const a = makeCart('A')
    const b = makeCart('B')
    const patched = updateCart([a, b], a.id, { budget: 50 })
    assert.equal(patched[0].budget, 50)
    assert.equal(patched[1].budget, 0)

    const fn = updateCart([a, b], b.id, (c) => ({ name: c.name + '!' }))
    assert.equal(fn[1].name, 'B!')
    assert.equal(fn[0].name, 'A')
  })

  it('removes and finds by id', () => {
    const a = makeCart('A')
    const b = makeCart('B')
    assert.equal(removeCart([a, b], a.id).length, 1)
    assert.equal(findCart([a, b], b.id).name, 'B')
    assert.equal(findCart([a, b], 'nope'), null)
  })
})

describe('migration from the v1 single list', () => {
  it('folds a legacy list into one cart, keeping its budget', () => {
    const legacy = [{ id: '1', name: 'Milk', qty: 1, price: 3, category: 'dairy', checked: false }]
    const carts = initialCarts(legacy, 40)
    assert.equal(carts.length, 1)
    assert.equal(carts[0].items.length, 1)
    assert.equal(carts[0].budget, 40)
  })

  it('starts fresh when there is nothing to migrate', () => {
    for (const empty of [null, undefined, []]) {
      const carts = initialCarts(empty, null)
      assert.equal(carts.length, 1)
      assert.equal(carts[0].items.length, 0)
      assert.equal(carts[0].budget, 0)
    }
  })
})

describe('completeTrip', () => {
  const cart = {
    id: 'c1',
    name: 'Weekly',
    budget: 20,
    items: [
      { id: '1', name: 'Milk', category: 'dairy', qty: 2, price: 3, checked: true },
      { id: '2', name: 'Eggs', category: 'dairy', qty: 1, price: 4, checked: true },
      { id: '3', name: 'Caviar', category: 'other', qty: 1, price: 90, checked: false },
    ],
  }

  it('records only the checked items and their total', () => {
    const trip = completeTrip(cart, { id: 's1', name: 'Aldi' }, 1000)
    assert.equal(trip.items.length, 2, 'unchecked caviar excluded')
    assert.equal(trip.total, 10) // 3*2 + 4
    assert.equal(trip.storeName, 'Aldi')
    assert.equal(trip.budget, 20)
    assert.equal(trip.completedAt, 1000)
  })

  it('copies prices rather than referencing them', () => {
    const trip = completeTrip(cart, null, 1000)
    cart.items[0].price = 999
    assert.equal(trip.total, 10, 'past trip unaffected by later price edits')
    cart.items[0].price = 3
  })

  it('returns null when nothing is checked', () => {
    assert.equal(completeTrip({ ...cart, items: [] }, null), null)
    assert.equal(
      completeTrip({ ...cart, items: cart.items.map((i) => ({ ...i, checked: false })) }, null),
      null,
    )
  })

  it('copes with no store selected', () => {
    const trip = completeTrip(cart, null, 1000)
    assert.equal(trip.storeId, null)
    assert.equal(trip.storeName, null)
  })
})

describe('insights', () => {
  const trips = [
    {
      id: 't1', cartName: 'Weekly', storeName: 'Aldi', completedAt: 100,
      budget: 20, total: 15,
      items: [
        { name: 'Milk', category: 'dairy', qty: 1, price: 5 },
        { name: 'Apples', category: 'produce', qty: 1, price: 10 },
      ],
    },
    {
      id: 't2', cartName: 'Weekly', storeName: 'Costco', completedAt: 200,
      budget: 20, total: 25,
      items: [{ name: 'Steak', category: 'meat', qty: 1, price: 25 }],
    },
    {
      id: 't3', cartName: 'Party', storeName: 'Aldi', completedAt: 300,
      budget: 0, total: 10,
      items: [{ name: 'Chips', category: 'snacks', qty: 1, price: 10 }],
    },
  ]

  it('totals spend and averages across every trip', () => {
    const s = insights(trips)
    assert.equal(s.tripCount, 3)
    assert.equal(s.totalSpent, 50)
    assert.equal(s.averageTrip, 50 / 3)
  })

  it('only judges budget performance on trips that had a budget', () => {
    const s = insights(trips)
    assert.equal(s.budgetedCount, 2, 'the no-budget party trip is not judged')
    assert.equal(s.underBudgetCount, 1)
  })

  it('does not net overspend against money kept back', () => {
    const s = insights(trips)
    assert.equal(s.savedVsBudget, 5, 'only the under-budget trip counts')
    assert.equal(s.overspend, 5, 'the over-budget trip is reported separately')
  })

  it('breaks spend down by category and store, biggest first', () => {
    const s = insights(trips)
    assert.deepEqual(s.byCategory.map((c) => c.id), ['meat', 'produce', 'snacks', 'dairy'])
    assert.equal(s.byCategory[0].amount, 25)
    assert.deepEqual(s.byStore.map((c) => c.id), ['Aldi', 'Costco'])
    assert.equal(s.byStore[0].amount, 25) // 5 + 10 + 10
  })

  it('returns null with no trips', () => {
    assert.equal(insights([]), null)
  })

  it('orders history newest first', () => {
    assert.deepEqual(byRecent(trips).map((t) => t.id), ['t3', 't2', 't1'])
  })
})
