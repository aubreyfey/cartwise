// Photographs used as list backgrounds, kept apart from everything else for
// the same reason product cut-outs are: they are the only thing here big
// enough to hit the ~5 MB localStorage ceiling, and a full store has to be
// reportable rather than something that silently eats a list.
//
// One photo per list, keyed by list id, downscaled hard before it is ever
// stored. See downscale() for the numbers and why.

const KEY = 'cartwise.listPhotos'

// A phone camera hands over something like 4032 x 3024. At list-background
// size that is thirty times more pixels than can be seen, and would fill the
// whole storage budget with one picture.
export const MAX_EDGE = 1000
export const QUALITY = 0.72

export function loadListPhotos() {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/** Returns `{ ok }` rather than throwing — a full store is a normal outcome. */
export function writeListPhotos(map) {
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

/**
 * The size to draw a photo at: longest edge capped, aspect kept, and never
 * enlarged — blowing a small picture up costs bytes and buys nothing.
 */
export function fitWithin(width, height, max = MAX_EDGE) {
  const w = Math.max(1, Math.round(width) || 1)
  const h = Math.max(1, Math.round(height) || 1)
  const scale = Math.min(max / w, max / h, 1)
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) }
}

/**
 * Draw an already-loaded image down to background size and hand back a data
 * URL. WebP where the browser has it, JPEG otherwise — a photograph in PNG is
 * several times the size for no visible gain.
 */
export function downscale(image, max = MAX_EDGE, quality = QUALITY) {
  const { width, height } = fitWithin(image.naturalWidth || image.width, image.naturalHeight || image.height, max)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, width, height)

  const webp = canvas.toDataURL('image/webp', quality)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality)
}

/** Read a File into an <img>, so the caller can hand it straight to downscale. */
export function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error("That file isn't an image we can read."))
      image.src = reader.result
    }
    reader.onerror = () => reject(new Error("Couldn't read that file."))
    reader.readAsDataURL(file)
  })
}

/** Rough size of the store — data URLs are ASCII, so length is close enough. */
export function approxBytes(map) {
  let n = 0
  for (const value of Object.values(map ?? {})) n += String(value).length
  return n
}
