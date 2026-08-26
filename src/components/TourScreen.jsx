import { useCallback, useEffect, useRef, useState } from 'react'
import Sticker from '../stickers.jsx'
import { TOUR_PANELS, clampPanel } from '../tour.js'

const TILTS = [-11, 8, -6]

export default function TourScreen({ onDone }) {
  const [index, setIndex] = useState(0)
  const panel = TOUR_PANELS[clampPanel(index)]
  const last = index >= TOUR_PANELS.length - 1
  const touchStart = useRef(null)
  const headingRef = useRef(null)

  const go = useCallback((delta) => {
    setIndex((i) => clampPanel(i + delta))
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onDone()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onDone])

  // Move focus to the new heading on each panel so a screen reader announces
  // the change; without it, paging is silent.
  useEffect(() => {
    headingRef.current?.focus()
  }, [index])

  function onTouchEnd(e) {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    // Ignore small drags so a tap or a vertical scroll does not page.
    if (Math.abs(dx) < 60) return
    go(dx < 0 ? 1 : -1)
  }

  return (
    <div className={`tour tour--${panel.tone}`}>
      <div
        className="tour__stage"
        onTouchStart={(e) => {
          touchStart.current = e.changedTouches[0].clientX
        }}
        onTouchEnd={onTouchEnd}
      >
        <div className="tour__stickers" aria-hidden="true">
          {panel.stickers.map((id, i) => (
            <Sticker key={`${panel.id}-${id}-${i}`} id={id} size={72} tilt={TILTS[i % TILTS.length]} />
          ))}
        </div>

        <h1 className="tour__title" tabIndex={-1} ref={headingRef}>
          {panel.title}
        </h1>
        <p className="tour__body">{panel.body}</p>
      </div>

      <nav className="tour__nav" aria-label="Tour">
        <ol className="tour__dots">
          {TOUR_PANELS.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={`tour__dot ${i === index ? 'tour__dot--on' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Step ${i + 1} of ${TOUR_PANELS.length}: ${p.title}`}
                aria-current={i === index ? 'step' : undefined}
              />
            </li>
          ))}
        </ol>

        <div className="tour__buttons">
          <button className="btn btn--ghost" type="button" onClick={onDone}>
            {last ? 'Close' : 'Skip'}
          </button>
          {index > 0 && (
            <button className="btn btn--ghost" type="button" onClick={() => go(-1)}>
              Back
            </button>
          )}
          <button
            className="btn btn--primary btn--wide"
            type="button"
            onClick={() => (last ? onDone() : go(1))}
          >
            {last ? 'Start shopping' : 'Next'}
          </button>
        </div>
      </nav>
    </div>
  )
}
