// Every line you have ever actually bought, as its own record.
//
// This is the layer the app was missing. Trips snapshot what a shop cost, and
// the Vault remembers the latest price per store, but neither can answer "what
// has this cost me over the last year, and where was it cheapest" — a trip is
// keyed by shop, not by product, and the Vault only ever kept the current
// price and the one before it.
//
// A purchase points at a Vault item by id. That id is the product id: the
// Vault is already the product table, keyed by name, deduplicated on the way
// in by rememberItem. Adding a second product table would mean two things
// claiming to be the catalogue.
//
// Records are append-only. A price you paid in March is a fact; editing the
// Vault later must not rewrite it, which is the same reason completeTrip
// copies prices in rather than referencing them.

import { isKnownPrice } from './money.js'

const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

/**
 * One purchase record.
 *
 * `productId` is the Vault item's id. `tripId` links back to the trip it came
 * from, so deleting a trip can take its purchases with it.
 */
export function makePurchase({
  productId,
  name,
  storeId = null,
  storeName = null,
  price,
  qty = 1,
  unit = null,
  packageSize = null,
  purchasedAt = Date.now(),
  tripId = null,
}) {
  return {
    id: newId(),
    productId,
    // Denormalised on purpose: a purchase has to stay readable after the Vault
    // item is forgotten, the same way a receipt survives you throwing the
    // packet away.
    name,
    storeId,
    storeName,
    price: isKnownPrice(price) ? price : null,
    qty,
    unit,
    packageSize,
    purchasedAt,
    tripId,
  }
}

/** Record everything bought on a trip. Unpriced lines are kept — they were in
 *  the basket — but they cannot join a price history. */
export function recordTripPurchases(purchases, trip, vault) {
  if (!trip?.items?.length) return purchases

  const byName = new Map(vault.map((v) => [String(v.name).trim().toLowerCase(), v]))

  const added = trip.items.map((item) =>
    makePurchase({
      productId: byName.get(String(item.name).trim().toLowerCase())?.id ?? null,
      name: item.name,
      storeId: trip.storeId,
      storeName: trip.storeName,
      price: item.price,
      qty: item.qty,
      unit: item.unit,
      packageSize: item.packageSize ?? null,
      purchasedAt: trip.completedAt,
      tripId: trip.id,
    }),
  )

  return [...purchases, ...added]
}

export const forgetTripPurchases = (purchases, tripId) =>
  purchases.filter((p) => p.tripId !== tripId)

/** Every priced purchase of one product, oldest first. */
export function historyFor(purchases, productId, { storeId = null } = {}) {
  return purchases
    .filter(
      (p) =>
        p.productId === productId &&
        isKnownPrice(p.price) &&
        (storeId === null || p.storeId === storeId),
    )
    .sort((a, b) => a.purchasedAt - b.purchasedAt)
}

/**
 * What the history says. Returns null when there is nothing priced to say it
 * from — an average of no numbers is not zero.
 */
export function priceStats(purchases, productId) {
  const history = historyFor(purchases, productId)
  if (history.length === 0) return null

  const prices = history.map((p) => p.price)
  const latest = history.at(-1)
  const first = history[0]

  let lowest = history[0]
  let highest = history[0]
  for (const record of history) {
    if (record.price < lowest.price) lowest = record
    if (record.price > highest.price) highest = record
  }

  return {
    count: history.length,
    latest,
    first,
    lowest,
    highest,
    average: prices.reduce((a, b) => a + b, 0) / prices.length,
    // Only meaningful once there are two points to compare.
    change: history.length > 1 ? latest.price - first.price : null,
  }
}

/**
 * What this product has cost at each shop, cheapest first.
 *
 * These are prices *you recorded*, not live shelf prices — the app has no
 * retailer feed and must never imply it does. Each row carries when it was
 * last seen so a stale number can be read as stale.
 */
export function storeComparison(purchases, productId) {
  const byStore = new Map()

  for (const record of historyFor(purchases, productId)) {
    const key = record.storeId ?? '__none'
    const existing = byStore.get(key)
    if (!existing || record.purchasedAt > existing.lastSeen) {
      byStore.set(key, {
        storeId: record.storeId,
        storeName: record.storeName,
        price: record.price,
        lastSeen: record.purchasedAt,
        // How many times you have priced it here — one sighting is weaker
        // evidence than six.
        count: (existing?.count ?? 0) + 1,
      })
    } else {
      existing.count += 1
    }
  }

  const rows = [...byStore.values()].sort((a, b) => a.price - b.price)
  return rows.map((row, i) => ({ ...row, cheapest: i === 0 && rows.length > 1 }))
}

/** When this product was last bought, or null. */
export function lastPurchasedAt(purchases, productId) {
  let latest = null
  for (const p of purchases) {
    if (p.productId === productId && (latest === null || p.purchasedAt > latest)) {
      latest = p.purchasedAt
    }
  }
  return latest
}

export const removePurchase = (purchases, id) => purchases.filter((p) => p.id !== id)

export function updatePurchase(purchases, id, patch) {
  return purchases.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p))
}
