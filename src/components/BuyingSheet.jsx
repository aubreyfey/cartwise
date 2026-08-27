import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMoney, isKnownPrice, parsePrice } from '../money.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

/**
 * Confirm what you are actually putting in the trolley.
 *
 * The planned price is a guess from last time; the shelf price is the fact.
 * Catching the difference here is the only moment it can be caught, and it is
 * what makes the budget bar and the price history true rather than
 * approximate.
 *
 * Opening this on every check would be exhausting, so App only raises it while
 * shopping — planning still toggles straight through.
 */
export default function BuyingSheet({
  item,
  stores = [],
  activeStoreId,
  categoryFor,
  onConfirm,
  onCancel,
}) {
  const [qty, setQty] = useState(() => String(item.qty ?? 1))
  const [price, setPrice] = useState(() =>
    isKnownPrice(item.price) ? String(item.price) : '',
  )
  const [storeId, setStoreId] = useState(item.storeId ?? activeStoreId ?? '')
  const priceRef = useRef(null)

  // The price is the thing most likely to have changed, so it gets the caret.
  useEffect(() => {
    priceRef.current?.focus()
    priceRef.current?.select()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const parsedQty = Number(qty)
  const parsedPrice = parsePrice(price)
  const qtyValid = Number.isFinite(parsedQty) && parsedQty > 0

  // A blank price is allowed — "I bought it, I don't know what it cost" is a
  // real state the rest of the app already models as null.
  const priceValid = price.trim() === '' || parsedPrice !== null
  const valid = qtyValid && priceValid

  const changed =
    parsedQty !== (item.qty ?? 1) ||
    parsedPrice !== (isKnownPrice(item.price) ? item.price : null) ||
    (storeId || null) !== (item.storeId ?? activeStoreId ?? null)

  const lineTotal = useMemo(
    () => (qtyValid && parsedPrice !== null ? parsedQty * parsedPrice : null),
    [qtyValid, parsedQty, parsedPrice],
  )

  const unit = item.unit ?? 'pc'
  const sticker = categoryFor(item.category).sticker

  function confirm() {
    if (!valid) return
    onConfirm({ qty: parsedQty, price: parsedPrice, storeId: storeId || null })
  }

  return (
    <div className="sheet" role="presentation" onMouseDown={onCancel}>
      <div
        className="receipt buying"
        role="dialog"
        aria-modal="true"
        aria-label={`Buying ${item.name}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="receipt__body">
          <p className="buying__lede">
            You're buying{' '}
            <strong className="buying__name">{item.name}</strong>{' '}
            <span className="buying__sticker" aria-hidden="true">
              <Sticker id={sticker} size={22} />
            </span>
            <br />
            at{' '}
            <strong>
              {parsedPrice !== null ? formatMoney(parsedPrice) : '—'} per {unit}
            </strong>
          </p>

          {stores.length > 0 && (
            <label className="buying__store">
              <Icon name="shelf" size={15} />
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                aria-label="Store"
              >
                <option value="">No shop</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="buying__row">
            <input
              className={`buying__qty ${qtyValid ? '' : 'buying__field--bad'}`}
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              aria-label="Quantity"
            />
            <span className="buying__times" aria-hidden="true">
              ×
            </span>
            <span className={`buying__pricebox ${priceValid ? '' : 'buying__field--bad'}`}>
              <span className="buying__peso" aria-hidden="true">
                ₱
              </span>
              <input
                ref={priceRef}
                className="buying__price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="—"
                aria-label={`Price per ${unit}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirm()
                }}
              />
              <span className="buying__per">/ {unit}</span>
            </span>
          </div>

          {!qtyValid && (
            <p className="buying__error">Quantity has to be a number above zero.</p>
          )}
          {!priceValid && <p className="buying__error">That isn't a price.</p>}

          <div className="buying__total">
            <span>Line total:</span>
            <strong>{lineTotal !== null ? formatMoney(lineTotal) : '—'}</strong>
          </div>

          <div className="buying__actions">
            <button className="btn btn--ghost" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={confirm}
              disabled={!valid}
            >
              {changed ? 'Update' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
