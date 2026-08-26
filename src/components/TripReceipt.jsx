import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMoney, lineTotal } from '../money.js'
import { formatQty, unitLabel } from '../units.js'
import { isPerishable } from '../pantry.js'
import Sticker, { stickerFor } from '../stickers.jsx'
import Thumb from './Thumb.jsx'
import { photoKey } from '../photos.js'

// Fixed tilts so the collage looks hand-placed but doesn't reshuffle on
// every render.
const TILTS = [-12, 7, -5, 14, -9, 4, 11, -14, 6, -7, 9, -4]

export default function TripReceipt({ trip, photos, onConfirm, onCancel }) {
  const panelRef = useRef(null)

  // Perishables are offered for expiry tracking, ticked by default — those
  // are the ones worth a reminder. Everything else stays off unless asked for.
  const perishables = useMemo(
    () => (trip ? trip.items.filter((i) => isPerishable(i.category)) : []),
    [trip],
  )
  const [tracked, setTracked] = useState(() => new Set())
  const [trackKey, setTrackKey] = useState(null)

  // Reset the selection whenever a different trip opens the sheet.
  if (trip && trackKey !== trip.id) {
    setTrackKey(trip.id)
    setTracked(new Set(perishables.map((_, i) => i)))
  }

  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  if (!trip) return null

  function toggleTracked(index) {
    setTracked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const hasBudget = trip.budget > 0
  const diff = trip.budget - trip.total
  const under = diff >= 0

  return (
    <div className="sheet" role="presentation" onMouseDown={onCancel}>
      <div
        className="receipt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        tabIndex={-1}
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="receipt__body">
          <h2 className="receipt__title" id="receipt-title">
            Trip complete
          </h2>
          <p className="receipt__where">
            {trip.cartName}
            {trip.storeName && <> · {trip.storeName}</>}
          </p>

          <div className="collage">
            {trip.items.slice(0, 12).map((item, i) => (
              <span className="collage__item" key={`${item.name}-${i}`}>
                <Thumb
                  name={item.name}
                  category={item.category}
                  photo={photos?.[photoKey(item.name)]}
                  size={38}
                  tilt={TILTS[i % TILTS.length]}
                />
              </span>
            ))}
            {trip.items.length > 12 && (
              <span className="collage__more">+{trip.items.length - 12}</span>
            )}
          </div>

          <dl className="receipt__figures">
            <div>
              <dt>Budget</dt>
              <dd>{hasBudget ? formatMoney(trip.budget) : '—'}</dd>
            </div>
            <div>
              <dt>Spent</dt>
              <dd>{formatMoney(trip.total)}</dd>
            </div>
            <div>
              <dt>{under ? 'Saved' : 'Over'}</dt>
              <dd className={under ? 'figure--good' : 'figure--bad'}>
                {hasBudget ? (
                  <>
                    {formatMoney(Math.abs(diff))} {under ? '↓' : '↑'}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>

          {trip.unpriced > 0 && (
            <p className="receipt__caveat">
              {trip.unpriced} {trip.unpriced === 1 ? 'item has' : 'items have'} no
              price, so {trip.unpriced === 1 ? "it isn't" : "they aren't"} counted
              in that total.
            </p>
          )}

          <ul className="receipt__lines">
            {trip.items.map((item, i) => {
              const total = lineTotal(item)
              return (
                <li key={`${item.name}-line-${i}`}>
                  <span className="receipt__qty">
                    {formatQty(item.qty)} {unitLabel(item.unit)}
                  </span>
                  <span className="receipt__name">{item.name}</span>
                  <span className="receipt__amount">
                    {total === null ? '—' : formatMoney(total)}
                  </span>
                </li>
              )
            })}
          </ul>

          {perishables.length > 0 && (
            <div className="track">
              <h3 className="track__title">Track what goes off</h3>
              <p className="track__hint">
                We'll suggest a use-by date you can change. Untick anything you
                don't want reminding about.
              </p>
              <ul className="track__list">
                {perishables.map((item, index) => (
                  <li key={`${item.name}-track-${index}`}>
                    <label className="track__row">
                      <input
                        type="checkbox"
                        checked={tracked.has(index)}
                        onChange={() => toggleTracked(index)}
                      />
                      <Sticker
                        id={stickerFor(item.name, item.category)}
                        size={20}
                      />
                      <span className="track__name">{item.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="receipt__note">
            Bought items leave the list. Anything unchecked stays for next time.
          </p>

          <div className="receipt__actions">
            <button className="btn btn--ghost" type="button" onClick={onCancel}>
              Keep shopping
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => onConfirm(perishables.filter((_, i) => tracked.has(i)))}
            >
              Log this trip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
