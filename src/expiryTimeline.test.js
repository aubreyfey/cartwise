// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  chipLabel,
  dayLabel,
  initialOffset,
  relativeDay,
  timelineDays,
  toneFor,
  undatedItems,
} from './expiryTimeline.js'
import { DAY, resolvePantryItem, startOfDay } from './pantry.js'

// A fixed "now" so the tests do not drift with the clock.
const NOW = new Date(2026, 7, 28, 14, 30).getTime()
const iso = (offset) => {
  const d = new Date(startOfDay(NOW) + offset * DAY)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const item = (name, offset, extra = {}) => ({
  id: `p-${name}`,
  name,
  expiresAt: iso(offset),
  qty: 1,
  unit: 'pc',
  ...extra,
})

const pantry = [
  item('Milk', -2),
  item('Bread', 0),
  item('Yogurt', 0),
  item('Chicken', 2),
  item('Cheese', 9),
  item('Beans', 400),
]

describe('toneFor', () => {
  it('marks the past as gone off', () => {
    assert.equal(toneFor(-1), 'over')
  })

  it('marks the next three days as soon', () => {
    assert.equal(toneFor(0), 'soon')
    assert.equal(toneFor(3), 'soon')
  })

  it('marks anything further out as fine', () => {
    assert.equal(toneFor(4), 'ok')
  })

  it('has no opinion about a missing date', () => {
    assert.equal(toneFor(null), null)
  })
})

describe('timelineDays', () => {
  const days = timelineDays(pantry, { now: NOW })
  const at = (offset) => days.find((d) => d.offset === offset)

  it('is in date order', () => {
    const offsets = days.map((d) => d.offset)
    assert.deepEqual(offsets, [...offsets].sort((a, b) => a - b))
  })

  it('puts each item on its own day', () => {
    assert.deepEqual(at(-2).items.map((i) => i.name), ['Milk'])
    assert.deepEqual(at(2).items.map((i) => i.name), ['Chicken'])
  })

  it('sorts several things on one day by name', () => {
    assert.deepEqual(at(0).items.map((i) => i.name), ['Bread', 'Yogurt'])
  })

  it('keeps empty days inside the window', () => {
    // A gap in the week is information: "nothing goes off Thursday" is
    // different from "Thursday is off the end of the list".
    assert.equal(at(1).count, 0)
    assert.equal(at(1).tone, null)
  })

  it('reaches past the window for a day that has something in it', () => {
    // The tin of beans is real. Hiding it because it is far away would be a
    // lie about what is being tracked.
    assert.equal(at(400).count, 1)
  })

  it('does not invent days beyond the window that are empty', () => {
    assert.equal(at(60), undefined)
    assert.equal(at(399), undefined)
  })

  it('takes its tone from the day, not the item', () => {
    assert.equal(at(-2).tone, 'over')
    assert.equal(at(0).tone, 'soon')
    assert.equal(at(9).tone, 'ok')
  })

  it('ignores items that have been eaten or thrown out', () => {
    const withResolved = [...pantry, item('Eaten', 0, { status: 'consumed', resolvedAt: NOW })]
    const d = timelineDays(withResolved, { now: NOW }).find((x) => x.offset === 0)
    assert.equal(d.count, 2, 'a resolved item should not still be on the rail')
  })

  it('leaves out items whose date cannot be read, rather than filing them under today', () => {
    const broken = [...pantry, item('Mystery', 0, { expiresAt: 'not-a-date' })]
    const d = timelineDays(broken, { now: NOW }).find((x) => x.offset === 0)
    assert.equal(d.count, 2)
  })

  it('still produces a window for an empty pantry', () => {
    const days = timelineDays([], { now: NOW })
    assert.ok(days.length > 20)
    assert.ok(days.every((d) => d.count === 0))
  })

  it('survives being called with nothing', () => {
    assert.ok(Array.isArray(timelineDays()))
  })
})

describe('undatedItems', () => {
  it('surfaces what the timeline cannot place', () => {
    const broken = [...pantry, item('Mystery', 0, { expiresAt: 'not-a-date' })]
    assert.deepEqual(undatedItems(broken).map((i) => i.name), ['Mystery'])
  })

  it('is empty when every date is readable', () => {
    assert.deepEqual(undatedItems(pantry), [])
  })
})

describe('initialOffset', () => {
  it('opens on the first thing that needs attention', () => {
    // That is why someone opened this screen.
    const days = timelineDays(pantry, { now: NOW })
    assert.equal(initialOffset(days), -2)
  })

  it('opens on today when nothing is urgent', () => {
    const calm = timelineDays([item('Beans', 30)], { now: NOW })
    assert.equal(initialOffset(calm), 0)
  })

  it('opens on today for an empty pantry', () => {
    assert.equal(initialOffset(timelineDays([], { now: NOW })), 0)
  })

  it('copes with no days at all', () => {
    assert.equal(initialOffset([]), 0)
  })
})

describe('labels', () => {
  const today = startOfDay(NOW)

  it('names today rather than its weekday', () => {
    assert.equal(chipLabel(0, today), 'Today')
    assert.equal(dayLabel(0, today), 'Today')
  })

  it('names the near days in words', () => {
    assert.equal(dayLabel(1, today + DAY), 'Tomorrow')
    assert.equal(dayLabel(-1, today - DAY), 'Yesterday')
  })

  it('falls back to weekday and date further out', () => {
    assert.match(dayLabel(5, today + 5 * DAY), /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d{1,2}$/)
    assert.match(chipLabel(5, today + 5 * DAY), /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/)
  })

  it('reads naturally in a sentence', () => {
    assert.equal(relativeDay(0), 'today')
    assert.equal(relativeDay(1), 'tomorrow')
    assert.equal(relativeDay(-1), 'yesterday')
    assert.equal(relativeDay(-4), '4 days ago')
    assert.equal(relativeDay(6), 'in 6 days')
  })
})

describe('the statuses the timeline writes', () => {
  it('are ones resolvePantryItem will actually accept', () => {
    // The timeline's two buttons send these. resolvePantryItem returns the
    // pantry UNCHANGED for anything else — no error, no warning — so a typo
    // here is a button that silently does nothing. That is exactly what the
    // first draft shipped with ('eaten' / 'wasted').
    const before = [item('Milk', 0)]
    for (const status of ['consumed', 'discarded']) {
      const after = resolvePantryItem(before, before[0].id, status)
      assert.equal(after[0].status, status, `resolvePantryItem ignored ${status}`)
    }
  })

  it('proves the rejected ones really are silently ignored', () => {
    const before = [item('Milk', 0)]
    const after = resolvePantryItem(before, before[0].id, 'eaten')
    assert.equal(after[0].status, undefined)
    assert.equal(after, before, 'the whole array comes back untouched')
  })
})
