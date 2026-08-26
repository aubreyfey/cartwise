import { useEffect, useRef, useState } from 'react'
import { formatMoney, lineTotal, parsePrice } from '../money.js'
import { DEFAULT_UNIT, UNITS, formatQty, normalizeQty, stepFor, unitLabel } from '../units.js'
import Sticker, { stickerFor } from '../stickers.jsx'

export default function ItemRow({
  item,
  priceDelta,
  shopping,
  onToggle,
  onUpdate,
  onRemove,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const priceRef = useRef(null)
  // Escape closes the editor, which fires blur — this stops blur committing
  // the draft the user just abandoned.
  const cancelled = useRef(false)

  useEffect(() => {
    if (editing) priceRef.current?.select()
  }, [editing])

  const unit = item.unit ?? DEFAULT_UNIT
  const step = stepFor(unit)
  const total = lineTotal(item)

  function startEditing() {
    setDraft(item.price == null ? '' : String(item.price))
    cancelled.current = false
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    if (cancelled.current) return
    onUpdate(item.id, { price: parsePrice(draft) })
  }

  const setQty = (next) =>
    onUpdate(item.id, { qty: normalizeQty(Math.max(step, next), unit) })

  return (
    <li
      className={`item ${item.checked ? 'item--checked' : ''} ${
        shopping ? 'item--shopping' : ''
      }`}
    >
      <label className="item__check">
        <input type="checkbox" checked={item.checked} onChange={() => onToggle(item.id)} />
        <span className="item__box" aria-hidden="true" />
      </label>

      <span className="item__thumb">
        <Sticker id={stickerFor(item.name, item.category)} size={shopping ? 34 : 30} />
      </span>

      <div className="item__main">
        {/* While shopping the name is the tap target, so you can grab a whole
            row without aiming at the little circle. */}
        {shopping ? (
          <button
            className="item__name item__name--tap"
            type="button"
            onClick={() => onToggle(item.id)}
          >
            {item.name}
          </button>
        ) : (
          <p className="item__name">{item.name}</p>
        )}

        <div className="item__sub">
          <span className="qty">
            <button
              className="qty__btn"
              type="button"
              onClick={() => setQty(item.qty - step)}
              aria-label={`Less ${item.name}`}
              disabled={item.qty <= step}
            >
              −
            </button>
            <span className="qty__value">{formatQty(item.qty)}</span>
            <button
              className="qty__btn"
              type="button"
              onClick={() => setQty(item.qty + step)}
              aria-label={`More ${item.name}`}
            >
              +
            </button>
          </span>

          <span className="item__times" aria-hidden="true">
            ×
          </span>

          {editing ? (
            <span className="item__editor">
              <input
                ref={priceRef}
                className="item__price-input"
                type="text"
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit()
                  if (e.key === 'Escape') {
                    cancelled.current = true
                    setEditing(false)
                  }
                }}
                placeholder="price"
                aria-label={`Price of ${item.name}`}
              />
              <select
                className="item__unit-select"
                value={unit}
                onChange={(e) => onUpdate(item.id, { unit: e.target.value })}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label={`Unit for ${item.name}`}
              >
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    / {u.label}
                  </option>
                ))}
              </select>
            </span>
          ) : (
            <button
              className={`item__price ${item.price == null ? 'item__price--unknown' : ''}`}
              type="button"
              onClick={startEditing}
              aria-label={`Edit price of ${item.name}`}
            >
              {item.price == null ? 'Price unknown' : formatMoney(item.price)}
              <span className="item__unit"> / {unitLabel(unit)}</span>
            </button>
          )}
        </div>
      </div>

      <div className="item__right">
        {priceDelta != null && priceDelta !== 0 && (
          <span
            className={`item__delta ${priceDelta > 0 ? 'item__delta--up' : 'item__delta--down'}`}
            title={
              priceDelta > 0
                ? `Up ${formatMoney(Math.abs(priceDelta))} since you last bought this here`
                : `Down ${formatMoney(Math.abs(priceDelta))} since you last bought this here`
            }
          >
            {priceDelta > 0 ? '↑' : '↓'} {formatMoney(Math.abs(priceDelta))}
          </span>
        )}
        <span className={`item__total ${total === null ? 'item__total--unknown' : ''}`}>
          {total === null ? '—' : formatMoney(total)}
        </span>
      </div>

      {/* No delete button mid-shop — a stray tap in a supermarket aisle
          shouldn't be able to lose an item off the list. */}
      {!shopping && (
        <button
          className="item__remove"
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          ×
        </button>
      )}
    </li>
  )
}
