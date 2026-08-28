import { useEffect, useMemo, useRef, useState } from 'react'
import {
  chipLabel,
  dayLabel,
  initialOffset,
  relativeDay,
  timelineDays,
  undatedItems,
} from '../expiryTimeline.js'
import { PLACE_BY_ID, placeOf } from '../pantry.js'
import Sticker, { stickerFor } from '../stickers.jsx'
import Icon from '../icons.jsx'

/**
 * The expiry list as a rail of days you swipe through.
 *
 * A static list groups by "expired / today / this week", which is how the data
 * is shaped rather than how anyone thinks about their fridge. The question
 * people actually ask is "what do I need to eat before the weekend", and that
 * is a question about days.
 *
 * Scroll-snapped, so a swipe lands on a day rather than between two. The
 * selected chip springs forward on an overshoot curve; the items below stagger
 * in. Both are CSS — this needs one spring and one stagger, and the browser
 * does both without a 34 KB animation library.
 */
export default function ExpiryTimeline({ pantry = [], photos = {}, onResolve, onRemove }) {
  const days = useMemo(() => timelineDays(pantry), [pantry])
  const undated = useMemo(() => undatedItems(pantry), [pantry])

  const [selected, setSelected] = useState(() => initialOffset(days))
  const rail = useRef(null)
  // Only scroll the rail on arrival, and when the app moves the selection
  // itself. Scrolling on every render would fight the user's own swipe.
  const centred = useRef(false)

  // If the pantry changes so much that the selected day disappears, fall back
  // to whatever now needs attention rather than showing an empty rail.
  useEffect(() => {
    if (!days.some((d) => d.offset === selected)) setSelected(initialOffset(days))
  }, [days, selected])

  useEffect(() => {
    if (centred.current || !rail.current) return
    const chip = rail.current.querySelector(`[data-offset="${selected}"]`)
    if (!chip) return
    chip.scrollIntoView({ block: 'nearest', inline: 'center' })
    centred.current = true
  }, [selected])

  const current = days.find((d) => d.offset === selected) ?? { offset: 0, items: [], count: 0 }

  function pick(offset, { scroll = false } = {}) {
    setSelected(offset)
    if (!scroll || !rail.current) return
    rail.current
      .querySelector(`[data-offset="${offset}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  function onKeyDown(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const index = days.findIndex((d) => d.offset === selected)
    const next = days[index + (event.key === 'ArrowRight' ? 1 : -1)]
    if (!next) return
    event.preventDefault()
    pick(next.offset, { scroll: true })
    rail.current?.querySelector(`[data-offset="${next.offset}"]`)?.focus()
  }

  return (
    <section className="etl" aria-label="Expiry timeline">
      <div
        className="etl__rail"
        ref={rail}
        role="tablist"
        aria-label="Days"
        onKeyDown={onKeyDown}
      >
        {days.map((day) => (
          <button
            key={day.offset}
            type="button"
            role="tab"
            className="etl__day"
            data-offset={day.offset}
            data-tone={day.tone ?? undefined}
            aria-selected={day.offset === selected}
            tabIndex={day.offset === selected ? 0 : -1}
            onClick={() => pick(day.offset, { scroll: true })}
          >
            <span className="etl__wd">{chipLabel(day.offset, day.date)}</span>
            <span className="etl__n">{new Date(day.date).getDate()}</span>
            <span className="etl__c">
              {day.count > 0 ? day.count : '—'}
              <span className="sr-only">
                {day.count === 1 ? ' item' : ' items'} on {dayLabel(day.offset, day.date)}
              </span>
            </span>
          </button>
        ))}
      </div>

      <header className="etl__head">
        <h2 className="etl__title">{dayLabel(current.offset, current.date)}</h2>
        <p className="etl__sub">
          {current.count > 0
            ? `${current.count} ${current.count === 1 ? 'item' : 'items'} · ${relativeDay(current.offset)}`
            : `Nothing goes off ${relativeDay(current.offset)}`}
        </p>
      </header>

      {current.count === 0 ? (
        <p className="etl__empty">
          {current.offset < 0
            ? 'Nothing went off that day.'
            : 'Nothing to use up. Swipe to another day.'}
        </p>
      ) : (
        <ul className="etl__items">
          {current.items.map((item, i) => {
            const place = PLACE_BY_ID[placeOf(item)]
            const photo = photos[String(item.name).trim().toLowerCase()]
            return (
              <li
                className={`etl__item etl__item--${current.tone}`}
                key={item.id}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <span className="etl__thumb" aria-hidden="true">
                  {photo ? (
                    <img src={photo} alt="" />
                  ) : (
                    <Sticker id={stickerFor(item.name, item.category)} size={22} />
                  )}
                </span>

                <span className="etl__text">
                  <span className="etl__name">{item.name}</span>
                  <span className="etl__meta">
                    {item.qty} {item.unit}
                    {place && (
                      <>
                        {' · '}
                        <Icon name={place.icon} size={12} /> {place.label}
                      </>
                    )}
                  </span>
                </span>

                {onResolve && (
                  <span className="etl__acts">
                    <button
                      className="etl__act etl__act--ate"
                      type="button"
                      onClick={() => onResolve(item.id, 'consumed')}
                      aria-label={`Mark ${item.name} as eaten`}
                      title="Eaten"
                    >
                      <Icon name="check" size={15} />
                    </button>
                    <button
                      className="etl__act etl__act--binned"
                      type="button"
                      onClick={() => onResolve(item.id, 'discarded')}
                      aria-label={`Mark ${item.name} as thrown out`}
                      title="Thrown out"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Anything the rail could not place. Shown rather than dropped: an item
          with an unreadable date is still being tracked, and silently hiding
          it would be the app losing something the user put in. */}
      {undated.length > 0 && (
        <div className="etl__undated">
          <h3 className="etl__undated-head">No date set</h3>
          <ul className="etl__items">
            {undated.map((item) => (
              <li className="etl__item" key={item.id}>
                <span className="etl__thumb" aria-hidden="true">
                  <Sticker id={stickerFor(item.name, item.category)} size={22} />
                </span>
                <span className="etl__text">
                  <span className="etl__name">{item.name}</span>
                  <span className="etl__meta">
                    {item.qty} {item.unit} · needs a date
                  </span>
                </span>
                {onRemove && (
                  <button
                    className="etl__act"
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Stop tracking ${item.name}`}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
