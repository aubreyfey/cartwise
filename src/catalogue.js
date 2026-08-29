// The bundled product catalogue.
//
// Rows are `[barcode, name, brand, size]` rather than objects: at nine
// thousand products the key names would be most of the file. Loaded once, on
// the first search, and never as part of the main bundle — someone who only
// ever types their own list should not pay for it.
//
// Data © Open Food Facts contributors, ODbL 1.0. See the note in Settings.

let cache = null
let loading = null
// Which country the cache holds. Without this, switching country kept serving
// the first one loaded — the picker would appear to do nothing.
let cachedCountry = null

/** Strip a name to something matchable: lowercase, letters and digits only. */
const normalise = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * Fetch and index the catalogue. Resolves to [] on any failure — the Vault
 * search still works without it, so a missing catalogue is a quieter app
 * rather than a broken one.
 */
export async function loadCatalogue(base = '/', country = 'ph') {
  if (cache && cachedCountry === country) return cache
  if (loading && cachedCountry === country) return loading
  cachedCountry = country
  cache = null

  const url = `${base}catalogue/${country}.json`.replace(/\/{2,}/g, '/')

  loading = fetch(url)
    .then((res) => (res.ok ? res.json() : []))
    .then((rows) => {
      cache = (Array.isArray(rows) ? rows : []).map(([barcode, name, brand, size]) => ({
        barcode,
        name,
        brand: brand || null,
        size: size || null,
        // Precomputed once rather than on every keystroke of every search.
        haystack: normalise(`${name} ${brand}`),
      }))
      return cache
    })
    .catch(() => {
      loading = null
      return []
    })

  return loading
}

/** Already loaded? Lets the UI say "9,000 items" before anyone types. */
export const catalogueSize = () => cache?.length ?? 0

/**
 * Search the catalogue.
 *
 * Ranked the same way the Vault search is, so results from the two sources
 * can sit in one list without one of them looking arbitrary: a name that
 * starts with what you typed first, then a word inside the name, then a bare
 * substring, then brand matches.
 */
export function searchCatalogue(rows, query, { limit = 25 } = {}) {
  const q = normalise(query)
  if (!q || q.length < 2 || !rows?.length) return []

  const out = []
  for (const row of rows) {
    const hay = row.haystack
    let rank
    if (hay.startsWith(q)) rank = 0
    else if (hay.includes(` ${q}`)) rank = 1
    else if (hay.includes(q)) rank = 2
    else continue

    out.push({ row, rank })
    // Enough to rank well without walking the whole list for a common word.
    if (out.length > limit * 8) break
  }

  return out
    .sort((a, b) => a.rank - b.rank || a.row.name.length - b.row.name.length)
    .slice(0, limit)
    .map((hit) => hit.row)
}

/**
 * A catalogue row as something the list can hold.
 *
 * No price: Open Food Facts has none, and inventing one would poison the
 * budget and the Vault. It stays unknown until the shelf says otherwise,
 * which is the same state as any item typed by hand.
 */
export function toListItem(row, guessCategory) {
  const label = row.brand && !row.name.toLowerCase().startsWith(row.brand.toLowerCase())
    ? `${row.brand} ${row.name}`
    : row.name

  return {
    name: label.slice(0, 80),
    brand: row.brand,
    barcode: row.barcode,
    category: guessCategory(label),
    qty: 1,
    price: null,
    packageSize: row.size ?? null,
  }
}
