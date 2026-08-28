// The part of the screen you can actually see.
//
// On iOS, 100vh is the whole viewport including the strip the keyboard is
// covering. A sheet sized at 92vh therefore extends behind the keyboard, and
// the search results and the Scan / Manual / Vault buttons end up underneath
// it — which is exactly what happens the moment you tap the + and start
// typing, the one flow this app most needs to work.
//
// dvh does not rescue this: it tracks the browser's own chrome, not the
// keyboard. The visual viewport API is the only thing that actually knows,
// so this publishes two custom properties from it:
//
//   --vvh   the visible height, keyboard excluded
//   --vvb   how much is obscured at the bottom, i.e. the keyboard
//
// Both are plain pixel values, set on the root, updated on resize. When the
// API is missing they fall back to the window height and zero, which is the
// behaviour everything had before.

let started = false

function publish() {
  const root = document.documentElement
  const vv = window.visualViewport

  if (!vv) {
    root.style.setProperty('--vvh', `${window.innerHeight}px`)
    root.style.setProperty('--vvb', '0px')
    return
  }

  // offsetTop matters when the page is pinch-zoomed or scrolled under the
  // keyboard; without it the inset comes out short and the sheet still
  // overlaps.
  const obscured = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)

  root.style.setProperty('--vvh', `${Math.round(vv.height)}px`)
  // Rounded and floored: a sub-pixel value here makes the sheet jitter as the
  // keyboard animates in.
  root.style.setProperty('--vvb', `${Math.round(obscured)}px`)
}

/**
 * Start tracking. Idempotent, so calling it from more than one place is safe,
 * and it does nothing at all outside a browser.
 */
export function trackViewport() {
  if (started || typeof window === 'undefined') return () => {}
  started = true

  publish()

  const vv = window.visualViewport
  vv?.addEventListener('resize', publish)
  // The keyboard can scroll the visual viewport without resizing it.
  vv?.addEventListener('scroll', publish)
  window.addEventListener('orientationchange', publish)
  window.addEventListener('resize', publish)

  return () => {
    started = false
    vv?.removeEventListener('resize', publish)
    vv?.removeEventListener('scroll', publish)
    window.removeEventListener('orientationchange', publish)
    window.removeEventListener('resize', publish)
  }
}

/** How much of the screen the keyboard is currently covering, in pixels. */
export function keyboardInset() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  if (!vv) return 0
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
}
