// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  BUCKETS,
  DAY,
  QUICK_SETS,
  REMINDER_LEADS,
  activePantry,
  addPantryItem,
  bucketOf,
  byUrgency,
  dateInDays,
  dueItems,
  needsAttention,
  reopenPantryItem,
  resolvePantryItem,
  resolvedPantry,
  wasteStats,
} from './pantry.js'

const NOW = new Date('2026-08-27T09:00:00').getTime()
const at = (days) => dateInDays(days, NOW)

const stock = (overrides = {}) =>
  addPantryItem([], {
    name: 'Fresh Milk',
    category: 'dairy',
    qty: 2,
    unit: 'bottle',
    expiresAt: at(3),
    place: 'fridge',
    remindDays: 1,
    ...overrides,
  })[0]

describe('inventory record', () => {
  it('links to the product and the purchase it came from', () => {
    // Product = what it is, Purchase = the time it was bought, this = the
    // physical thing in the fridge. All three, or waste analytics has nothing
    // to join on.
    const item = stock({ productId: 'v-milk', purchaseId: 'pu-9', unitPrice: 89 })
    assert.equal(item.productId, 'v-milk')
    assert.equal(item.purchaseId, 'pu-9')
    assert.equal(item.unitPrice, 89)
  })

  it('still accepts something never bought through the app', () => {
    // "Leftovers" typed straight into the Expiry screen has no product.
    const item = stock()
    assert.equal(item.productId, null)
    assert.equal(item.purchaseId, null)
  })

  it('starts active', () => {
    assert.equal(stock().status, 'active')
    assert.equal(stock().resolvedAt, null)
  })

  it('copies the price rather than pointing at the Vault', () => {
    // The Vault price will have moved on by the time anything is thrown out;
    // what it cost *then* is what a money-wasted figure needs.
    assert.equal(stock({ unitPrice: 89 }).unitPrice, 89)
  })
})

describe('consumed and discarded', () => {
  const pantry = [
    stock({ name: 'Milk' }),
    stock({ name: 'Bread', category: 'bakery' }),
    stock({ name: 'Lettuce', category: 'produce' }),
  ]

  it('takes a resolved item out of the active list but keeps the record', () => {
    const next = resolvePantryItem(pantry, pantry[0].id, 'consumed', NOW)
    assert.equal(activePantry(next).length, 2)
    assert.equal(next.length, 3, 'nothing is deleted')
    assert.equal(resolvedPantry(next).length, 1)
  })

  it('stamps when it happened', () => {
    const next = resolvePantryItem(pantry, pantry[0].id, 'discarded', NOW)
    assert.equal(next[0].resolvedAt, NOW)
  })

  it('refuses a status that is not one of the two', () => {
    assert.deepEqual(resolvePantryItem(pantry, pantry[0].id, 'eaten-ish'), pantry)
  })

  it('can be undone', () => {
    let next = resolvePantryItem(pantry, pantry[0].id, 'discarded', NOW)
    next = reopenPantryItem(next, pantry[0].id)
    assert.equal(activePantry(next).length, 3)
    assert.equal(next[0].resolvedAt, null)
  })

  it('treats items saved before status existed as active', () => {
    const legacy = [{ id: 'old', name: 'Eggs', expiresAt: at(2) }]
    assert.equal(activePantry(legacy).length, 1)
  })

  it('stops a resolved item shouting from the urgency list', () => {
    // Something eaten last week must not still be reported as expiring.
    const overdue = [stock({ name: 'Milk', expiresAt: at(-2) })]
    assert.equal(needsAttention(overdue, NOW), 1)

    const resolved = resolvePantryItem(overdue, overdue[0].id, 'consumed', NOW)
    assert.equal(needsAttention(resolved, NOW), 0)
    assert.equal(byUrgency(resolved, NOW).length, 0)
    assert.equal(dueItems(resolved, NOW).length, 0)
  })
})

describe('buckets', () => {
  it('separates tomorrow from the next three days', () => {
    // "In 1 day" and "in 3 days" are different kinds of urgent; lumping them
    // reads as alarmist.
    assert.equal(bucketOf(at(0), NOW), 'today')
    assert.equal(bucketOf(at(1), NOW), 'tomorrow')
    assert.equal(bucketOf(at(2), NOW), 'soon')
    assert.equal(bucketOf(at(3), NOW), 'soon')
    assert.equal(bucketOf(at(5), NOW), 'week')
    assert.equal(bucketOf(at(30), NOW), 'later')
    assert.equal(bucketOf(at(-1), NOW), 'expired')
    assert.equal(bucketOf(null, NOW), 'none')
  })

  it('has a bucket defined for every value bucketOf can return', () => {
    const ids = new Set(BUCKETS.map((b) => b.id))
    for (const days of [-5, 0, 1, 2, 3, 5, 7, 40]) {
      assert.ok(ids.has(bucketOf(at(days), NOW)), `${days} days`)
    }
    assert.ok(ids.has(bucketOf(null, NOW)))
  })
})

describe('quick sets and reminders', () => {
  it('offers the shortcuts as offsets, never as fixed dates', () => {
    for (const q of QUICK_SETS) {
      assert.ok(Number.isFinite(q.days) && q.days > 0, `${q.id} is a real offset`)
      assert.match(dateInDays(q.days, NOW), /^\d{4}-\d{2}-\d{2}$/)
    }
    assert.ok(QUICK_SETS.some((q) => q.days === 90), 'three months is on offer')
  })

  it('computes the shortcut date from now rather than hard-coding it', () => {
    const a = dateInDays(7, NOW)
    const b = dateInDays(7, NOW + 30 * DAY)
    assert.notEqual(a, b)
  })

  it('lets a reminder be switched off explicitly', () => {
    assert.ok(REMINDER_LEADS.some((l) => l.days === null), '"No reminder" is an option')
    assert.ok(REMINDER_LEADS.some((l) => l.days === 2), 'two days before is offered')
  })

  it('never reminds about an item with reminders off', () => {
    const quiet = [stock({ expiresAt: at(0), remindDays: null })]
    assert.equal(dueItems(quiet, NOW).length, 0)
  })
})

describe('wasteStats', () => {
  const built = () => {
    let p = [
      stock({ name: 'Milk', unitPrice: 89, qty: 2, expiresAt: at(-1) }),
      stock({ name: 'Lettuce', category: 'produce', unitPrice: 60, qty: 1, expiresAt: at(-2) }),
      stock({ name: 'Bread', category: 'bakery', unitPrice: 74, qty: 1 }),
      stock({ name: 'Cheese', unitPrice: 165, qty: 1 }),
    ]
    p = resolvePantryItem(p, p[0].id, 'discarded', NOW)
    p = resolvePantryItem(p, p[1].id, 'discarded', NOW)
    p = resolvePantryItem(p, p[2].id, 'consumed', NOW)
    return p
  }

  it('says nothing until something has been resolved', () => {
    // A waste rate computed from no data is not zero, it is unknown.
    assert.equal(wasteStats([]), null)
    assert.equal(wasteStats([stock()]), null)
  })

  it('counts eaten against thrown out', () => {
    const stats = wasteStats(built())
    assert.equal(stats.consumed, 1)
    assert.equal(stats.discarded, 2)
    assert.equal(stats.total, 3)
    assert.ok(Math.abs(stats.wasteRate - 2 / 3) < 0.001)
  })

  it('values the waste at what it cost, times how much of it there was', () => {
    // 2 bottles at 89 plus 1 lettuce at 60.
    assert.equal(wasteStats(built()).wastedValue, 89 * 2 + 60)
  })

  it('ignores the price of what was eaten', () => {
    const stats = wasteStats(built())
    assert.ok(stats.wastedValue < 89 * 2 + 60 + 74, 'the eaten bread is not waste')
  })

  it('separates thrown out past its date from cleared out early', () => {
    const stats = wasteStats(built())
    assert.equal(stats.expiredWhenDiscarded, 2)
  })

  it('ranks what gets wasted most', () => {
    const stats = wasteStats(built())
    assert.equal(stats.mostWastedCategories[0].count, 1)
    assert.ok(stats.mostWastedProducts.length === 2)
  })

  it('copes with waste that has no recorded price', () => {
    let p = [stock({ name: 'Mystery', unitPrice: null })]
    p = resolvePantryItem(p, p[0].id, 'discarded', NOW)
    assert.equal(wasteStats(p).wastedValue, 0)
  })

  it('measures how long things are held, and never reports a negative', () => {
    // addPantryItem stamps addedAt from the real clock, so this fixture holds
    // items "resolved" before they were added. The figure has to survive that
    // rather than going negative.
    const stats = wasteStats(built())
    assert.ok(stats.averageDaysHeld !== null)
    assert.ok(stats.averageDaysHeld >= 0, 'clamped at zero')
  })
})
