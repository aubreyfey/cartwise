// Completing a trip archives what you actually bought. Trips are the record
// the insights are computed from — nothing here is editable after the fact.

import { newId } from './carts.js'
import { isKnownPrice, sumLines } from './money.js'

/**
 * Snapshot the checked items of a cart as a completed trip.
 * Returns null when nothing is checked — there's no trip to record.
 *
 * Prices are copied in, not referenced, so later Vault price changes never
 * rewrite what a past trip cost.
 */
export function completeTrip(cart, store, at = Date.now()) {
  const bought = cart.items.filter((i) => i.checked)
  if (bought.length === 0) return null

  const items = bought.map(({ name, category, qty, price, unit, impulse }) => ({
    name,
    category,
    qty,
    price,
    unit,
    // Added to the list while already shopping — i.e. not something you
    // planned before walking in.
    impulse: impulse === true,
  }))

  // Items bought without a price still belong in the record — they were in
  // the basket — but they can't contribute to the total, so the count is
  // carried alongside it rather than folded in as zero.
  const { total, unpriced } = sumLines(items)
  const impulseItems = items.filter((i) => i.impulse)
  const { total: impulseTotal } = sumLines(impulseItems)

  return {
    id: newId(),
    cartName: cart.name,
    storeId: store?.id ?? null,
    storeName: store?.name ?? null,
    completedAt: at,
    budget: cart.budget ?? 0,
    total,
    unpriced,
    impulseCount: impulseItems.length,
    impulseTotal,
    // Items you'd planned before the trip and actually came home with.
    plannedBought: items.length - impulseItems.length,
    items,
  }
}

const sumBy = (rows, key) => {
  const totals = new Map()
  for (const row of rows) {
    totals.set(row[key], (totals.get(row[key]) ?? 0) + row.amount)
  }
  return [...totals.entries()]
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Aggregate stats over completed trips.
 *
 * `underBudget` only counts trips that actually had a budget set — a trip
 * with no budget isn't "under" it, and counting it as a win would inflate
 * the number that's supposed to mean something.
 */
export function insights(trips) {
  if (trips.length === 0) return null

  const lines = trips.flatMap((t) =>
    t.items
      .filter((i) => isKnownPrice(i.price))
      .map((i) => ({
        category: i.category,
        store: t.storeName ?? 'No store',
        amount: i.price * i.qty,
      })),
  )

  const budgeted = trips.filter((t) => t.budget > 0)
  const underBudget = budgeted.filter((t) => t.total <= t.budget)
  const totalSpent = trips.reduce((sum, t) => sum + t.total, 0)

  // Older trips predate impulse tracking, so they carry no impulse fields.
  // They're left out of the share entirely rather than counted as 100%
  // planned, which would flatter the number.
  const tracked = trips.filter((t) => typeof t.impulseCount === 'number')
  const trackedItems = tracked.reduce((n, t) => n + t.items.length, 0)
  const impulseItems = tracked.reduce((n, t) => n + t.impulseCount, 0)
  const impulseSpend = tracked.reduce((n, t) => n + (t.impulseTotal ?? 0), 0)

  return {
    tripCount: trips.length,
    totalSpent,
    averageTrip: totalSpent / trips.length,
    byCategory: sumBy(lines, 'category'),
    byStore: sumBy(lines, 'store'),
    budgetedCount: budgeted.length,
    underBudgetCount: underBudget.length,
    // Total kept back across the trips that came in under budget. Trips that
    // went over are excluded rather than netted off — this is "money not
    // spent against a plan", not a profit-and-loss figure.
    savedVsBudget: underBudget.reduce((sum, t) => sum + (t.budget - t.total), 0),
    overspend: budgeted
      .filter((t) => t.total > t.budget)
      .reduce((sum, t) => sum + (t.total - t.budget), 0),

    trackedTrips: tracked.length,
    impulseItems,
    impulseSpend,
    // Share of bought items that were on the list before you set off.
    plannedShare: trackedItems > 0 ? (trackedItems - impulseItems) / trackedItems : null,
  }
}

/** Newest first — the order the history list shows. */
export const byRecent = (trips) =>
  [...trips].sort((a, b) => b.completedAt - a.completedAt)
