// The Category Library: which aisles exist, what they are called, and which
// ones you actually use.
//
// The hard constraint is that a category id is written into every list item,
// every Vault entry, every pantry entry and every archived trip. So ids are
// permanent and additive — nothing is ever renamed or removed here. What a
// category is *called* is a separate, overridable label, and whether you see
// it is separate again.
//
// That is why "Produce" can display as "Fresh Produce" without a migration,
// and why archiving an aisle hides it without orphaning a year of history.

import { CATEGORIES as BUILT_IN, CATEGORY_BY_ID as BUILT_IN_BY_ID } from './categories.js'

export const CATEGORY_LIBRARY_KEY = 'cartwise.categoryLibrary'

// Added after the original ten. New ids only — renaming an existing one would
// silently reclassify everything already filed under it.
export const EXTRA_BUILT_INS = [
  { id: 'condiments', label: 'Condiments & Ingredients', sticker: 'oil' },
  { id: 'ready', label: 'Ready Meals', sticker: 'pasta' },
  { id: 'personal', label: 'Personal Care', sticker: 'spray' },
  { id: 'health', label: 'Health', sticker: 'jar' },
  { id: 'stationery', label: 'Stationery', sticker: 'paper' },
]

/** Every category the app ships with. Protected: never archivable, never renamed away. */
export const DEFAULT_CATEGORIES = [...BUILT_IN, ...EXTRA_BUILT_INS]

export const DEFAULT_IDS = DEFAULT_CATEGORIES.map((c) => c.id)

/** The fallback aisle. Nothing may archive it — every unmatched item lands here. */
export const FALLBACK_ID = 'other'

const CUSTOM_PREFIX = 'c-'

export const isCustom = (id) => String(id).startsWith(CUSTOM_PREFIX)
export const isDefault = (id) => DEFAULT_IDS.includes(id)

/** Empty library: nothing renamed, nothing archived, nothing custom. */
export const emptyLibrary = () => ({ labels: {}, archived: [], custom: [] })

/**
 * Make a stored library safe to use. Anything unrecognised is dropped rather
 * than rendered — a half-written custom category would otherwise show up as an
 * undefined row.
 */
export function normaliseLibrary(library) {
  const raw = library && typeof library === 'object' ? library : {}

  const custom = (Array.isArray(raw.custom) ? raw.custom : [])
    .filter((c) => c && isCustom(c.id) && String(c.label ?? '').trim())
    .map((c) => ({
      id: c.id,
      label: String(c.label).trim().slice(0, 40),
      sticker: c.sticker || 'basket',
    }))

  const validIds = new Set([...DEFAULT_IDS, ...custom.map((c) => c.id)])

  const labels = {}
  for (const [id, label] of Object.entries(raw.labels ?? {})) {
    const trimmed = String(label ?? '').trim()
    if (validIds.has(id) && trimmed) labels[id] = trimmed.slice(0, 40)
  }

  const archived = (Array.isArray(raw.archived) ? raw.archived : []).filter(
    // The fallback can never be archived: an item whose aisle is hidden has
    // to have somewhere to go, and that somewhere is Other.
    (id) => validIds.has(id) && id !== FALLBACK_ID,
  )

  return { labels, archived: [...new Set(archived)], custom }
}

/**
 * Every category that exists, in the given order, each carrying its effective
 * label and whether it is switched on.
 */
export function allCategories(library, order) {
  const lib = normaliseLibrary(library)
  const base = [...DEFAULT_CATEGORIES, ...lib.custom]
  const byId = new Map(base.map((c) => [c.id, c]))
  const archived = new Set(lib.archived)

  // Anything the order does not mention still has to appear, or a custom
  // category would vanish the moment it was created.
  const ids = [
    ...(Array.isArray(order) ? order : []).filter((id) => byId.has(id)),
    ...base.map((c) => c.id),
  ]

  const seen = new Set()
  const out = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    const category = byId.get(id)
    out.push({
      ...category,
      label: lib.labels[id] ?? category.label,
      active: !archived.has(id),
      custom: isCustom(id),
      protected: isDefault(id) && id === FALLBACK_ID,
    })
  }
  return out
}

/** Just the ones switched on — what the aisle pickers and the list should show. */
export const activeCategories = (library, order) =>
  allCategories(library, order).filter((c) => c.active)

/** Effective label for one id, falling back the way the artwork does. */
export function labelFor(library, id) {
  const lib = normaliseLibrary(library)
  if (lib.labels[id]) return lib.labels[id]
  const custom = lib.custom.find((c) => c.id === id)
  if (custom) return custom.label
  return (BUILT_IN_BY_ID[id] ?? DEFAULT_CATEGORIES.find((c) => c.id === id))?.label
    ?? BUILT_IN_BY_ID[FALLBACK_ID].label
}

export function stickerForCategory(library, id) {
  const lib = normaliseLibrary(library)
  const custom = lib.custom.find((c) => c.id === id)
  if (custom) return custom.sticker
  return (DEFAULT_CATEGORIES.find((c) => c.id === id) ?? BUILT_IN_BY_ID[FALLBACK_ID]).sticker
}

/* ------------------------------------------------------------ mutations */

export function renameCategory(library, id, label) {
  const lib = normaliseLibrary(library)
  const trimmed = String(label ?? '').trim().slice(0, 40)

  if (isCustom(id)) {
    return {
      ...lib,
      custom: lib.custom.map((c) => (c.id === id ? { ...c, label: trimmed || c.label } : c)),
    }
  }
  // A built-in keeps its id and gains a display name. Clearing the override
  // puts the shipped name back rather than leaving it blank.
  const labels = { ...lib.labels }
  if (trimmed) labels[id] = trimmed
  else delete labels[id]
  return { ...lib, labels }
}

export function addCustomCategory(library, label, sticker = 'basket') {
  const lib = normaliseLibrary(library)
  const trimmed = String(label ?? '').trim().slice(0, 40)
  if (!trimmed) return lib

  const id = `${CUSTOM_PREFIX}${
    crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }`
  return { ...lib, custom: [...lib.custom, { id, label: trimmed, sticker }] }
}

export function setCategoryActive(library, id, active) {
  const lib = normaliseLibrary(library)
  if (id === FALLBACK_ID) return lib // Other is always on.

  const archived = new Set(lib.archived)
  if (active) archived.delete(id)
  else archived.add(id)
  return { ...lib, archived: [...archived] }
}

/**
 * Delete a custom category outright. Built-ins are never deleted — archiving
 * is the only thing on offer for them, because their id is load-bearing.
 *
 * Returns `{ library, reassignFrom }`: anything filed under the deleted id has
 * to be moved to the fallback, and that is the caller's job since only it
 * holds the lists.
 */
export function deleteCustomCategory(library, id) {
  const lib = normaliseLibrary(library)
  if (!isCustom(id)) return { library: lib, reassignFrom: null }

  const labels = { ...lib.labels }
  delete labels[id]
  return {
    library: {
      labels,
      archived: lib.archived.filter((a) => a !== id),
      custom: lib.custom.filter((c) => c.id !== id),
    },
    reassignFrom: id,
  }
}

/** How many things are filed under a category, so the UI can warn before hiding it. */
export function countUnder(id, { carts = [], vault = [], pantry = [] } = {}) {
  let n = 0
  for (const cart of carts) for (const item of cart.items ?? []) if (item.category === id) n += 1
  for (const item of vault) if (item.category === id) n += 1
  for (const item of pantry) if (item.category === id) n += 1
  return n
}
