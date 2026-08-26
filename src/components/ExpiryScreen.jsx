import { useMemo, useState } from 'react'
import { CATEGORY_BY_ID, guessCategory } from '../categories.js'
import { UNITS, DEFAULT_UNIT, formatQty, normalizeQty } from '../units.js'
import { byUrgency, daysUntil } from '../pantry.js'
import { suggest } from '../vault.js'
import Sticker, { stickerFor } from '../stickers.jsx'

function relativeLabel(days) {
  if (days === null) return 'no date'
  if (days < -1) return `${Math.abs(days)} days ago`
  if (days === -1) return 'yesterday'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

export default function ExpiryScreen({ pantry, vault, onAdd, onRemove, onUpdate, onBack }) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState(DEFAULT_UNIT)
  const [expiresAt, setExpiresAt] = useState('')

  const groups = useMemo(() => byUrgency(pantry), [pantry])
  const suggestions = useMemo(() => suggest(vault, name, { limit: 5 }), [vault, name])

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
    })
    setName('')
    setQty('1')
    setExpiresAt('')
  }

  return (
    <div className="expiry">
      <header className="screen-head">
        <button className="screen-head__back" type="button" onClick={onBack}>
          ‹ Home
        </button>
        <h1 className="screen-head__title">Expiry</h1>
      </header>

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

          <button className="btn btn--primary" type="submit" disabled={!name.trim()}>
            Add
          </button>
        </div>
      </form>

      {groups.length === 0 ? (
        <p className="empty">
          Nothing tracked yet. Add what's in the fridge and Cartwise will tell
          you what needs eating first.
        </p>
      ) : (
        groups.map(({ bucket, items }) => (
          <section className={`section urgency urgency--${bucket.tone}`} key={bucket.id}>
            <header className="section__header">
              <span className={`section__tag section__tag--${bucket.tone}`}>
                {bucket.label}
              </span>
              <span className="section__meta">{items.length}</span>
            </header>

            <ul className="section__items">
              {items.map((item) => {
                const days = daysUntil(item.expiresAt)
                const category = CATEGORY_BY_ID[item.category] ?? CATEGORY_BY_ID.other
                return (
                  <li className="item" key={item.id}>
                    <span className="item__thumb">
                      <Sticker id={stickerFor(item.name, item.category)} size={30} />
                    </span>

                    <div className="item__main">
                      <p className="item__name">{item.name}</p>
                      <div className="item__sub">
                        <span>
                          {formatQty(item.qty)} {item.unit} · {category.label}
                        </span>
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
                      <span className={`urgency__when urgency__when--${bucket.tone}`}>
                        {relativeLabel(days)}
                      </span>
                    </div>

                    <button
                      className="item__remove"
                      type="button"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
