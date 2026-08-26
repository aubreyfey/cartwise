import { findVaultItem, priceFor } from './vault.js'

// Assigned round-robin so each store reads distinctly in the chip row.
const COLORS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2']

export const colorForIndex = (i) => COLORS[i % COLORS.length]

export function addStore(stores, name) {
  const trimmed = name.trim()
  if (!trimmed) return stores
  // Same store twice is always a mistake, not an intent.
  if (stores.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
    return stores
  }
  return [
    ...stores,
    {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: trimmed,
    },
  ]
}

export const removeStore = (stores, id) => stores.filter((s) => s.id !== id)

/**
 * Total the current list at every store, for the subset of items that have a
 * real price at *all* of them.
 *
 * Restricting to that overlap is the whole point: totalling each store over
 * whatever it happens to know would call a store cheapest merely because it
 * has fewer prices on file. `comparable` and `total` are both returned so the
 * UI can say how much of the list the comparison actually covers.
 *
 * Returns null when there's nothing meaningful to compare.
 */
export function compareStores(stores, vault, items) {
  if (stores.length < 2 || items.length === 0) return null

  const priced = []
  for (const item of items) {
    const vaultItem = findVaultItem(vault, item.name)
    if (!vaultItem) continue

    const perStore = stores.map((s) => priceFor(vaultItem, s.id, { strict: true }))
    if (perStore.some((p) => p === null)) continue // not priced everywhere — skip

    priced.push({ qty: item.qty, perStore })
  }

  if (priced.length === 0) return null

  const totals = stores.map((store, i) => ({
    store,
    total: priced.reduce((sum, p) => sum + p.perStore[i] * p.qty, 0),
  }))

  const sorted = [...totals].sort((a, b) => a.total - b.total)
  const cheapest = sorted[0]
  const dearest = sorted[sorted.length - 1]

  return {
    totals,
    cheapest,
    savings: dearest.total - cheapest.total,
    comparable: priced.length,
    total: items.length,
  }
}
