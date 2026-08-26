// A cart is one shopping list: its own items, budget and store. You keep as
// many as you like — a weekly shop, a party list, a bulk run.

export const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function makeCart(name = 'Groceries') {
  return {
    id: newId(),
    name,
    items: [],
    budget: 0,
    storeId: null,
    createdAt: Date.now(),
  }
}

export function addCart(carts, name) {
  const trimmed = (name ?? '').trim() || `List ${carts.length + 1}`
  return [...carts, makeCart(trimmed)]
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
