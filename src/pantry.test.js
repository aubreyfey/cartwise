// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  addPantryItem,
  bucketOf,
  byUrgency,
  daysUntil,
  needsAttention,
  parseDate,
  removePantryItem,
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
