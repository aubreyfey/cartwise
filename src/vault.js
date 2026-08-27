// The Vault is the memory behind the list: every item you add is remembered
// with its last known price, so the next list autocompletes and the budget
// math is based on what things actually cost you.
//
// Prices are kept per store in `prices[storeId]`, plus a bare `price` holding
// the last thing you paid anywhere — that's the fallback for a store you
// haven't priced this item at yet, and the only price used when you haven't
// set up stores at all. `previous[storeId]` keeps the price before the
// current one, which is what lets a row flag that something got dearer.
//
// An unknown price is null throughout, never 0. "I haven't priced this yet"
// and "this is free" are different claims and only one of them belongs in a
// budget total.

import { DEFAULT_UNIT } from './units.js'
import { isKnownPrice } from './money.js'

const key = (name) => name.trim().toLowerCase()

const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function findVaultItem(vault, name) {
  const k = key(name)
  return vault.find((v) => key(v.name) === k) ?? null
}

/**
 * Look an item up by a scanned barcode. Codes are compared as trimmed
 * strings, never numbers — leading zeros are significant in EAN/UPC and
 * Number() would eat them.
 */
export function findByBarcode(vault, barcode) {
  const code = String(barcode ?? '').trim()
  if (!code) return null
  return vault.find((v) => v.barcode === code) ?? null
}

/**
 * File a barcode against an item, so the next scan recognises it. A code
 * already attached to something else is moved, not duplicated — one physical
 * product is one Vault entry.
 */
export function rememberBarcode(vault, name, barcode) {
  const code = String(barcode ?? '').trim()
  const existing = findVaultItem(vault, name)
  if (!code || !existing) return vault

  return vault.map((v) => {
    if (v.id === existing.id) return { ...v, barcode: code, updatedAt: Date.now() }
    if (v.barcode === code) {
      const { barcode: _moved, ...rest } = v
      return rest
    }
    return v
  })
}

/**
 * What this item costs at `storeId`, falling back to the last price paid
 * anywhere. Returns null when unknown. Pass `strict` to get only a real
 * per-store price — store comparison needs that, so it never weighs a
 * fallback against a genuine price.
 */
export function priceFor(vaultItem, storeId, { strict = false } = {}) {
  if (!vaultItem) return null
  const atStore = storeId ? vaultItem.prices?.[storeId] : undefined
  if (isKnownPrice(atStore)) return atStore
  if (strict) return null
  return isKnownPrice(vaultItem.price) ? vaultItem.price : null
}

/** The price before the current one at this store, or null if there isn't one. */
export function previousPriceFor(vaultItem, storeId) {
  if (!vaultItem || !storeId) return null
  const prev = vaultItem.previous?.[storeId]
  return isKnownPrice(prev) ? prev : null
}

/**
 * Remember an item. Creates the entry if it's new, otherwise bumps usage and
 * updates the remembered price — but never overwrites a known price with an
 * unknown one, so adding an item with the price box empty keeps what we
 * already learned.
 */
export function rememberItem(
  vault,
  { name, category, price, qty, unit, storeId, brand, packageSize },
) {
  const existing = findVaultItem(vault, name)
  const known = isKnownPrice(price)

  if (!existing) {
    return [
      ...vault,
      {
        id: newId(),
        name: name.trim(),
        category,
        unit: unit ?? DEFAULT_UNIT,
        brand: brand ?? null,
        packageSize: packageSize ?? null,
        price: known ? price : null,
        prices: known && storeId ? { [storeId]: price } : {},
        previous: {},
        defaultQty: qty ?? 1,
        timesUsed: 1,
        updatedAt: Date.now(),
      },
    ]
  }

  return vault.map((v) => {
    if (v.id !== existing.id) return v
    const before = v.prices?.[storeId]
    const changed = known && storeId && isKnownPrice(before) && before !== price

    return {
      ...v,
      category,
      unit: unit ?? v.unit ?? DEFAULT_UNIT,
      // Blank fields don't erase what we already know.
      brand: brand ?? v.brand ?? null,
      packageSize: packageSize ?? v.packageSize ?? null,
      price: known ? price : v.price,
      prices: known && storeId ? { ...v.prices, [storeId]: price } : (v.prices ?? {}),
      previous: changed ? { ...v.previous, [storeId]: before } : (v.previous ?? {}),
      defaultQty: qty ?? v.defaultQty,
      timesUsed: v.timesUsed + 1,
      updatedAt: Date.now(),
    }
  })
}

/**
 * Update just the remembered price — used when you correct a price in the
 * list. Records it against the active store as well as the anywhere-price,
 * and files the old figure under `previous` so the change can be shown.
 */
export function rememberPrice(vault, name, price, storeId) {
  const existing = findVaultItem(vault, name)
  if (!existing || !isKnownPrice(price)) return vault

  return vault.map((v) => {
    if (v.id !== existing.id) return v
    const before = storeId ? v.prices?.[storeId] : v.price
    const changed = isKnownPrice(before) && before !== price

    return {
      ...v,
      price,
      prices: storeId ? { ...v.prices, [storeId]: price } : (v.prices ?? {}),
      previous:
        changed && storeId ? { ...v.previous, [storeId]: before } : (v.previous ?? {}),
      updatedAt: Date.now(),
    }
  })
}

/** Remember the unit an item is sold in, without touching its prices. */
export function rememberUnit(vault, name, unit) {
  const existing = findVaultItem(vault, name)
  if (!existing) return vault
  return vault.map((v) => (v.id === existing.id ? { ...v, unit } : v))
}

/** Drop a store's prices from every item — called when a store is deleted. */
export function forgetStorePrices(vault, storeId) {
  return vault.map((v) => {
    if (!v.prices?.[storeId] && !v.previous?.[storeId]) return v
    const { [storeId]: _p, ...prices } = v.prices ?? {}
    const { [storeId]: _q, ...previous } = v.previous ?? {}
    return { ...v, prices, previous }
  })
}

export function removeVaultItem(vault, id) {
  return vault.filter((v) => v.id !== id)
}

/**
 * Suggestions for the add box. Names that start with the query rank above
 * names that merely contain it; ties break on how often you buy the thing.
 */
export function suggest(vault, query, { limit = 6 } = {}) {
  const q = key(query)
  if (!q) return []

  return vault
    .map((v) => {
      const name = key(v.name)
      if (name === q) return null // already typed in full — nothing to suggest
      if (name.startsWith(q)) return { item: v, rank: 0 }
      if (name.includes(q)) return { item: v, rank: 1 }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || b.item.timesUsed - a.item.timesUsed)
    .slice(0, limit)
    .map((s) => s.item)
}

/** Most-bought items first — what the Vault panel shows as quick-add chips. */
export function byPopularity(vault) {
  return [...vault].sort(
    (a, b) => b.timesUsed - a.timesUsed || a.name.localeCompare(b.name),
  )
}

/**
 * Which aisle a price came from, so a row can say so.
 *
 * priceFor falls back to the last price paid anywhere when the item has never
 * been priced at the shop you are in. That fallback is the right number to
 * show, but presenting it as this shop's price would be a lie — the row needs
 * to be able to mark it.
 */
export function priceSource(vaultItem, storeId) {
  if (!vaultItem) return null
  if (storeId && isKnownPrice(vaultItem.prices?.[storeId])) return storeId
  return isKnownPrice(vaultItem.price) ? 'anywhere' : null
}

/**
 * Search the Vault the way someone standing in a shop would: by what the thing
 * is called, or the brand on the packet, narrowed to one aisle if they have
 * tapped one.
 *
 * Ranked rather than filtered alphabetically — typing "mil" should offer Milk
 * before Buttermilk, and the thing you buy every week before the thing you
 * bought once.
 */
export function searchVault(vault, { query = '', category = null } = {}) {
  const q = key(String(query ?? ''))
  const inAisle = category ? vault.filter((v) => v.category === category) : [...vault]

  if (!q) return byPopularity(inAisle)

  return inAisle
    .map((item) => {
      const name = key(item.name ?? '')
      const brand = key(item.brand ?? '')

      let rank
      if (name.startsWith(q)) rank = 0
      // A word boundary inside the name: "cheese" should find "Cheddar Cheese"
      // ahead of anything that merely contains the letters.
      else if (name.includes(` ${q}`)) rank = 1
      else if (name.includes(q)) rank = 2
      else if (brand.startsWith(q) || brand.includes(` ${q}`)) rank = 3
      else if (brand.includes(q)) rank = 4
      else return null

      return { item, rank }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        (b.item.timesUsed ?? 0) - (a.item.timesUsed ?? 0) ||
        String(a.item.name).localeCompare(String(b.item.name)),
    )
    .map((s) => s.item)
}

/**
 * The aisles the Vault actually has something in, with counts, in shop-walk
 * order. An aisle you have never bought from is not a filter worth offering.
 */
export function vaultCategories(vault, order) {
  const counts = new Map()
  for (const item of vault) {
    const id = item.category ?? 'other'
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const ids = Array.isArray(order) && order.length ? order : [...counts.keys()]
  return ids
    .filter((id) => counts.has(id))
    .map((id) => ({ id, count: counts.get(id) }))
}
