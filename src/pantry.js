// What you already own and when it goes off. Dates are stored as plain
// 'YYYY-MM-DD' strings, the format <input type="date"> gives us, and compared
// at day granularity — an item that expires today isn't "0.4 days away", it
// expires today wherever you are.

import { newId } from './carts.js'
import { DEFAULT_UNIT } from './units.js'

export const DAY = 86400000

/** Local midnight for a timestamp — the reference point for "today". */
export function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 'YYYY-MM-DD' to a local-midnight timestamp.
 *
 * Deliberately not `new Date(str)` — that parses a bare date as UTC, so west
 * of Greenwich everything reads as expiring a day early.
 */
export function parseDate(str) {
  if (typeof str !== 'string') return null
  const parts = str.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  const [y, m, d] = parts
  return new Date(y, m - 1, d).getTime()
}

/** Whole days from today until the date. Negative means already past. */
export function daysUntil(dateStr, now = Date.now()) {
  const at = parseDate(dateStr)
  if (at === null) return null
  return Math.round((at - startOfDay(now)) / DAY)
}

// Where a thing is kept. Same milk, very different shelf life depending on
// whether it is in the fridge or the freezer, and "what is in the fridge" is
// the question people actually ask.
export const PLACES = [
  { id: 'fridge', label: 'Fridge', icon: 'fridge' },
  { id: 'freezer', label: 'Freezer', icon: 'snowflake' },
  { id: 'pantry', label: 'Pantry', icon: 'shelf' },
  { id: 'counter', label: 'Counter', icon: 'house' },
  { id: 'storage', label: 'Storage', icon: 'box' },
  { id: 'other', label: 'Other', icon: 'basket' },
]

export const DEFAULT_PLACE = 'fridge'

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]))

/** Items stored before places existed fall to the fridge rather than vanishing. */
export const placeOf = (item) =>
  PLACE_BY_ID[item?.place] ? item.place : DEFAULT_PLACE

/** Group by where it is kept, in PLACES order, dropping empty places. */
export function byPlace(pantry = [], now = Date.now()) {
  return PLACES.map((place) => ({
    place,
    items: pantry
      .filter((item) => placeOf(item) === place.id)
      .sort((a, b) => {
        const da = daysUntil(a.expiresAt, now)
        const db = daysUntil(b.expiresAt, now)
        if (da === null && db === null) return a.name.localeCompare(b.name)
        if (da === null) return 1
        if (db === null) return -1
        return da - db || a.name.localeCompare(b.name)
      }),
  })).filter((group) => group.items.length > 0)
}

// One tap instead of wrestling a date picker for the common cases.
export const QUICK_SETS = [
  { id: '3d', label: '3 days', days: 3 },
  { id: '1w', label: '1 week', days: 7 },
  { id: '2w', label: '2 weeks', days: 14 },
  { id: '1m', label: '1 month', days: 30 },
]

/** A date `days` from now, in the 'YYYY-MM-DD' form the date input wants. */
export function dateInDays(days, from = Date.now()) {
  const d = new Date(startOfDay(from) + days * DAY)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// How much warning you want. null means no reminder for that item.
export const REMINDER_LEADS = [
  { days: 0, label: 'On the day' },
  { days: 1, label: 'A day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: 'A week before' },
]

/**
 * Items whose reminder is due: the use-by is within the lead time the user
 * asked for, including ones already past. Undated items and items with
 * reminders switched off never appear.
 */
export function dueItems(pantry = [], now = Date.now()) {
  return pantry.filter((item) => {
    if (typeof item?.remindDays !== 'number') return false
    const days = daysUntil(item.expiresAt, now)
    return days !== null && days <= item.remindDays
  })
}

/** One line summarising what needs eating, for a notification body. */
export function reminderMessage(items = [], now = Date.now()) {
  if (items.length === 0) return null
  const names = items.slice(0, 3).map((i) => i.name)
  const rest = items.length - names.length
  const list = rest > 0 ? `${names.join(', ')} and ${rest} more` : names.join(', ')
  const past = items.filter((i) => (daysUntil(i.expiresAt, now) ?? 0) < 0).length
  return past > 0
    ? `${list}. ${past} already past its date.`
    : `${list}. Use them before they turn.`
}

export const BUCKETS = [
  { id: 'expired', label: 'Expired', tone: 'bad' },
  { id: 'today', label: 'Today', tone: 'bad' },
  { id: 'soon', label: 'Next 3 days', tone: 'warn' },
  { id: 'week', label: 'This week', tone: 'warn' },
  { id: 'later', label: 'Later', tone: 'ok' },
  { id: 'none', label: 'No date', tone: 'ok' },
]

export function bucketOf(dateStr, now = Date.now()) {
  const days = daysUntil(dateStr, now)
  if (days === null) return 'none'
  if (days < 0) return 'expired'
  if (days === 0) return 'today'
  if (days <= 3) return 'soon'
  if (days <= 7) return 'week'
  return 'later'
}

// Rough shelf life by aisle, used only to pre-fill a date you can then edit.
// Anything not listed here gets no suggestion at all — a wrong guess on a
// tin of beans is worse than leaving the field blank.
const SHELF_LIFE_DAYS = {
  produce: 7,
  bakery: 4,
  meat: 3,
  dairy: 10,
  frozen: 90,
}

export const isPerishable = (category) => category in SHELF_LIFE_DAYS

/** Suggested use-by date for a category, or null if we shouldn't guess. */
export function suggestedExpiry(category, from = Date.now()) {
  const days = SHELF_LIFE_DAYS[category]
  if (days === undefined) return null
  const d = new Date(startOfDay(from) + days * DAY)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addPantryItem(
  pantry,
  { name, category, qty, unit, expiresAt, place, remindDays },
) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return pantry
  return [
    ...pantry,
    {
      id: newId(),
      name: trimmed,
      category: category ?? 'other',
      qty: qty ?? 1,
      unit: unit ?? DEFAULT_UNIT,
      expiresAt: expiresAt || null,
      place: PLACE_BY_ID[place] ? place : DEFAULT_PLACE,
      // A number means remind me that many days ahead; null means don't.
      remindDays: typeof remindDays === 'number' ? remindDays : null,
      addedAt: Date.now(),
    },
  ]
}

export const removePantryItem = (pantry, id) => pantry.filter((p) => p.id !== id)

export function updatePantryItem(pantry, id, patch) {
  return pantry.map((p) => (p.id === id ? { ...p, ...patch } : p))
}

/**
 * Group into urgency buckets, soonest first within each, dropping empties.
 * Undated items sort to the end rather than being treated as urgent.
 */
export function byUrgency(pantry, now = Date.now()) {
  const groups = new Map(BUCKETS.map((b) => [b.id, []]))
  for (const item of pantry) {
    groups.get(bucketOf(item.expiresAt, now)).push(item)
  }

  return BUCKETS.map((bucket) => ({
    bucket,
    items: groups.get(bucket.id).sort((a, b) => {
      const da = daysUntil(a.expiresAt, now)
      const db = daysUntil(b.expiresAt, now)
      if (da === null && db === null) return a.name.localeCompare(b.name)
      if (da === null) return 1
      if (db === null) return -1
      return da - db || a.name.localeCompare(b.name)
    }),
  })).filter((g) => g.items.length > 0)
}

/** How many things need eating in the next `withinDays` days, or are already past. */
export function needsAttention(pantry, now = Date.now(), withinDays = 3) {
  return pantry.filter((p) => {
    const days = daysUntil(p.expiresAt, now)
    return days !== null && days <= withinDays
  }).length
}
