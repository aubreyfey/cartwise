// CartWise Plus.
//
// IMPORTANT, and the reason this file is short: the entitlement below is a
// flag in this browser's own storage. Anyone who opens devtools can set it.
// That is fine for what it currently gates — a photo behind your own list,
// which costs nothing to provide and never leaves the phone — and it is
// NOT fine for anything that costs money to serve.
//
// Sync and community price lookups run against a server. When those arrive,
// the server must check the receipt itself; it must never trust this flag or
// anything else the client says about who has paid. Treat isPlus() as "should
// the UI offer this", never as "is this person allowed to consume resources".
//
// There is no purchase flow here because there is no payment processor yet,
// and a Subscribe button that does not charge anyone is a lie about a
// commercial relationship. The sheet says the price and says it is not on
// sale.

export const PLUS_KEY = 'cartwise.plus'

// ₱9 for the first month, then ₱99 a year. Kept here so the sheet and any
// future checkout read the same numbers from one place.
export const PLUS_PRICE = {
  intro: 9,
  introPeriod: 'first month',
  renewal: 99,
  renewalPeriod: 'year',
}

/** Everything Plus adds. `live` is false for anything not yet built. */
export const PLUS_FEATURES = [
  { id: 'photos', label: 'Photo backgrounds for your lists', live: true },
  { id: 'sync', label: 'Sync across your devices', live: false },
  { id: 'community', label: 'Community price comparison', live: false },
]

export function isPlus() {
  try {
    return window.localStorage.getItem(PLUS_KEY) === 'true'
  } catch {
    return false
  }
}

export function setPlus(on) {
  try {
    window.localStorage.setItem(PLUS_KEY, on ? 'true' : 'false')
  } catch {
    // Applies for this session regardless.
  }
  return on
}

/**
 * Can this list use a photo background?
 *
 * Grandfathered on purpose. Photo backgrounds were free before Plus existed,
 * and taking something away that worked yesterday is the fastest way to lose
 * the users you already have. A list that already has a photo keeps it
 * forever; the gate only applies to setting a new one.
 */
export function canUsePhoto({ plus = false, existingPhoto = null } = {}) {
  return plus || Boolean(existingPhoto)
}

/**
 * Whether to gate the "add a photo" control for this list.
 *
 * Separate from canUsePhoto because the two answers differ for exactly the
 * case that matters: a grandfathered list can *show* its photo but a
 * non-subscriber still should not be handed unlimited new ones.
 */
export function photoGateState({ plus = false, existingPhoto = null } = {}) {
  if (plus) return 'open'
  if (existingPhoto) return 'grandfathered'
  return 'locked'
}
