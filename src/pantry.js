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
export function byPlace(rawPantry = [], now = Date.now()) {
  const pantry = activePantry(rawPantry)
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
  { id: '3m', label: '3 months', days: 90 },
]

/** A date `days` from now, in the 'YYYY-MM-DD' form the date input wants. */
export function dateInDays(days, from = Date.now()) {
  const d = new Date(startOfDay(from) + days * DAY)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// How much warning you want. null means no reminder for that item.
export const REMINDER_LEADS = [
  { days: null, label: 'No reminder' },
  { days: 0, label: 'On the day' },
  { days: 1, label: 'A day before' },
  { days: 2, label: '2 days before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: 'A week before' },
]

/**
 * Items whose reminder is due: the use-by is within the lead time the user
 * asked for, including ones already past. Undated items and items with
 * reminders switched off never appear.
 */
export function dueItems(rawPantry = [], now = Date.now()) {
  const pantry = activePantry(rawPantry)
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
  { id: 'tomorrow', label: 'Tomorrow', tone: 'warn' },
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
  if (days === 1) return 'tomorrow'
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
  { name, category, qty, unit, expiresAt, place, remindDays, productId, purchaseId, unitPrice },
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
      // What this is, and the particular time it was bought. The Vault entry is
      // the reusable product; the purchase is one shop; this is the physical
      // thing in the fridge. Nullable, because you can also just type
      // "leftovers" straight into the Expiry screen and never have bought it.
      productId: productId ?? null,
      purchaseId: purchaseId ?? null,
      // Copied, not looked up: what it cost when you bought it is what a
      // future "money wasted" figure has to be based on, and the Vault price
      // will have moved on by then.
      unitPrice: typeof unitPrice === 'number' ? unitPrice : null,
      // 'active' until it is eaten or thrown out. Resolved items leave the
      // active views but stay in the array — throwing the record away would
      // throw away the only evidence of what gets wasted.
      status: 'active',
      resolvedAt: null,
      addedAt: Date.now(),
    },
  ]
}

/** Items still in the house. Anything stored before status existed counts. */
export const activePantry = (pantry = []) =>
  pantry.filter((p) => (p.status ?? 'active') === 'active')

export const resolvedPantry = (pantry = []) =>
  pantry.filter((p) => p.status === 'consumed' || p.status === 'discarded')

/**
 * Eaten, or thrown out. Both leave the active list; only one of them is a
 * loss, and keeping them distinct is the whole point of recording either.
 */
export function resolvePantryItem(pantry, id, status, at = Date.now()) {
  if (status !== 'consumed' && status !== 'discarded') return pantry
  return pantry.map((p) => (p.id === id ? { ...p, status, resolvedAt: at } : p))
}

/** Back to the fridge — for an item resolved by mistake. */
export const reopenPantryItem = (pantry, id) =>
  pantry.map((p) => (p.id === id ? { ...p, status: 'active', resolvedAt: null } : p))

/**
 * The raw material for food-waste insights. Deliberately just counts and
 * sums — the analytics can be built later, but only if the data survives now.
 */
export function wasteStats(pantry = []) {
  const resolved = resolvedPantry(pantry)
  if (resolved.length === 0) return null

  let consumed = 0
  let discarded = 0
  let wastedValue = 0
  let expiredWhenDiscarded = 0
  const byProduct = new Map()
  const byCategory = new Map()
  let shelfDaysTotal = 0
  let shelfDaysCount = 0

  for (const item of resolved) {
    if (item.status === 'consumed') {
      consumed += 1
      continue
    }
    discarded += 1

    const value = (item.unitPrice ?? 0) * (item.qty ?? 1)
    if (Number.isFinite(value)) wastedValue += value

    // Thrown out on or after its use-by, as opposed to cleared out early.
    if (item.expiresAt && item.resolvedAt && startOfDay(item.resolvedAt) >= startOfDay(parseDate(item.expiresAt))) {
      expiredWhenDiscarded += 1
    }

    const key = item.productId ?? item.name
    byProduct.set(key, (byProduct.get(key) ?? 0) + 1)
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1)
  }

  // How long things actually last between buying and using them up.
  for (const item of resolved) {
    if (!item.addedAt || !item.resolvedAt) continue
    // Clamped: a device clock that moved backwards must not report that
    // something was used up before it was bought.
    shelfDaysTotal += Math.max(0, (item.resolvedAt - item.addedAt) / DAY)
    shelfDaysCount += 1
  }

  const rank = (map) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }))

  return {
    consumed,
    discarded,
    total: consumed + discarded,
    // Of everything resolved, how much was thrown away.
    wasteRate: consumed + discarded > 0 ? discarded / (consumed + discarded) : 0,
    wastedValue,
    expiredWhenDiscarded,
    mostWastedProducts: rank(byProduct),
    mostWastedCategories: rank(byCategory),
    averageDaysHeld: shelfDaysCount > 0 ? shelfDaysTotal / shelfDaysCount : null,
  }
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
  // Active only: something eaten last week must not still be shouting that it
  // expired, and something thrown out is not going to need eating.
  for (const item of activePantry(pantry)) {
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
  return activePantry(pantry).filter((p) => {
    const days = daysUntil(p.expiresAt, now)
    return days !== null && days <= withinDays
  }).length
}
