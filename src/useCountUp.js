import { useEffect, useRef, useState } from 'react'

/**
 * Roll a number to its new value instead of snapping to it.
 *
 * A total that jumps is a number being replaced. A total that rolls is a
 * consequence of what you just did — which is the whole point of showing a
 * running total while someone shops.
 *
 * Eased out rather than linear: fast at first, settling at the end. A linear
 * count reads as a slot machine.
 */
/**
 * @param {number} [from] where to start on the first render. Without it the
 *   hook begins at the value, so nothing rolls the first time it is seen —
 *   which is right for a running total already on screen, and wrong for a
 *   headline figure whose whole job is to arrive.
 */
export function useCountUp(value, { duration = 500, from: startAt } = {}) {
  const initial = typeof startAt === 'number' ? startAt : value
  const [shown, setShown] = useState(initial)
  const from = useRef(initial)
  const frame = useRef(0)

  useEffect(() => {
    const start = from.current
    const target = Number(value)

    // Nothing to animate, and NaN must never be handed to the renderer.
    if (!Number.isFinite(target)) {
      setShown(target)
      from.current = target
      return undefined
    }
    if (start === target) return undefined

    // Someone who has asked for less motion gets the number, immediately.
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (still) {
      setShown(target)
      from.current = target
      return undefined
    }

    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const next = start + (target - start) * eased
      setShown(next)
      if (p < 1) frame.current = requestAnimationFrame(tick)
      else from.current = target
    }
    frame.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame.current)
      // Whatever was on screen is where the next roll starts, so an
      // interrupted count does not jump backwards before going forwards.
      from.current = shown
    }
    // `shown` is deliberately not a dependency: it changes every frame, and
    // depending on it would restart the animation forty times a second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return shown
}
