// Items are priced per unit, and the unit is part of how the row reads:
// "1 × $4.20 / bag", "0.51 × $9.90 / kg".
//
// Units measured by weight or volume accept fractional quantities — you buy
// 0.51 kg of broccoli, not 1. Countable units stay whole.

export const UNITS = [
  { id: 'pc', label: 'pc', fractional: false },
  { id: 'pack', label: 'pack', fractional: false },
  { id: 'bag', label: 'bag', fractional: false },
  { id: 'box', label: 'box', fractional: false },
  { id: 'can', label: 'can', fractional: false },
  { id: 'bottle', label: 'bottle', fractional: false },
  { id: 'jar', label: 'jar', fractional: false },
  { id: 'tub', label: 'tub', fractional: false },
  { id: 'pouch', label: 'pouch', fractional: false },
  { id: 'tray', label: 'tray', fractional: false },
  { id: 'bundle', label: 'bundle', fractional: false },
  { id: 'dozen', label: 'dozen', fractional: false },
  { id: 'kg', label: 'kg', fractional: true },
  { id: 'g', label: 'g', fractional: true },
  { id: 'lb', label: 'lb', fractional: true },
  { id: 'L', label: 'L', fractional: true },
  { id: 'mL', label: 'mL', fractional: true },
]

export const UNIT_BY_ID = Object.fromEntries(UNITS.map((u) => [u.id, u]))

export const DEFAULT_UNIT = 'pc'

export const unitLabel = (id) => (UNIT_BY_ID[id] ?? UNIT_BY_ID[DEFAULT_UNIT]).label

export const isFractional = (id) => UNIT_BY_ID[id]?.fractional ?? false

/** Step size for the ± buttons: fine for weight, whole for countable things. */
export const stepFor = (id) => (isFractional(id) ? 0.25 : 1)

/**
 * Quantities print without trailing zeros — "2" not "2.00", but "0.51" keeps
 * its precision.
 */
export function formatQty(qty) {
  if (!Number.isFinite(qty)) return '0'
  return Number.parseFloat(qty.toFixed(3)).toString()
}

/** Clamp a quantity to something sane for its unit. */
export function normalizeQty(qty, unitId) {
  const n = Number.parseFloat(qty)
  if (!Number.isFinite(n) || n <= 0) return isFractional(unitId) ? 0.25 : 1
  return isFractional(unitId) ? Number.parseFloat(n.toFixed(3)) : Math.round(n)
}
