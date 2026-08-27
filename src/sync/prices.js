// Publishing and fetching community prices.
//
// Everything here is a no-op when Supabase is not configured, which is the
// default: `syncAvailable()` is false, every function returns an empty or
// unchanged result, and the app behaves exactly as it does today with its own
// purchase history as the only source of prices. No dead UI, no failed
// requests, no pretending.
//
// Contributing is opt-in and off until switched on. A price leaving the device
// is the one thing in CartWise that is not purely local, so it does not happen
// because someone shopped — it happens because they said yes.

import { getClient } from './client.js'
import { syncAvailable } from './config.js'
import { makeReport } from '../community.js'

export const CONTRIBUTE_KEY = 'cartwise.contributePrices'

/** Off unless explicitly turned on. */
export function contributionEnabled() {
  try {
    return window.localStorage.getItem(CONTRIBUTE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setContributionEnabled(on) {
  try {
    window.localStorage.setItem(CONTRIBUTE_KEY, on ? 'true' : 'false')
  } catch {
    // Applies for this session regardless.
  }
  return on
}

/** Whether contributing is possible at all — configured *and* opted in. */
export const canContribute = () => syncAvailable() && contributionEnabled()

/**
 * The row shape the table accepts. Kept apart from makeReport so the wire
 * format and the in-app format can diverge without either silently breaking
 * the other, and so the mapping is one obvious place to audit.
 *
 * Note what is not sent: no id, no user, no device, no trip, no list. The
 * date is a plain YYYY-MM-DD because the column is a DATE — a precise time
 * cannot be stored there even if this function tried.
 */
export function toRow(report) {
  if (!report) return null
  return {
    product_key: report.productKey,
    exact_match: report.exactMatch,
    product_name: report.productName,
    store_key: report.storeKey,
    store_name: report.storeName,
    price: report.price,
    unit: report.unit,
    currency: report.currency,
    reported_on: new Date(report.reportedAt).toISOString().slice(0, 10),
  }
}

/** The reverse, for rows coming back out of the consensus view. */
export function fromConsensusRow(row) {
  if (!row) return null
  return {
    productKey: row.product_key,
    exactMatch: row.exact_match,
    storeKey: row.store_key,
    storeName: row.store_name,
    productName: row.product_name,
    price: Number(row.price),
    unit: row.unit ?? null,
    packageSize: null,
    currency: row.currency ?? 'PHP',
    reportedAt: new Date(`${row.last_reported_on}T00:00:00`).getTime(),
    // Extra context the local reports do not carry.
    sightings: Number(row.sightings ?? 1),
    community: true,
  }
}

/**
 * Send prices from a finished trip.
 *
 * Returns `{ sent, skipped, reason }` rather than throwing: a failed
 * contribution must never interrupt finishing a shop, and the caller needs to
 * be able to say nothing happened.
 */
export async function publishTripPrices(trip, vault, { currency = 'PHP' } = {}) {
  if (!canContribute()) {
    return { sent: 0, skipped: trip?.items?.length ?? 0, reason: 'off' }
  }

  const client = await getClient()
  if (!client) return { sent: 0, skipped: 0, reason: 'unavailable' }

  const byId = new Map(vault.map((v) => [v.id, v]))
  const byName = new Map(vault.map((v) => [String(v.name).trim().toLowerCase(), v]))

  const rows = []
  for (const item of trip.items ?? []) {
    const product =
      byId.get(item.productId) ??
      byName.get(String(item.name).trim().toLowerCase()) ?? { name: item.name }

    const row = toRow(
      makeReport({
        product,
        storeName: trip.storeName,
        price: item.price,
        unit: item.unit,
        currency,
        at: trip.completedAt,
      }),
    )
    if (row) rows.push(row)
  }

  if (rows.length === 0) return { sent: 0, skipped: 0, reason: 'nothing-priced' }

  const { error } = await client.from('price_reports').insert(rows)
  if (error) return { sent: 0, skipped: rows.length, reason: 'error', error: error.message }

  return { sent: rows.length, skipped: (trip.items?.length ?? 0) - rows.length }
}

/**
 * Fetch what the community has for a set of products.
 *
 * Chunked, because a long list would otherwise build a URL longer than the
 * server will accept. Returns [] on any failure — community prices are a
 * bonus on top of your own history, so their absence is a quieter app rather
 * than a broken one.
 */
export async function fetchCommunityPrices(productKeys = [], { chunk = 40 } = {}) {
  if (!syncAvailable() || productKeys.length === 0) return []

  const client = await getClient()
  if (!client) return []

  const unique = [...new Set(productKeys.filter(Boolean))]
  const out = []

  for (let i = 0; i < unique.length; i += chunk) {
    const slice = unique.slice(i, i + chunk)
    const { data, error } = await client
      .from('price_consensus')
      .select('*')
      .in('product_key', slice)
    if (error) return out
    for (const row of data ?? []) {
      const mapped = fromConsensusRow(row)
      if (mapped) out.push(mapped)
    }
  }

  return out
}
