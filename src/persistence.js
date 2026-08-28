// Asking the browser not to throw your data away.
//
// Everything CartWise knows lives in this browser's storage, and browsers
// treat that storage as disposable by default. Chrome evicts it when the disk
// runs low. Safari deletes all script-writable storage after seven days
// without a visit — the single exception being a site installed to the home
// screen. For an app whose entire value is a year of accumulated prices, that
// is not a footnote; it is the most likely way a user loses everything.
//
// The Storage API has a fix — navigator.storage.persist() — and nothing was
// calling it. Granting is at the browser's discretion and it will not always
// say yes, so this reports honestly rather than claiming safety it cannot
// deliver, and the honest answer is what Settings shows.

/** Is a durable-storage decision even available here? */
export const canPersist = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.storage &&
  typeof navigator.storage.persist === 'function'

/**
 * Ask for durable storage.
 *
 * Chrome decides from engagement signals — installed, bookmarked, frequently
 * visited — and often grants silently. Firefox prompts. Safari does not
 * implement it and installing to the home screen is the real fix there.
 *
 * Returns 'granted' | 'denied' | 'unavailable'. Never throws: a browser that
 * refuses to answer must not take the app down with it.
 */
export async function requestPersistence() {
  if (!canPersist()) return 'unavailable'
  try {
    if (await navigator.storage.persisted()) return 'granted'
    return (await navigator.storage.persist()) ? 'granted' : 'denied'
  } catch {
    return 'unavailable'
  }
}

/** What the browser currently says, without asking for a change. */
export async function persistenceState() {
  if (!canPersist()) return 'unavailable'
  try {
    return (await navigator.storage.persisted()) ? 'granted' : 'denied'
  } catch {
    return 'unavailable'
  }
}

/** Roughly how much room is left, or null when the browser will not say. */
export async function storageEstimate() {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
  try {
    const { usage, quota } = await navigator.storage.estimate()
    if (typeof usage !== 'number' || typeof quota !== 'number' || quota <= 0) return null
    return { usage, quota, ratio: usage / quota }
  } catch {
    return null
  }
}

export function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const DAY = 86_400_000

/**
 * How overdue a backup is.
 *
 * Deliberately not a nag. It stays quiet until there is something worth losing
 * — a Vault you could not retype from memory — and then it stays quiet again
 * for a month after each export. An alert that fires on an empty app teaches
 * people to dismiss alerts.
 */
export function backupUrgency({
  lastBackupAt = null,
  purchases = 0,
  trips = 0,
  now = Date.now(),
  persisted = false,
} = {}) {
  // Nothing accumulated yet: nothing to warn about.
  if (trips === 0 && purchases < 10) return { level: 'none', days: null }

  const days = lastBackupAt ? Math.floor((now - lastBackupAt) / DAY) : null

  if (days === null) {
    // Never backed up. Without durable storage that is the risky combination.
    return { level: persisted ? 'due' : 'overdue', days: null }
  }
  if (days >= 90) return { level: 'overdue', days }
  if (days >= 30) return { level: 'due', days }
  return { level: 'none', days }
}
