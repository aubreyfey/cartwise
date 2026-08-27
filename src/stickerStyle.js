// Which pictures sit next to items: the device's own emoji, or the drawn
// vector set.
//
// On an iPhone the emoji are Apple's, drawn by the system font. That is the
// only legitimate way to put iOS emoji in an app — Apple Color Emoji is not
// licensed for redistribution, so anything claiming to bundle it is shipping
// artwork it does not own. Rendering the character instead asks the platform
// for its own, which on Apple's platform is exactly the set people mean.
//
// Elsewhere you get whatever that platform draws: Segoe UI Emoji on Windows,
// Noto on Android and most of Linux. The drawn set stays for anyone who would
// rather have one look everywhere, and it is what the marketing panels use,
// since another vendor's emoji in a store listing is their copyright, not
// ours.
//
// A tiny store rather than a context: Sticker is a leaf rendered in thirteen
// places, and App returns a different root per view, so there is no single
// place to hang a provider.

export const STICKER_STYLES = ['emoji', 'drawn']
export const DEFAULT_STICKER_STYLE = 'emoji'
export const STICKER_STYLE_KEY = 'cartwise.stickerStyle'

/** Anything unrecognised — an old value, a hand-edited key — reads as default. */
export function normaliseStickerStyle(value) {
  return STICKER_STYLES.includes(value) ? value : DEFAULT_STICKER_STYLE
}

/**
 * The stored choice, read without React. App applies it again in an effect,
 * but that runs after the first paint — so someone who picked the drawn set
 * would watch a frame of emoji swap out from under them.
 */
export function loadStickerStyle() {
  try {
    const stored = window.localStorage.getItem(STICKER_STYLE_KEY)
    return stored === null ? DEFAULT_STICKER_STYLE : normaliseStickerStyle(JSON.parse(stored))
  } catch {
    // No storage, or a value that is not JSON. The default is always safe.
    return DEFAULT_STICKER_STYLE
  }
}

let current = typeof window === 'undefined' ? DEFAULT_STICKER_STYLE : loadStickerStyle()
const listeners = new Set()

export function getStickerStyle() {
  return current
}

/**
 * Apply a style. Always writes the attribute — the first call happens on
 * mount, when nothing has changed yet but the DOM still needs stamping — and
 * only wakes subscribers when the value actually moved.
 */
export function setStickerStyle(value) {
  const next = normaliseStickerStyle(value)
  const changed = next !== current
  current = next

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.stickers = next
  }
  if (changed) {
    for (const listener of listeners) listener()
  }
  return next
}

export function subscribeToStickerStyle(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Test seam: drop every subscriber and go back to the default. */
export function resetStickerStyle() {
  listeners.clear()
  current = DEFAULT_STICKER_STYLE
}
