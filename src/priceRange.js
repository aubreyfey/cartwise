// What a product costs, as a range rather than a single number.
//
// Two different things live here and they must not be confused, because one is
// a record and the other is an opinion:
//
//   the paid range      — the lowest and highest you have actually been
//                         charged. Derived from the purchase log. CartWise
//                         cannot make this up, and where there is no history
//                         there is no range.
//
//   the expected range  — what you think it should cost. Typed by you, stored
//                         on the Vault item, and used to flag a shelf price
//                         that falls outside it while you are standing there.
//
// Everything that reads a range should be clear about which one it is showing.
// "₱52–₱58" and "you expect ₱50–₱60" are different claims.

import { isKnownPrice } from './money.js'
import { historyFor } from './purchases.js'

/**
 * The lowest and highest actually paid, or null when nothing has been.
 *
 * `count` is how many prices it is drawn from, because a range built from two
 * shops on one afternoon deserves less confidence than one built from a year.
 */
export function paidRange(purchases = [], productId) {
  const history = historyFor(purchases, productId)
  if (history.length === 0) return null

  let low = history[0]
  let high = history[0]
  for (const record of history) {
    if (record.price < low.price) low = record
    if (record.price > high.price) high = record
  }

  return {
    low: low.price,
    high: high.price,
    lowStore: low.storeName ?? null,
    highStore: high.storeName ?? null,
    count: history.length,
    // A single observation is a price, not a range, and saying "₱52–₱52"
    // dresses one data point up as a spread.
    spread: history.length > 1 && high.price > low.price,
  }
}

/** The expected range someone has set, or null. Both ends must be sane. */
export function expectedRange(item) {
  const low = item?.expectedLow
  const high = item?.expectedHigh
  if (!isKnownPrice(low) || !isKnownPrice(high)) return null
  // Typed the wrong way round is a slip, not an error worth refusing.
  return low <= high ? { low, high } : { low: high, high: low }
}

/**
 * Where a price sits against what was expected.
 *
 * Returns 'below' | 'within' | 'above', or null when there is nothing to
 * judge against — which is not the same as 'within' and must not be treated
 * as a pass.
 */
export function rangeVerdict(price, expected) {
  if (!isKnownPrice(price) || !expected) return null
  if (price < expected.low) return 'below'
  if (price > expected.high) return 'above'
  return 'within'
}

/** How far outside the range a price is, or 0 when it is inside. */
export function overBy(price, expected) {
  const verdict = rangeVerdict(price, expected)
  if (verdict === 'above') return price - expected.high
  if (verdict === 'below') return expected.low - price
  return 0
}

/**
 * A starting point for the expected range, from what has actually been paid.
 *
 * Padded by a tenth at each end and rounded, so a range built from three trips
 * does not flag the fourth for being a peso off. Returns null when there is no
 * history — guessing a range for a product nobody has bought would be the app
 * inventing a price, which it does not do.
 */
export function suggestExpected(range) {
  if (!range) return null
  const pad = Math.max(1, Math.round(range.high * 0.1))
  return {
    low: Math.max(0, Math.round(range.low - pad)),
    high: Math.round(range.high + pad),
  }
}

/** Store the range on a Vault item. Passing null clears it. */
export function setExpectedRange(item, range) {
  if (!range) {
    const { expectedLow: _l, expectedHigh: _h, ...rest } = item
    return rest
  }
  const low = Math.min(range.low, range.high)
  const high = Math.max(range.low, range.high)
  return { ...item, expectedLow: low, expectedHigh: high }
}
