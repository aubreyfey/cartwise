// The order the aisles come in.
//
// The default is a rough walk through a supermarket — produce at the door,
// household at the back — but no two shops agree, and the list is only useful
// mid-shop if its order matches the one you actually walk. So the order is
// yours to rearrange, and it is stored as a list of category ids rather than
// an index per aisle, which keeps "move this one up" a single splice.

import { CATEGORIES } from './categories.js'

export const AISLE_ORDER_KEY = 'cartwise.aisleOrder'

const DEFAULT_IDS = CATEGORIES.map((c) => c.id)

export const defaultAisleOrder = () => [...DEFAULT_IDS]

/**
 * Make a stored order safe to render from: drop anything we no longer have an
 * aisle for, drop duplicates, and put back anything missing.
 *
 * A missing aisle goes back next to the neighbour it shipped beside rather
 * than on the end. Appending would strand every aisle added in a later version
 * at the bottom of everyone's list, which reads as a bug rather than a new
 * feature.
 */
export function normaliseAisleOrder(order) {
  const known = new Set(DEFAULT_IDS)
  const seen = new Set()
  const kept = []

  for (const id of Array.isArray(order) ? order : []) {
    if (known.has(id) && !seen.has(id)) {
      seen.add(id)
      kept.push(id)
    }
  }

  for (const id of DEFAULT_IDS) {
    if (seen.has(id)) continue
    let insertAt = 0
    for (let i = DEFAULT_IDS.indexOf(id) - 1; i >= 0; i -= 1) {
      const at = kept.indexOf(DEFAULT_IDS[i])
      if (at !== -1) {
        insertAt = at + 1
        break
      }
    }
    kept.splice(insertAt, 0, id)
    seen.add(id)
  }

  return kept
}

/** The categories themselves, in the stored order. */
export function orderedCategories(order) {
  const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
  return normaliseAisleOrder(order).map((id) => byId[id])
}

/**
 * Move one aisle up or down. Returns the order unchanged when it is already at
 * the end it is being pushed towards, so the caller can disable the button by
 * comparing rather than repeating the bounds check.
 */
export function moveAisle(order, id, delta) {
  const list = normaliseAisleOrder(order)
  const from = list.indexOf(id)
  if (from === -1) return list

  const to = from + delta
  if (to < 0 || to >= list.length) return list

  const next = [...list]
  next.splice(from, 1)
  next.splice(to, 0, id)
  return next
}

export const isDefaultAisleOrder = (order) =>
  normaliseAisleOrder(order).every((id, i) => id === DEFAULT_IDS[i])
