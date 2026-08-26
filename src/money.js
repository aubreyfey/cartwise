// Formatting lives in currency.js, which owns the chosen currency. Re-exported
// here so the many call sites that already import formatMoney from './money.js'
// keep working.
export { formatMoney } from './currency.js'

/** Parse a user-typed price into a number, tolerating "$4.20", "4,20", "". */
export function parseMoney(input) {
  if (typeof input === 'number') return Number.isFinite(input) && input >= 0 ? input : 0
  const cleaned = String(input ?? '')
    .replace(/[^0-9.,-]/g, '')
    .replace(',', '.')
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export const isKnownPrice = (price) => typeof price === 'number' && price > 0

/**
 * Parse a price field where "not filled in" is meaningful.
 *
 * An empty box means "I don't know what this costs yet" — which is different
 * from "it's free". Unknown prices are held as null and left out of every
 * total, so the budget never quietly understates by counting them as zero.
 */
export function parsePrice(input) {
  if (input === null || input === undefined) return null
  if (typeof input === 'number') return isKnownPrice(input) ? input : null
  if (String(input).trim() === '') return null
  const parsed = parseMoney(input)
  return parsed > 0 ? parsed : null
}

/** What one row costs, or null when the price is unknown. */
export function lineTotal(item) {
  return isKnownPrice(item.price) ? item.price * item.qty : null
}

/**
 * Total a set of rows, reporting how many were left out for want of a price.
 * Callers surface `unpriced` rather than pretending the total is complete.
 */
export function sumLines(items) {
  let total = 0
  let unpriced = 0
  for (const item of items) {
    const line = lineTotal(item)
    if (line === null) unpriced += 1
    else total += line
  }
  return { total, unpriced }
}
