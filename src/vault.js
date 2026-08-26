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
export function rememberItem(vault, { name, category, price, qty, unit, storeId }) {
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
