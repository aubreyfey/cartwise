// Where you have bought a product, and what it cost there.
//
// The shops map answers "where do I shop". This answers a narrower and more
// useful question: "where can I get *this*, and for how much" — which is what
// you want when you are deciding whether a trip across town is worth it.
//
// Two rules carried over from everything else that touches prices here:
//
//   These are prices you recorded, not live shelf prices. CartWise has no feed
//   from any retailer and must never imply it does. Every row carries when it
//   was last seen so a stale number reads as stale.
//
//   Locations are not invented. A shop only appears on the map once you have
//   saved its location by standing in it. Shops without one are still listed,
//   because they still sell the thing — dropping them would make the list lie
//   about where you can buy it.

import { isLocation } from './geo.js'
import { storeComparison } from './purchases.js'

/**
 * Every shop you have bought this product at, cheapest first.
 *
 * `located` is the subset the map can actually show. `unlocated` is the rest,
 * which the caller should still list.
 */
export function productShops(purchases = [], stores = [], productId) {
  const rows = storeComparison(purchases, productId)
  if (rows.length === 0) return { all: [], located: [], unlocated: [], cheapest: null }

  const byId = new Map(stores.map((s) => [s.id, s]))

  const all = rows.map((row) => {
    const store = row.storeId ? byId.get(row.storeId) : null
    return {
      ...row,
      // The shop as it exists now, which is where the location lives. The
      // purchase's own storeName is the fallback, so a shop deleted since
      // still shows the name it was bought under.
      store: store ?? null,
      name: store?.name ?? row.storeName ?? 'Unknown shop',
      location: isLocation(store?.location) ? store.location : null,
    }
  })

  return {
    all,
    located: all.filter((r) => r.location),
    unlocated: all.filter((r) => !r.location),
    // storeComparison already sorts by price, so the first row is the cheapest.
    // Only a finding when there is more than one shop to beat.
    cheapest: all.length > 1 ? all[0] : null,
  }
}

/**
 * What separates the cheapest from the dearest, or null when there is nothing
 * to compare. This is the number that decides whether the other shop is worth
 * the journey.
 */
export function priceGap(shops) {
  const rows = shops?.all ?? []
  if (rows.length < 2) return null
  const low = rows[0].price
  const high = rows[rows.length - 1].price
  if (high <= low) return null
  return { low, high, difference: high - low, cheapest: rows[0], dearest: rows[rows.length - 1] }
}

const DAY = 86_400_000

/** How stale a price is, in plain words. */
export function seenAgo(lastSeen, now = Date.now()) {
  if (typeof lastSeen !== 'number') return null
  const days = Math.floor((now - lastSeen) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  return `${Math.round(days / 365)} years ago`
}
