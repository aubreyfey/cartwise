// Optional lookup for barcodes you haven't scanned before.
//
// This is the only outbound request the app ever makes, it is never automatic,
// and it sends nothing but the barcode digits — no list contents, no prices,
// no identifier. Everything else stays on the device.
//
// Open Food Facts is a public database with no key and no signup:
// https://world.openfoodfacts.org

const ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product'
const FIELDS = 'product_name,brands,quantity,categories_tags'
const TIMEOUT_MS = 6000

/** Map an Open Food Facts category tag onto one of our aisles. */
function aisleFromTags(tags = []) {
  const joined = tags.join(' ')
  if (/\b(fruit|vegetable|produce|fresh-food)/.test(joined)) return 'produce'
  if (/\b(bread|bakery|pastr)/.test(joined)) return 'bakery'
  if (/\b(meat|poultry|seafood|fish)/.test(joined)) return 'meat'
  if (/\b(dairy|milk|cheese|yogurt|egg)/.test(joined)) return 'dairy'
  if (/\bfrozen/.test(joined)) return 'frozen'
  if (/\b(snack|crisp|chip|biscuit|confectioner|chocolate)/.test(joined)) return 'snacks'
  if (/\b(beverage|drink|water|juice|soda)/.test(joined)) return 'drinks'
  return null
}

/**
 * Look a barcode up. Resolves to `{ name, category }` or null when the
 * product isn't in the database. Rejects only on network failure, which the
 * caller reports rather than swallowing — a silent failure here looks
 * identical to "not found" and would be confusing.
 */
export async function lookupBarcode(code) {
  const digits = String(code ?? '').replace(/\D/g, '')
  if (!digits) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${ENDPOINT}/${digits}.json?fields=${FIELDS}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null

    const body = await res.json()
    const product = body?.product
    if (!product) return null

    const parts = [product.brands?.split(',')[0]?.trim(), product.product_name?.trim()]
    const name = parts.filter(Boolean).join(' ').trim()
    if (!name) return null

    return {
      name: product.quantity ? `${name} (${product.quantity.trim()})` : name,
      category: aisleFromTags(product.categories_tags),
    }
  } finally {
    clearTimeout(timer)
  }
}
