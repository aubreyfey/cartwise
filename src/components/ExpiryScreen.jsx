import { useMemo, useState } from 'react'
import ExpiryTimeline from './ExpiryTimeline.jsx'
import { CATEGORY_BY_ID, guessCategory } from '../categories.js'
import { UNITS, DEFAULT_UNIT, formatQty, normalizeQty } from '../units.js'
import {
  DEFAULT_PLACE,
  PLACES,
  PLACE_BY_ID,
  QUICK_SETS,
  REMINDER_LEADS,
  byPlace,
  byUrgency,
  dateInDays,
  daysUntil,
  dueItems,
  placeOf,
} from '../pantry.js'
import { suggest } from '../vault.js'
import { photoKey } from '../photos.js'
import { stickerFor } from '../stickerCatalog.js'
import Sticker from '../stickers.jsx'
import Thumb from './Thumb.jsx'
import Icon from '../icons.jsx'

function relativeLabel(days) {
  if (days === null) return 'no date'
  if (days < -1) return `${Math.abs(days)} days ago`
  if (days === -1) return 'yesterday'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

export default function ExpiryScreen({
  pantry,
  vault,
  photos,
  notifyState,
  onEnableNotifications,
  onAdd,
  onRemove,
  onResolve,
  onUpdate,
  onPhoto,
  onTrackPurchased,
}) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState(DEFAULT_UNIT)
  const [expiresAt, setExpiresAt] = useState('')
  const [place, setPlace] = useState(DEFAULT_PLACE)
  const [grouping, setGrouping] = useState('timeline')

  const groups = useMemo(
    () =>
      grouping === 'timeline'
        ? []
        : grouping === 'place'
        ? byPlace(pantry).map((g) => ({ key: g.place.id, head: g.place, items: g.items, kind: 'place' }))
        : byUrgency(pantry).map((g) => ({ key: g.bucket.id, head: g.bucket, items: g.items, kind: 'bucket' })),
    [pantry, grouping],
  )
  const suggestions = useMemo(() => suggest(vault, name, { limit: 5 }), [vault, name])
  const due = dueItems(pantry).length

  function submit(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({
      name: trimmed,
      category: guessCategory(trimmed),
      qty: normalizeQty(qty, unit),
      unit,
      expiresAt,
      place,
      // Default to a day's warning; it is the reminder people actually want.
      remindDays: expiresAt ? 1 : null,
    })
    setName('')
    setQty('1')
    setExpiresAt('')
  }

  return (
    <div className="expiry">
      <header className="screen-head">
        <h1 className="screen-head__title">Expiry</h1>
        <div className="segmented" role="group" aria-label="Group by">
          {[
            ['timeline', 'Timeline'],
            ['urgency', 'By date'],
            ['place', 'By place'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`segmented__btn ${grouping === id ? 'segmented__btn--on' : ''}`}
              onClick={() => setGrouping(id)}
              aria-pressed={grouping === id}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {grouping === 'timeline' ? (
        pantry.length === 0 ? (
          <p className="empty">
            Nothing tracked yet. Add what is in the fridge and CartWise will tell
            you what needs eating first.
          </p>
        ) : (
          <ExpiryTimeline
            pantry={pantry}
            photos={photos}
            onResolve={onResolve}
            onRemove={onRemove}
          />
        )
      ) : null}

      {onTrackPurchased && (
        <button className="trackcta" type="button" onClick={onTrackPurchased}>
          <span className="trackcta__icon" aria-hidden="true">
            <Icon name="calendar" size={20} />
          </span>
          <span className="trackcta__text">
            <strong>Track item expiry</strong>
            <span>Pick something you've bought and say when it goes off</span>
          </span>
          <span className="trackcta__chevron" aria-hidden="true">
            ›
          </span>
        </button>
      )}

      {notifyState !== 'granted' && pantry.length > 0 && (
        <button className="notifycard" type="button" onClick={onEnableNotifications}>
          <Icon name="bell" size={19} />
          <span className="notifycard__text">
            <strong>
              {notifyState === 'denied'
                ? 'Reminders are blocked'
                : 'Remind me what needs eating'}
            </strong>
            <span className="notifycard__sub">
              {notifyState === 'denied'
                ? 'Allow notifications for this site in your browser settings.'
                : 'CartWise checks when you open it and tells you what is due.'}
            </span>
          </span>
        </button>
      )}

      {notifyState === 'granted' && due > 0 && (
        <p className="notifycard notifycard--quiet">
          <Icon name="bell" size={17} />
          <span className="notifycard__text">
            <strong>
              {due} {due === 1 ? 'reminder' : 'reminders'} due
            </strong>
            <span className="notifycard__sub">
              Shown when you open CartWise. A web app cannot notify you while it
              is closed.
            </span>
          </span>
        </p>
      )}

      <form className="add-form" onSubmit={submit}>
        <div className="add-form__combo">
          <input
            className="add-form__name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What did you put away?"
            aria-label="Item name"
            autoComplete="off"
          />
        </div>

        {suggestions.length > 0 && (
          <ul className="quickpicks">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="quickpick"
                  onClick={() => {
                    setName(s.name)
                    setUnit(s.unit ?? DEFAULT_UNIT)
                  }}
                >
                  <Sticker id={stickerFor(s.name, s.category)} size={18} />
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="add-form__row">
          <label className="field">
            <span className="field__label">Qty</span>
            <input
              className="field__input field__input--qty"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Per</span>
            <select
              className="field__input field__input--unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--grow">
            <span className="field__label">Use by</span>
            <input
              className="field__input"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
        </div>

        {/* One tap instead of wrestling a date picker for the common cases. */}
        <div className="quickset">
          {QUICK_SETS.map((q) => (
            <button
              key={q.id}
              type="button"
              className={`quickset__btn ${expiresAt === dateInDays(q.days) ? 'quickset__btn--on' : ''}`}
              onClick={() => setExpiresAt(dateInDays(q.days))}
            >
              {q.label}
            </button>
          ))}
          {expiresAt && (
            <button
              type="button"
              className="quickset__btn quickset__btn--clear"
              onClick={() => setExpiresAt('')}
            >
              Clear
            </button>
          )}
        </div>

        <div className="places">
          {PLACES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`places__btn ${place === p.id ? 'places__btn--on' : ''}`}
              onClick={() => setPlace(p.id)}
              aria-pressed={place === p.id}
            >
              <Icon name={p.icon} size={15} />
              {p.label}
            </button>
          ))}
        </div>

        <button className="btn btn--primary" type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>

      {grouping !== 'timeline' && (groups.length === 0 ? (
        <p className="empty">
          Nothing tracked yet. Add what is in the fridge and CartWise will tell
          you what needs eating first.
        </p>
      ) : (
        groups.map((group) => (
          <section
            className={`section urgency ${group.kind === 'bucket' ? `urgency--${group.head.tone}` : ''}`}
            key={group.key}
          >
            <header className="section__header">
              <span
                className={`section__tag ${group.kind === 'bucket' ? `section__tag--${group.head.tone}` : ''}`}
              >
                {group.kind === 'place' && <Icon name={group.head.icon} size={13} />}
                {group.head.label}
              </span>
              <span className="section__meta">{group.items.length}</span>
            </header>

            <ul className="section__items">
              {group.items.map((item) => {
                const days = daysUntil(item.expiresAt)
                const category = CATEGORY_BY_ID[item.category] ?? CATEGORY_BY_ID.other
                const tone =
                  days === null ? 'ok' : days < 0 ? 'bad' : days <= 3 ? 'warn' : 'ok'
                return (
                  <li className="item item--pantry" key={item.id}>
                    <button
                      className="item__thumb item__thumb--button"
                      type="button"
                      onClick={() => onPhoto(item.name, item.category)}
                      aria-label={`Photo for ${item.name}`}
                      title="Make a sticker from a photo"
                    >
                      <Thumb
                        name={item.name}
                        category={item.category}
                        photo={photos?.[photoKey(item.name)]}
                        size={30}
                      />
                    </button>

                    <div className="item__main">
                      <p className="item__name">{item.name}</p>
                      <div className="item__sub">
                        <span>
                          {formatQty(item.qty)} {item.unit} · {category.label}
                        </span>
                        {grouping !== 'place' && (
                          <span className="item__place">
                            <Icon name={PLACE_BY_ID[placeOf(item)].icon} size={12} />
                            {PLACE_BY_ID[placeOf(item)].label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="item__right">
                      <input
                        className="urgency__date"
                        type="date"
                        value={item.expiresAt ?? ''}
                        onChange={(e) =>
                          onUpdate(item.id, { expiresAt: e.target.value || null })
                        }
                        aria-label={`Use-by date for ${item.name}`}
                      />
                      <span className={`urgency__when urgency__when--${tone}`}>
                        {relativeLabel(days)}
                      </span>
                    </div>

                    <div className="item__tools">
                      <select
                        className="item__remind"
                        value={item.remindDays ?? ''}
                        onChange={(e) =>
                          onUpdate(item.id, {
                            remindDays: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        aria-label={`Reminder for ${item.name}`}
                        disabled={!item.expiresAt}
                        title={item.expiresAt ? 'When to remind you' : 'Set a date first'}
                      >
                        <option value="">No reminder</option>
                        {REMINDER_LEADS.map((r) => (
                          <option key={r.days} value={r.days}>
                            {r.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className="item__remind"
                        value={placeOf(item)}
                        onChange={(e) => onUpdate(item.id, { place: e.target.value })}
                        aria-label={`Where ${item.name} is kept`}
                      >
                        {PLACES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>

                      {/* Eaten and thrown out are different facts. Both take
                          it off the list; only one of them is waste, and
                          keeping them apart is the point of recording either. */}
                      <button
                        className="expiry__resolve expiry__resolve--ate"
                        type="button"
                        onClick={() => onResolve(item.id, 'consumed')}
                        aria-label={`Mark ${item.name}${item.expiresAt ? ` due ${item.expiresAt}` : ''} as eaten`}
                        title="Eaten"
                      >
                        ✓ Ate it
                      </button>
                      <button
                        className="expiry__resolve expiry__resolve--binned"
                        type="button"
                        onClick={() => onResolve(item.id, 'discarded')}
                        aria-label={`Mark ${item.name}${item.expiresAt ? ` due ${item.expiresAt}` : ''} as thrown out`}
                        title="Thrown out"
                      >
                        Binned
                      </button>
                      <button
                        className="item__remove"
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Stop tracking ${item.name}${item.expiresAt ? ` due ${item.expiresAt}` : ''}`}
                        title="Stop tracking"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      ))}
    </div>
  )
}
