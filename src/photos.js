// Product cut-outs, kept apart from the rest of the data.
//
// Photos are the only thing here big enough to hit the ~5 MB localStorage
// ceiling, so they live under their own key. That way a full photo store can
// be reported and pruned without endangering lists, prices or trip history,
// and a failed write is something we can tell the user about instead of
// swallowing.

const KEY = 'cartwise.photos'

/** Photos follow the product name, so they survive Vault edits and re-adds. */
export const photoKey = (name) => String(name ?? '').trim().toLowerCase()

export function loadPhotos() {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Persist the whole map. Returns `{ ok }` rather than throwing, because
 * running out of storage is a normal thing for a photo to do and the caller
 * needs to say so.
 */
export function writePhotos(map) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map))
    return { ok: true }
  } catch (e) {
    const quota =
      e?.name === 'QuotaExceededError' ||
      e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e?.code === 22
    return { ok: false, reason: quota ? 'full' : 'blocked' }
  }
}

/** Rough size of the store in bytes — data URLs are ASCII, so length is close enough. */
export function approxBytes(map) {
  let n = 0
  for (const value of Object.values(map ?? {})) n += String(value).length
  return n
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
