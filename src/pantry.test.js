// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_PLACE,
  PLACES,
  QUICK_SETS,
  REMINDER_LEADS,
  addPantryItem,
  bucketOf,
  byPlace,
  byUrgency,
  dateInDays,
  daysUntil,
  dueItems,
  needsAttention,
  parseDate,
  placeOf,
  removePantryItem,
  reminderMessage,
  startOfDay,
  updatePantryItem,
} from './pantry.js'

// A fixed "now": 2026-03-15, mid-afternoon local time.
const NOW = new Date(2026, 2, 15, 15, 30).getTime()

describe('date handling', () => {
  it('parses a bare date as LOCAL midnight, not UTC', () => {
    const parsed = parseDate('2026-03-15')
    const d = new Date(parsed)
    assert.equal(d.getFullYear(), 2026)
    assert.equal(d.getMonth(), 2)
    assert.equal(d.getDate(), 15, 'west of Greenwich this would slip to the 14th')
    assert.equal(d.getHours(), 0)
  })

  it('rejects junk', () => {
    for (const bad of ['', 'tomorrow', '2026-03', null, undefined, 42]) {
      assert.equal(parseDate(bad), null)
    }
  })

  it('counts whole days regardless of the time of day', () => {
    assert.equal(daysUntil('2026-03-15', NOW), 0, 'today, even at 3:30pm')
    assert.equal(daysUntil('2026-03-16', NOW), 1)
    assert.equal(daysUntil('2026-03-14', NOW), -1)
    assert.equal(daysUntil('2026-03-22', NOW), 7)
    assert.equal(daysUntil(null, NOW), null)
  })

  it('gives the same answer late at night as early in the morning', () => {
    const morning = new Date(2026, 2, 15, 0, 5).getTime()
    const night = new Date(2026, 2, 15, 23, 55).getTime()
    assert.equal(daysUntil('2026-03-18', morning), daysUntil('2026-03-18', night))
  })

  it('normalises to local midnight', () => {
    assert.equal(startOfDay(NOW), new Date(2026, 2, 15).getTime())
  })
})

describe('bucketOf', () => {
  it('sorts dates into urgency bands', () => {
    assert.equal(bucketOf('2026-03-10', NOW), 'expired')
    assert.equal(bucketOf('2026-03-15', NOW), 'today')
    assert.equal(bucketOf('2026-03-17', NOW), 'soon')
    assert.equal(bucketOf('2026-03-18', NOW), 'soon', '3 days is still soon')
    assert.equal(bucketOf('2026-03-19', NOW), 'week')
    assert.equal(bucketOf('2026-03-22', NOW), 'week', '7 days is still this week')
    assert.equal(bucketOf('2026-03-23', NOW), 'later')
    assert.equal(bucketOf(null, NOW), 'none')
  })
})

describe('storage places', () => {
  it('defaults to the fridge and rejects an unknown place', () => {
    assert.equal(placeOf({ name: 'Milk' }), DEFAULT_PLACE)
    assert.equal(placeOf({ name: 'Milk', place: 'freezer' }), 'freezer')
    assert.equal(placeOf({ name: 'Milk', place: 'shed' }), DEFAULT_PLACE)
    assert.equal(placeOf(null), DEFAULT_PLACE)
  })

  it('groups by place in a fixed order, soonest first inside each', () => {
    const items = [
      { id: 'a', name: 'Peas', place: 'freezer', expiresAt: '2026-04-01' },
      { id: 'b', name: 'Milk', place: 'fridge', expiresAt: '2026-03-18' },
      { id: 'c', name: 'Yogurt', place: 'fridge', expiresAt: '2026-03-16' },
      { id: 'd', name: 'Rice', place: 'pantry', expiresAt: null },
    ]
    const groups = byPlace(items, NOW)
    assert.deepEqual(groups.map((g) => g.place.id), ['fridge', 'freezer', 'pantry'])
    assert.deepEqual(groups[0].items.map((i) => i.name), ['Yogurt', 'Milk'])
  })

  it('accounts for every item exactly once, including legacy ones', () => {
    const items = [
      { id: 'a', name: 'A', place: 'freezer', expiresAt: null },
      { id: 'b', name: 'B', expiresAt: null },
    ]
    const total = byPlace(items, NOW).reduce((n, g) => n + g.items.length, 0)
    assert.equal(total, 2)
  })

  it('has an icon and label for every place', () => {
    for (const p of PLACES) assert.ok(p.icon && p.label, `${p.id} incomplete`)
  })
})

describe('quick-set dates', () => {
  it('returns the date that many days out, zero-padded', () => {
    assert.equal(dateInDays(7, NOW), '2026-03-22')
    assert.equal(dateInDays(0, NOW), '2026-03-15')
    assert.equal(dateInDays(30, NOW), '2026-04-14', 'crosses the month end')
  })

  it('every quick set is a positive number of days', () => {
    for (const q of QUICK_SETS) {
      assert.ok(q.days > 0, `${q.id}`)
      assert.ok(q.label, `${q.id} has a label`)
    }
  })
})

describe('reminders', () => {
  const item = (name, expiresAt, remindDays) => ({ id: name, name, expiresAt, remindDays })

  it('fires only inside the lead time asked for', () => {
    const pantry = [
      item('Milk', '2026-03-16', 1), // tomorrow, 1 day warning -> due
      item('Bread', '2026-03-20', 1), // 5 days away -> not yet
      item('Cheese', '2026-03-20', 7), // 5 days away, week's warning -> due
    ]
    assert.deepEqual(dueItems(pantry, NOW).map((i) => i.name), ['Milk', 'Cheese'])
  })

  it('includes things already past their date', () => {
    assert.deepEqual(dueItems([item('Milk', '2026-03-10', 0)], NOW).map((i) => i.name), ['Milk'])
  })

  it('ignores items with reminders off or no date', () => {
    const pantry = [
      item('Rice', '2026-03-16', null),
      item('Flour', null, 1),
      { id: 'x', name: 'Odd', expiresAt: '2026-03-16' },
    ]
    assert.deepEqual(dueItems(pantry, NOW), [])
  })

  it('summarises in one line and names the overdue count', () => {
    const msg = reminderMessage(
      [item('Milk', '2026-03-10', 1), item('Bread', '2026-03-15', 1)],
      NOW,
    )
    assert.match(msg, /Milk/)
    assert.match(msg, /1 already past/)
  })

  it('folds a long list rather than reading out everything', () => {
    const many = ['A', 'B', 'C', 'D', 'E'].map((n) => item(n, '2026-03-16', 1))
    assert.match(reminderMessage(many, NOW), /and 2 more/)
  })

  it('says nothing when nothing is due', () => {
    assert.equal(reminderMessage([], NOW), null)
  })

  it('offers sensible lead times', () => {
    assert.ok(REMINDER_LEADS.some((r) => r.days === 1), 'a day before is the common one')
    for (const r of REMINDER_LEADS) assert.ok(r.label, `${r.days} needs a label`)
  })
})

describe('pantry list', () => {
  const base = () =>
    [
      { id: 'a', name: 'Yogurt', category: 'dairy', qty: 1, unit: 'tub', expiresAt: '2026-03-17' },
      { id: 'b', name: 'Milk', category: 'dairy', qty: 1, unit: 'bottle', expiresAt: '2026-03-10' },
      { id: 'c', name: 'Rice', category: 'pantry', qty: 1, unit: 'bag', expiresAt: null },
      { id: 'd', name: 'Bread', category: 'bakery', qty: 1, unit: 'pc', expiresAt: '2026-03-16' },
    ]

  it('groups by urgency, soonest first, dropping empty bands', () => {
    const groups = byUrgency(base(), NOW)
    assert.deepEqual(groups.map((g) => g.bucket.id), ['expired', 'soon', 'none'])
    assert.deepEqual(groups[1].items.map((i) => i.name), ['Bread', 'Yogurt'])
  })

  it('sorts undated items last, not as urgent', () => {
    const groups = byUrgency(base(), NOW)
    assert.equal(groups[groups.length - 1].bucket.id, 'none')
  })

  it('counts what is expired or going off within three days', () => {
    assert.equal(needsAttention(base(), NOW), 3, 'milk, bread and yogurt')
    assert.equal(needsAttention(base(), NOW, 0), 1, 'only the expired milk')
  })

  it('adds, updates and removes', () => {
    let p = addPantryItem([], { name: '  Eggs ', category: 'dairy', qty: 6, unit: 'pc', expiresAt: '2026-03-20' })
    assert.equal(p.length, 1)
    assert.equal(p[0].name, 'Eggs', 'trimmed')

    p = updatePantryItem(p, p[0].id, { expiresAt: '2026-03-25' })
    assert.equal(p[0].expiresAt, '2026-03-25')

    p = removePantryItem(p, p[0].id)
    assert.equal(p.length, 0)
  })

  it('refuses a blank name', () => {
    assert.equal(addPantryItem([], { name: '   ' }).length, 0)
    assert.equal(addPantryItem([], {}).length, 0)
  })

  it('treats an empty date string as no date', () => {
    const p = addPantryItem([], { name: 'Rice', expiresAt: '' })
    assert.equal(p[0].expiresAt, null)
    assert.equal(bucketOf(p[0].expiresAt, NOW), 'none')
  })
})
