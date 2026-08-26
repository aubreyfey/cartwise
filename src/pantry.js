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

export function addPantryItem(pantry, { name, category, qty, unit, expiresAt }) {
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
