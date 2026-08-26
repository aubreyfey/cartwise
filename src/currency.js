// Currency is a per-device setting, not a build-time constant.
//
// Formatting goes through Intl, so decimal places follow the currency
// automatically — ₱1,234.50 and ¥1,235 are both correct without special
// casing here.

const STORAGE_KEY = 'cartwise.currency'

export const CURRENCIES = [
  { code: 'PHP', name: 'Philippine peso' },
  { code: 'USD', name: 'US dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British pound' },
  { code: 'JPY', name: 'Japanese yen' },
  { code: 'CNY', name: 'Chinese yuan' },
  { code: 'INR', name: 'Indian rupee' },
  { code: 'IDR', name: 'Indonesian rupiah' },
  { code: 'MYR', name: 'Malaysian ringgit' },
  { code: 'SGD', name: 'Singapore dollar' },
  { code: 'THB', name: 'Thai baht' },
  { code: 'VND', name: 'Vietnamese dong' },
  { code: 'KRW', name: 'South Korean won' },
  { code: 'HKD', name: 'Hong Kong dollar' },
  { code: 'TWD', name: 'New Taiwan dollar' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'NZD', name: 'New Zealand dollar' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'CHF', name: 'Swiss franc' },
  { code: 'SEK', name: 'Swedish krona' },
  { code: 'NOK', name: 'Norwegian krone' },
  { code: 'PLN', name: 'Polish złoty' },
  { code: 'CZK', name: 'Czech koruna' },
  { code: 'TRY', name: 'Turkish lira' },
  { code: 'AED', name: 'UAE dirham' },
  { code: 'SAR', name: 'Saudi riyal' },
  { code: 'ZAR', name: 'South African rand' },
  { code: 'NGN', name: 'Nigerian naira' },
  { code: 'KES', name: 'Kenyan shilling' },
  { code: 'EGP', name: 'Egyptian pound' },
  { code: 'BRL', name: 'Brazilian real' },
  { code: 'MXN', name: 'Mexican peso' },
  { code: 'ARS', name: 'Argentine peso' },
  { code: 'CLP', name: 'Chilean peso' },
  { code: 'COP', name: 'Colombian peso' },
]

const CODES = new Set(CURRENCIES.map((c) => c.code))

// Region -> currency, for guessing a sensible default on first run. Only
// covers the regions in the list above; anything else falls back to USD.
const BY_REGION = {
  PH: 'PHP', US: 'USD', GB: 'GBP', JP: 'JPY', CN: 'CNY', IN: 'INR',
  ID: 'IDR', MY: 'MYR', SG: 'SGD', TH: 'THB', VN: 'VND', KR: 'KRW',
  HK: 'HKD', TW: 'TWD', AU: 'AUD', NZ: 'NZD', CA: 'CAD', CH: 'CHF',
  SE: 'SEK', NO: 'NOK', PL: 'PLN', CZ: 'CZK', TR: 'TRY', AE: 'AED',
  SA: 'SAR', ZA: 'ZAR', NG: 'NGN', KE: 'KES', EG: 'EGP', BR: 'BRL',
  MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP',
  AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR',
  LT: 'EUR', LU: 'EUR', LV: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR',
  SI: 'EUR', SK: 'EUR',
}

/** Best guess from the browser's own locale. Falls back to USD. */
export function detectCurrency() {
  try {
    const locale = new Intl.NumberFormat().resolvedOptions().locale
    const region = new Intl.Locale(locale).maximize().region
    return BY_REGION[region] ?? 'USD'
  } catch {
    return 'USD'
  }
}

function load() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const code = JSON.parse(stored)
      if (CODES.has(code)) return code
    }
  } catch {
    // fall through to detection
  }
  return detectCurrency()
}

let current = typeof window === 'undefined' ? 'USD' : load()
let formatter = makeFormatter(current)

function makeFormatter(code) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code })
  } catch {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
  }
}

export const getCurrency = () => current

export function setCurrency(code) {
  if (!CODES.has(code)) return current
  current = code
  formatter = makeFormatter(code)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(code))
  } catch {
    // Setting still applies for this session.
  }
  return current
}

export function formatMoney(amount) {
  return formatter.format(Number.isFinite(amount) ? amount : 0)
}

/** The bare symbol, for placeholders and compact labels. */
export function currencySymbol(code = current) {
  try {
    return (
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
      })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? code
    )
  } catch {
    return code
  }
}
