// Everything lives in localStorage, which the browser can clear without
// warning — a cleared site, a "free up space" prompt, a reinstall. For a
// grocery app that's a year of remembered prices gone. So: an export you
// own, and an import that puts it back.

export const BACKUP_VERSION = 1

const KEYS = [
  'cartwise.carts',
  'cartwise.activeCart',
  'cartwise.vault',
  'cartwise.stores',
  'cartwise.trips',
  'cartwise.pantry',
  'cartwise.sort',
  'cartwise.currency',
  'cartwise.photos',
]

/** Everything worth keeping, as a plain object. */
export function collectBackup(read) {
  const data = {}
  for (const key of KEYS) {
    const value = read(key)
    if (value !== null && value !== undefined) data[key] = value
  }
  return {
    app: 'cartwise',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/**
 * Check a parsed backup before letting it near live storage.
 * Returns `{ ok: true, data }` or `{ ok: false, reason }`.
 */
export function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: "That file isn't a CartWise backup." }
  }
  if (parsed.app !== 'cartwise') {
    return { ok: false, reason: "That file is from a different app." }
  }
  if (typeof parsed.version !== 'number' || parsed.version > BACKUP_VERSION) {
    return {
      ok: false,
      reason: 'That backup is from a newer version of CartWise. Update first.',
    }
  }
  if (!parsed.data || typeof parsed.data !== 'object') {
    return { ok: false, reason: 'That backup has no data in it.' }
  }

  // Carts are the one thing whose shape we depend on everywhere; a backup
  // with a broken carts array would white-screen the app on load.
  const carts = parsed.data['cartwise.carts']
  if (carts !== undefined) {
    if (!Array.isArray(carts)) {
      return { ok: false, reason: 'That backup looks damaged (lists).' }
    }
    // .some, not .find — a null entry is exactly the damage we're checking
    // for, and `if (find(...))` would treat that null result as "all fine".
    const damaged = carts.some(
      (c) => !c || typeof c !== 'object' || !Array.isArray(c.items),
    )
    if (damaged) return { ok: false, reason: 'That backup looks damaged (list items).' }
  }

  for (const key of Object.keys(parsed.data)) {
    if (!KEYS.includes(key)) {
      return { ok: false, reason: `Unexpected data in the backup (${key}).` }
    }
  }

  return { ok: true, data: parsed.data }
}

/** A short human summary, so you know what you're about to restore. */
export function describeBackup(data) {
  const carts = data['cartwise.carts'] ?? []
  const vault = data['cartwise.vault'] ?? []
  const trips = data['cartwise.trips'] ?? []
  const items = carts.reduce((n, c) => n + (c.items?.length ?? 0), 0)
  const parts = [
    `${carts.length} ${carts.length === 1 ? 'list' : 'lists'}`,
    `${items} ${items === 1 ? 'item' : 'items'}`,
    `${vault.length} in the Vault`,
    `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`,
  ]
  return parts.join(' · ')
}

export function backupFilename(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `cartwise-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}
