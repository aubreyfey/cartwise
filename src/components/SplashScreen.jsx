import { useEffect, useState } from 'react'
import Mascot from './Mascot.jsx'
import Icon from '../icons.jsx'

/**
 * The moment the app opens.
 *
 * Two rules kept this honest rather than decorative.
 *
 * It never delays anything. The app mounts underneath at the same time; this
 * is a layer over the top that leaves on its own. A launch screen that makes
 * someone wait to reach their shopping list has taken something from them in
 * exchange for a logo.
 *
 * And it is skippable — a tap dismisses it. Anyone who has seen it four
 * hundred times should not have to watch it again.
 */
const VISIBLE_MS = 1150
const FADE_MS = 380

export default function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Someone who has asked for less motion gets none of this: straight past.
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (still) {
      onDone()
      return undefined
    }

    // ?splashms=8000 holds it open. A launch screen is a second long by
    // design, which is exactly long enough to be impossible to photograph or
    // to judge the timing of.
    let visible = VISIBLE_MS
    try {
      const held = Number(new URLSearchParams(window.location.search).get('splashms'))
      if (Number.isFinite(held) && held > 0) visible = held
    } catch {
      // No URL to read; the default stands.
    }

    const leave = setTimeout(() => setLeaving(true), visible)
    const gone = setTimeout(onDone, visible + FADE_MS)
    return () => {
      clearTimeout(leave)
      clearTimeout(gone)
    }
  }, [onDone])

  return (
    <div
      className={`splash ${leaving ? 'splash--leaving' : ''}`}
      onClick={onDone}
      role="presentation"
      aria-hidden="true"
    >
      <div className="splash__stage">
        <span className="splash__mascot">
          <Mascot state="happy" size={124} />
        </span>

        <span className="splash__word">
          <Icon name="cart" size={26} strokeWidth={1.9} />
          CartWise
        </span>

        <span className="splash__line">The list that remembers what things cost</span>
      </div>
    </div>
  )
}
