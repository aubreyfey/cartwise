// Community pricing: what a shopper's confirmed price looks like once it has
// been stripped of everything that identifies them, and what a basket costs at
// each shop given a pile of such reports.
//
// Nothing here talks to a network. It is the model and the maths, and it works
// on your own purchase history today exactly as it will work on other
// people's — a report is a report whoever made it. See contributions.js for
// the queue that would carry them somewhere, and README for what is missing.
//
// Two rules run through all of it:
//
//   A price is evidence, not a quote. Every figure carries when it was seen
//   and how many sightings back it, because "₱42.50 at Gaisano" without a date
//   is a claim the app cannot support.
//
//   Coverage beats cheapness. A shop with three of your twelve items priced
//   is not cheaper than one with all twelve; it is less known. Ranking on
//   partial baskets is how you tell someone to drive to the wrong shop.

import { isKnownPrice } from './money.js'

const DAY = 86_400_000

/* ------------------------------------------------------------- identity */

/**
 * The key a product is pooled under.
 *
 * A barcode is the only thing two strangers reliably agree on: one types
 * "Alaska Condensed Milk 300ml", another "alaska condensed", and they are the
 * same tin. Without one we fall back to a normalised name, which pools far
 * less reliably and is marked as such by `exact`.
 */
export function productKey(product = {}) {
  const barcode = String(product.barcode ?? '').replace(/\D/g, '')
  if (barcode.length >= 8) return { key: `ean:${barcode}`, exact: true }

  const name = normaliseText(product.name)
  if (!name) return null
  return { key: `name:${name}`, exact: false }
}

/**
 * The key a shop is pooled under. "Gaisano", "gaisano " and "GAISANO" are one
 * shop; anything more (branches, spelling) needs a real store registry, which
 * is one of the things a backend would have to bring.
 */
export function storeKey(name) {
  const slug = normaliseText(name)
  return slug ? `store:${slug}` : null
}

function normaliseText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
}

/* ----------------------------------------------------------- the report */

/**
 * One anonymous price sighting.
 *
 * What is deliberately *not* here: any user id, device id, list, trip, basket
 * contents, or exact time. The timestamp is rounded to the day it happened,
 * because a precise one plus a shop is a movement record, and this feature is
 * not worth building if it costs people that.
 *
 * Returns null when there is nothing worth reporting — no price, no shop, or
 * no way to identify the product — rather than a half-record that pollutes
 * the pool.
 */
export function makeReport({ product, storeName, price, unit, currency = 'PHP', at = Date.now() }) {
  if (!isKnownPrice(price)) return null

  const identity = productKey(product ?? {})
  const shop = storeKey(storeName)
  if (!identity || !shop) return null

  return {
    productKey: identity.key,
    exactMatch: identity.exact,
    storeKey: shop,
    // Kept for display only; the key is what pooling uses.
    storeName: String(storeName).trim(),
    productName: String(product.name ?? '').trim(),
    price,
    unit: unit ?? product.unit ?? null,
    packageSize: product.packageSize ?? null,
    currency,
    reportedAt: startOfDay(at),
  }
}

export const startOfDay = (ts) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Turn your own purchase log into reports, as if you were the community. */
export function reportsFromPurchases(purchases = [], vault = []) {
  const byId = new Map(vault.map((v) => [v.id, v]))
  const out = []
  for (const purchase of purchases) {
    const product = byId.get(purchase.productId) ?? { name: purchase.name }
    const report = makeReport({
      product,
      storeName: purchase.storeName,
      price: purchase.price,
      unit: purchase.unit,
      at: purchase.purchasedAt,
    })
    if (report) out.push(report)
  }
  return out
}

/* -------------------------------------------------------------- ageing */

export const HORIZON_DAYS = 30

/** How old a sighting is, in plain words. */
export function freshness(reportedAt, now = Date.now()) {
  const days = Math.round((startOfDay(now) - startOfDay(reportedAt)) / DAY)
  if (days <= 0) return { days: 0, label: 'reported today', stale: false }
  if (days === 1) return { days, label: 'reported yesterday', stale: false }
  return {
    days,
    label: `reported ${days} days ago`,
    // Past the horizon it is history, not a current price.
    stale: days > HORIZON_DAYS,
  }
}

/* --------------------------------------------------------- aggregation */

/**
 * What one product has cost at each shop, newest sighting per shop, cheapest
 * first. Stale sightings are kept but marked, so the caller can show them
 * greyed rather than pretend they are current or hide them and look empty.
 */
export function pricesForProduct(reports, key, now = Date.now()) {
  const byStore = new Map()

  for (const report of reports) {
    if (report.productKey !== key) continue
    const existing = byStore.get(report.storeKey)
    if (!existing) {
      byStore.set(report.storeKey, { ...report, sightings: 1 })
      continue
    }
    existing.sightings += 1
    if (report.reportedAt > existing.reportedAt) {
      byStore.set(report.storeKey, { ...report, sightings: existing.sightings })
    }
  }

  return [...byStore.values()]
    .map((row) => ({ ...row, ...freshness(row.reportedAt, now) }))
    .sort((a, b) => a.price - b.price)
}

/* ----------------------------------------------------- basket estimate */

/**
 * What the whole list would cost at each shop.
 *
 * `covered` is the point of the whole thing. A shop that can price four of
 * your twelve items has a small total and tells you nothing, so `total` is
 * only ever the sum of what that shop actually prices, and the caller is
 * handed the count to show alongside it.
 */
export function estimateBasket(items = [], reports = [], now = Date.now()) {
  const lines = items
    .map((item) => ({ item, identity: productKey(item) }))
    .filter((line) => line.identity)

  const shops = new Map()
  for (const report of reports) {
    if (freshness(report.reportedAt, now).stale) continue
    if (!shops.has(report.storeKey)) {
      shops.set(report.storeKey, { storeKey: report.storeKey, storeName: report.storeName })
    }
  }

  const estimates = []
  for (const shop of shops.values()) {
    let total = 0
    let covered = 0
    let oldest = null
    const missing = []

    for (const { item, identity } of lines) {
      const here = pricesForProduct(reports, identity.key, now).find(
        (row) => row.storeKey === shop.storeKey && !row.stale,
      )
      if (!here) {
        missing.push(item.name)
        continue
      }
      covered += 1
      total += here.price * (item.qty ?? 1)
      oldest = oldest === null ? here.days : Math.max(oldest, here.days)
    }

    estimates.push({
      ...shop,
      total,
      covered,
      of: lines.length,
      complete: covered === lines.length && lines.length > 0,
      missing,
      oldestDays: oldest,
    })
  }

  // Complete baskets first, then cheapest. Sorting purely on total would put a
  // shop that knows two items above one that knows all twelve.
  return estimates.sort(
    (a, b) =>
      Number(b.complete) - Number(a.complete) ||
      b.covered - a.covered ||
      a.total - b.total,
  )
}

/**
 * The shop to recommend, and what choosing it saves.
 *
 * Only ever recommends from shops that can price the *whole* basket — two
 * totals built from different subsets are not comparable, and presenting them
 * as if they were is the bug this function exists to avoid. Returns null when
 * fewer than two shops can, because "cheapest of one" is not a finding.
 */
export function bestOption(estimates = []) {
  const complete = estimates.filter((e) => e.complete).sort((a, b) => a.total - b.total)
  if (complete.length === 0) return null

  const best = complete[0]
  const next = complete[1] ?? null

  return {
    best,
    next,
    saving: next ? next.total - best.total : null,
    // How many shops the recommendation was actually chosen between.
    comparedAcross: complete.length,
  }
}
