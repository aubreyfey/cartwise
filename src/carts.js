// A cart is one shopping list: its own items, budget and store. You keep as
// many as you like — a weekly shop, a party list, a bulk run.

export const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

// What a list is for. Shopping is not only groceries — a cafe restock and a
// school supply run are the same job with different budgets, and mixing them
// into one flat list of lists makes both harder to find.
export const PURPOSES = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'school', label: 'School', icon: 'cap' },
  { id: 'business', label: 'Business', icon: 'cart' },
]

export const DEFAULT_PURPOSE = 'home'

export const PURPOSE_BY_ID = Object.fromEntries(PURPOSES.map((p) => [p.id, p]))

export const purposeOf = (cart) =>
  PURPOSE_BY_ID[cart?.purpose] ? cart.purpose : DEFAULT_PURPOSE

export function purposeLabel(id) {
  return (PURPOSE_BY_ID[id] ?? PURPOSE_BY_ID[DEFAULT_PURPOSE]).label
}

/**
 * Group lists under their purpose, in PURPOSES order, dropping empty groups.
 * Lists made before purposes existed have none, so they fall to Home rather
 * than vanishing into a group nobody sees.
 */
export function byPurpose(carts = []) {
  return PURPOSES.map((purpose) => ({
    purpose,
    carts: carts.filter((c) => purposeOf(c) === purpose.id),
  })).filter((group) => group.carts.length > 0)
}

export function makeCart(name = 'Groceries', purpose = DEFAULT_PURPOSE) {
  return {
    id: newId(),
    name,
    purpose: PURPOSE_BY_ID[purpose] ? purpose : DEFAULT_PURPOSE,
    items: [],
    budget: 0,
    storeId: null,
    createdAt: Date.now(),
  }
}

export function addCart(carts, name, purpose = DEFAULT_PURPOSE) {
  const trimmed = (name ?? '').trim() || `List ${carts.length + 1}`
  return [...carts, makeCart(trimmed, purpose)]
}

export const removeCart = (carts, id) => carts.filter((c) => c.id !== id)

export function renameCart(carts, id, name) {
  const trimmed = name.trim()
  if (!trimmed) return carts
  return carts.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
}

/** Apply `patch` (or a function of the cart) to one cart, leaving the rest alone. */
export function updateCart(carts, id, patch) {
  return carts.map((c) =>
    c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c,
  )
}

export const findCart = (carts, id) => carts.find((c) => c.id === id) ?? null

/**
 * Build the initial cart list.
 *
 * Version 1 of the app stored a single list under `cartwise.items` with a
 * top-level budget. If that's what we find, fold it into one cart so nobody
 * loses a list they'd already started.
 */
export function initialCarts(legacyItems, legacyBudget) {
  if (Array.isArray(legacyItems) && legacyItems.length > 0) {
    const cart = makeCart('Groceries')
    return [{ ...cart, items: legacyItems, budget: legacyBudget ?? 0 }]
  }
  return [makeCart('Groceries')]
}
