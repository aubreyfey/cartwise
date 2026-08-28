import { useEffect } from 'react'

/**
 * Swipe in from the left edge to go back.
 *
 * The gesture every phone has, which this app did not: you had to find the
 * small back button in the corner. Deliberately narrow in what it accepts,
 * because the alternative to a missed swipe is a screen that vanishes while
 * someone is scrolling a list or dragging a quantity.
 *
 * The rules, all of which have to hold:
 *   - it starts within EDGE pixels of the left edge
 *   - it travels at least DISTANCE to the right
 *   - it stays roughly horizontal (more sideways than up and down)
 *   - only one finger is involved
 *
 * Nothing is prevented and nothing is animated: this listens passively and
 * fires once at the end. A gesture that fought the browser's own back swipe,
 * or that dragged the screen under the finger, would be a much larger promise
 * than it can keep on a page that also scrolls sideways in places.
 */
const EDGE = 28
const DISTANCE = 70

export function useEdgeSwipe(onBack, { enabled = true } = {}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !onBack) return undefined

    let startX = null
    let startY = null

    const onStart = (event) => {
      if (event.touches.length !== 1) {
        startX = null
        return
      }
      const touch = event.touches[0]
      startX = touch.clientX <= EDGE ? touch.clientX : null
      startY = touch.clientY
    }

    const onEnd = (event) => {
      if (startX === null) return
      const touch = event.changedTouches?.[0]
      startX = null
      if (!touch) return

      const dx = touch.clientX - EDGE
      const dy = Math.abs(touch.clientY - startY)
      // Horizontal enough, and far enough. A diagonal drag is someone
      // scrolling, not someone going back.
      if (dx >= DISTANCE && dy < dx) onBack()
    }

    // Passive: this never calls preventDefault, so it cannot make scrolling
    // feel heavy on the screens it is watching.
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onBack, enabled])
}
