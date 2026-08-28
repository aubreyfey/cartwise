// What your Vault knows, summarised.
//
// The Vault is the best idea in CartWise and the worst screen: it is the only
// part that gets more valuable the longer you use it, and nothing anywhere
// showed it growing or let you answer the question you would actually ask it —
// "what do I usually pay for this?" — without opening every product one at a
// time.
//
// This is the arithmetic behind fixing that. Everything is derived from the
// purchase log, so nothing here can claim knowledge the app does not have.

import { isKnownPrice } from './money.js'
import { historyFor, priceStats, storeComparison } from './purchases.js'

const DAY = 86_400_000

/**
 * The headline: how much this Vault actually knows.
 *
 * Counts of products and recorded prices rather than a money figure, because
 * "the Vault is worth ₱4,000" is not a thing that means anything.
 */
export function vaultSummary(vault = [], purchases = []) {
  const priced = purchases.filter((p) => isKnownPrice(p.price))

  const shops = new Set()
  const products = new Set()
  for (const p of priced) {
    if (p.storeId) shops.add(p.storeId)
    if (p.productId) products.add(p.productId)
  }

  // Products with enough history to say anything about a trend.
  let withHistory = 0
  for (const item of vault) {
    if (historyFor(purchases, item.id).length > 1) withHistory += 1
  }

  return {
    products: vault.length,
    pricesRecorded: priced.length,
    shops: shops.size,
    withHistory,
    // Products the Vault has a price for at all, which is what makes an
    // estimate possible.
    priced: products.size,
  }
}

/**
 * One row per product, with everything the screen wants to show without
 * opening anything: what it costs, where it was cheapest, which way it is
 * moving, when you last bought it.
 */
export function vaultRows(vault = [], purchases = [], { now = Date.now() } = {}) {
  return vault.map((item) => {
    const stats = priceStats(purchases, item.id)
    const shops = storeComparison(purchases, item.id)
    const history = historyFor(purchases, item.id)
    const last = history.at(-1) ?? null

    return {
      item,
      stats,
      // Only a finding when there is more than one shop to compare.
      cheapest: shops.length > 1 ? shops[0] : null,
      shopCount: shops.length,
      lastPaid: last?.price ?? null,
      lastStore: last?.storeName ?? null,
      lastAt: last?.purchasedAt ?? null,
      daysSince: last ? Math.floor((now - last.purchasedAt) / DAY) : null,
      // Positive means dearer than the first time.
      change: stats?.change ?? null,
    }
  })
}

export const VAULT_SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'used', label: 'Most bought' },
  { id: 'dearer', label: 'Got dearer' },
  { id: 'name', label: 'A–Z' },
]

/**
 * Sort the rows. Every order puts products we know nothing about last rather
 * than dropping them — they are still yours, and a Vault that hides half
 * itself depending on the sort would be lying about its size.
 */
export function sortVaultRows(rows = [], sort = 'recent') {
  const copy = [...rows]
  const name = (r) => String(r.item.name).toLowerCase()

  switch (sort) {
    case 'used':
      return copy.sort(
        (a, b) => (b.item.timesUsed ?? 0) - (a.item.timesUsed ?? 0) || name(a).localeCompare(name(b)),
      )

    case 'dearer':
      // Biggest rise first; anything with no trend sinks to the bottom.
      return copy.sort((a, b) => {
        const ca = a.change ?? -Infinity
        const cb = b.change ?? -Infinity
        return cb - ca || name(a).localeCompare(name(b))
      })

    case 'name':
      return copy.sort((a, b) => name(a).localeCompare(name(b)))

    case 'recent':
    default:
      return copy.sort((a, b) => {
        if (a.lastAt === null && b.lastAt === null) return name(a).localeCompare(name(b))
        if (a.lastAt === null) return 1
        if (b.lastAt === null) return -1
        return b.lastAt - a.lastAt
      })
  }
}
