import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PLACE,
  PLACES,
  QUICK_SETS,
  REMINDER_LEADS,
  dateInDays,
  suggestedExpiry,
} from '../pantry.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

const longDate = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

/**
 * Put one thing in the fridge and say when it goes off.
 *
 * Optional throughout: nothing here is required to finish a shop, and the
 * date arrives pre-filled from the aisle's rough shelf life only when we have
 * a reasonable guess. A wrong guess on a tin of beans is worse than a blank
 * field, so unlisted categories start empty.
 */
export default function TrackExpirySheet({
  product,
  storeName,
  categoryFor,
  notifyState,
  onEnableNotifications,
  onAdd,
  onCancel,
}) {
  const [date, setDate] = useState(
    () => suggestedExpiry(product.category) ?? dateInDays(7),
  )
  const [place, setPlace] = useState(product.place ?? DEFAULT_PLACE)
  const [remindDays, setRemindDays] = useState(1)
  const dateRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const parsed = date ? new Date(`${date}T00:00:00`) : null
  const readable = parsed && !Number.isNaN(parsed) ? longDate.format(parsed) : 'Pick a date'
  const wantsReminder = remindDays !== null
  const needsPermission = wantsReminder && notifyState !== 'granted'

  return (
    <div className="sheet" role="presentation" onMouseDown={onCancel}>
      <div
        className="trackx"
        role="dialog"
        aria-modal="true"
        aria-label={`Track expiry for ${product.name}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="trackx__bar">
          <button className="btn btn--ghost btn--small" type="button" onClick={onCancel}>
            Cancel
          </button>
          <h2 className="trackx__title">Track item expiry</h2>
          <button
            className="btn btn--primary btn--small"
            type="button"
            aria-label="Add to expiry tracking"
            disabled={!date}
            onClick={() =>
              onAdd({
                expiresAt: date,
                place,
                remindDays,
              })
            }
          >
            Add
          </button>
        </div>

        <div className="trackx__product">
          <span className="trackx__text">
            {storeName && (
              <span className="trackx__store">
                <Icon name="shelf" size={13} /> {storeName}
              </span>
            )}
            <span className="trackx__name">{product.name}</span>
            {product.packageSize && (
              <span className="trackx__size">
                {product.packageSize.value}
                {product.packageSize.unit}
              </span>
            )}
          </span>
          <Sticker id={categoryFor(product.category).sticker} size={44} tilt={-6} />
        </div>

        <div className="trackx__date">
          <p className="trackx__datebig">{readable}</p>
          <p className="trackx__datelabel">Expiry Date</p>
          {/* The real control, so the platform's own picker opens. */}
          <input
            ref={dateRef}
            className="trackx__input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Expiry date"
          />
        </div>

        <ul className="trackx__quick">
          <li className="trackx__quicklabel">Quick set</li>
          {QUICK_SETS.map((q) => {
            const value = dateInDays(q.days)
            return (
              <li key={q.id}>
                <button
                  type="button"
                  className={`trackx__chip ${date === value ? 'trackx__chip--on' : ''}`}
                  onClick={() => setDate(value)}
                  aria-pressed={date === value}
                >
                  +{q.label}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="trackx__notify">
          <span className="trackx__bell" aria-hidden="true">
            <Icon name="bell" size={17} />
          </span>
          <label className="trackx__notifylabel">
            Notify me
            <select
              value={remindDays === null ? 'none' : String(remindDays)}
              onChange={(e) =>
                setRemindDays(e.target.value === 'none' ? null : Number(e.target.value))
              }
              aria-label="Reminder"
            >
              {REMINDER_LEADS.map((lead) => (
                <option
                  key={lead.days === null ? 'none' : lead.days}
                  value={lead.days === null ? 'none' : lead.days}
                >
                  {lead.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {needsPermission && (
          <p className="trackx__perm">
            {notifyState === 'denied' ? (
              <>
                Reminders are blocked for CartWise in this browser's settings. The
                date is still saved and the Expiry screen still shows it.
              </>
            ) : (
              <>
                <button
                  className="btn btn--ghost btn--small"
                  type="button"
                  onClick={onEnableNotifications}
                >
                  Allow reminders
                </button>{' '}
                CartWise checks when you open it, so a reminder needs permission.
              </>
            )}
          </p>
        )}

        <div className="trackx__places">
          <p className="trackx__placeslabel">Group in</p>
          <ul className="trackx__placelist">
            {PLACES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`trackx__place trackx__place--${p.id} ${
                    place === p.id ? 'trackx__place--on' : ''
                  }`}
                  onClick={() => setPlace(p.id)}
                  aria-pressed={place === p.id}
                >
                  <Icon name={p.icon} size={16} /> {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
