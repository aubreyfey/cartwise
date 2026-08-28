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
 * Where each item is cheapest, and what buying it there instead of all in one
 * shop would save.
 *
 * Only items priced at two or more stores can be compared, so everything else
 * is counted as `unknown` and reported rather than quietly dropped — a saving
 * figure that ignores most of the list is worse than no figure.
 */
export function splitShop(stores = [], vault = [], items = []) {
  if (stores.length < 2 || items.length === 0) return null

  const lines = []
  let unknown = 0

  for (const item of items) {
    const vaultItem = findVaultItem(vault, item.name)
    const priced = stores
      .map((store) => ({ store, price: priceFor(vaultItem, store.id, { strict: true }) }))
      .filter((p) => p.price !== null)

    if (priced.length < 2) {
      unknown += 1
      continue
    }

    const sorted = [...priced].sort((a, b) => a.price - b.price)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    lines.push({
      item,
      store: best.store,
      price: best.price,
      cost: best.price * item.qty,
      // What you would pay buying it at the dearest shop instead.
      saving: (worst.price - best.price) * item.qty,
      prices: sorted,
    })
  }

  if (lines.length === 0) return null

  // Group the split shop by store.
  const byStore = new Map()
  for (const line of lines) {
    if (!byStore.has(line.store.id)) byStore.set(line.store.id, { store: line.store, lines: [], total: 0 })
    const group = byStore.get(line.store.id)
    group.lines.push(line)
    group.total += line.cost
  }

  const splitTotal = lines.reduce((sum, l) => sum + l.cost, 0)

  // The fairest comparison is against the best you could do in one shop, not
  // against the worst: nobody deliberately shops at the dearest store.
  const singleTotals = stores.map((store) => {
    const total = lines.reduce((sum, l) => {
      const here = l.prices.find((p) => p.store.id === store.id)
      // A store missing a price for one item cannot host the whole shop.
      return here ? sum + here.price * l.item.qty : Number.POSITIVE_INFINITY
    }, 0)
    return { store, total }
  })
  const bestSingle = singleTotals
    .filter((s) => Number.isFinite(s.total))
    .sort((a, b) => a.total - b.total)[0]

  return {
    groups: [...byStore.values()].sort((a, b) => b.total - a.total),
    comparable: lines.length,
    unknown,
    splitTotal,
    bestSingle: bestSingle ?? null,
    saving: bestSingle ? bestSingle.total - splitTotal : 0,
  }
}

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

/**
 * Remember where a shop is.
 *
 * Per shop, not per trip. "Savemore is at these coordinates" is a fact about a
 * supermarket and makes every future visit useful; a coordinate stamped on
 * each trip would be a record of where you were and when, which CartWise has
 * no use for and should not hold.
 */
export function setStoreLocation(stores, id, location) {
  return stores.map((s) => (s.id === id ? { ...s, location } : s))
}

/** Forget it again. */
export const clearStoreLocation = (stores, id) =>
  stores.map((s) => (s.id === id ? { ...s, location: null } : s))
