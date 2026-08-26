import { useCallback, useEffect, useRef, useState } from 'react'
import { SLIDE_MS, TOUR_PANELS, clampPanel, tourImage, windowAround } from '../tour.js'

const REDUCED = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function TourScreen({ onDone }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStart = useRef(null)
  const headingRef = useRef(null)
  const base = import.meta.env.BASE_URL ?? '/'

  const last = index >= TOUR_PANELS.length - 1
  const panel = TOUR_PANELS[clampPanel(index)]
  const visible = windowAround(index)

  const go = useCallback((delta) => {
    setIndex((i) => clampPanel(i + delta))
  }, [])

  // Advance on its own, so it plays like a trailer rather than waiting to be
  // clicked. Stops at the end instead of looping — a tour that never finishes
  // has no obvious way out.
  useEffect(() => {
    if (paused || last || REDUCED()) return undefined
    const id = setTimeout(() => setIndex((i) => clampPanel(i + 1)), SLIDE_MS)
    return () => clearTimeout(id)
  }, [index, paused, last])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onDone()
      if (e.key === 'ArrowRight') { setPaused(true); go(1) }
      if (e.key === 'ArrowLeft') { setPaused(true); go(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onDone])

  // Announce each slide; the text lives in the image, so without this a
  // screen reader gets silence.
  useEffect(() => {
    headingRef.current?.focus()
  }, [index])

  function onTouchEnd(e) {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    if (Math.abs(dx) < 55) return
    setPaused(true)
    go(dx < 0 ? 1 : -1)
  }

  return (
    <div className="tour">
      <div className="tour__bars" aria-hidden="true">
        {TOUR_PANELS.map((p, i) => (
          <span className="tour__bar" key={p.id}>
            <span
              className={`tour__bar-fill ${i < index ? 'tour__bar-fill--done' : ''} ${
                i === index ? 'tour__bar-fill--live' : ''
              }`}
              style={
                i === index && !paused && !last
                  ? { animationDuration: `${SLIDE_MS}ms` }
                  : undefined
              }
            />
          </span>
        ))}
      </div>

      <div
        className="tour__stage"
        onTouchStart={(e) => {
          touchStart.current = e.changedTouches[0].clientX
        }}
        onTouchEnd={onTouchEnd}
      >
        <h1 className="tour__sr" tabIndex={-1} ref={headingRef}>
          {panel.title}. {panel.body}
        </h1>

        {TOUR_PANELS.map((p, i) => {
          if (!visible.has(i)) return null
          return (
            <img
              key={p.id}
              className={`tour__slide ${i === index ? 'tour__slide--on' : ''} ${
                i < index ? 'tour__slide--past' : ''
              }`}
              src={tourImage(p, base)}
              alt={i === index ? `${p.title}. ${p.body}` : ''}
              // The first slide is the largest thing on screen at startup, so
              // it is worth fetching eagerly; the rest can wait their turn.
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable="false"
            />
          )
        })}

        {/* Tap targets over the image, the way a story works. */}
        <button
          className="tour__half tour__half--left"
          type="button"
          onClick={() => { setPaused(true); go(-1) }}
          aria-label="Previous"
          disabled={index === 0}
        />
        <button
          className="tour__half tour__half--right"
          type="button"
          onClick={() => { setPaused(true); go(1) }}
          aria-label="Next"
          disabled={last}
        />
      </div>

      <div className="tour__buttons">
        <button className="btn btn--ghost" type="button" onClick={onDone}>
          {last ? 'Close' : 'Skip'}
        </button>
        <button
          className="btn btn--primary btn--wide"
          type="button"
          onClick={() => (last ? onDone() : (setPaused(true), go(1)))}
        >
          {last ? 'Start shopping' : 'Next'}
        </button>
      </div>
    </div>
  )
}
