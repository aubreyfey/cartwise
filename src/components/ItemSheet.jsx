import { useEffect, useRef, useState } from 'react'
import { CATEGORIES as BUILT_IN_CATEGORIES, guessCategory } from '../categories.js'
import { currencySymbol } from '../currency.js'
import { parsePrice } from '../money.js'
import {
  DEFAULT_UNIT,
  PACKAGE_UNITS,
  UNITS,
  normalizeQty,
  parsePackageSize,
} from '../units.js'
import { photoKey } from '../photos.js'
import Thumb from './Thumb.jsx'

/**
 * The full item editor, for when the one-line add box isn't enough: brand,
 * which shop the price is from, how it's sold, and what's printed on the
 * packet.
 *
 * Doubles as the editor for an existing row, so there's one place where an
 * item's details are defined rather than two that can drift apart.
 */
export default function ItemSheet({
  categories = BUILT_IN_CATEGORIES,
  item,
  stores,
  activeStoreId,
  photos,
  onSave,
  onPhoto,
  onCancel,
}) {
  const editing = Boolean(item?.id)
  const nameRef = useRef(null)

  const [fields, setFields] = useState(() => ({
    name: item?.name ?? '',
    brand: item?.brand ?? '',
    qty: String(item?.qty ?? 1),
    unit: item?.unit ?? DEFAULT_UNIT,
    price: item?.price == null ? '' : String(item.price),
    packageValue: item?.packageSize?.value ? String(item.packageSize.value) : '',
    packageUnit: item?.packageSize?.unit ?? 'g',
    storeId: item?.storeId ?? activeStoreId ?? '',
    category: item?.category ?? 'other',
  }))
  // Once the aisle is chosen by hand, stop re-guessing it from the name.
  const [pinnedCategory, setPinnedCategory] = useState(editing)

  const set = (key, value) => setFields((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (!editing) nameRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!pinnedCategory) {
      setFields((f) => ({ ...f, category: guessCategory(f.name) }))
    }
  }, [fields.name, pinnedCategory])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function submit(event) {
    event.preventDefault()
    const name = fields.name.trim()
    if (!name) return

    onSave({
      id: item?.id,
      name,
      brand: fields.brand.trim() || null,
      qty: normalizeQty(fields.qty, fields.unit),
      unit: fields.unit,
      price: parsePrice(fields.price),
      packageSize: parsePackageSize(fields.packageValue, fields.packageUnit),
      storeId: fields.storeId || null,
      category: fields.category,
    })
  }

  const symbol = currencySymbol()

  return (
    <div className="sheet" role="presentation" onMouseDown={onCancel}>
      <form
        className="receipt itemsheet"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="receipt__body">
          <h2 className="itemsheet__title">{editing ? 'Edit item' : 'New item'}</h2>

          <div className="itemsheet__head">
            <button
              className="itemsheet__thumb"
              type="button"
              onClick={() => onPhoto(fields.name || 'this item', fields.category)}
              title="Make a sticker from a photo"
              disabled={!fields.name.trim()}
            >
              <Thumb
                name={fields.name}
                category={fields.category}
                photo={photos?.[photoKey(fields.name)]}
                size={54}
              />
            </button>

            <div className="itemsheet__names">
              <input
                ref={nameRef}
                className="itemsheet__name"
                value={fields.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="What is it?"
                aria-label="Item name"
                autoComplete="off"
              />
              <input
                className="itemsheet__brand"
                value={fields.brand}
                onChange={(e) => set('brand', e.target.value)}
                placeholder="Brand (optional)"
                aria-label="Brand"
                autoComplete="off"
              />
            </div>
          </div>

          <label className="sheetfield">
            <span className="sheetfield__label">Store</span>
            <select
              className="sheetfield__control"
              value={fields.storeId}
              onChange={(e) => set('storeId', e.target.value)}
            >
              <option value="">Any store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="sheetrow">
            <label className="sheetfield">
              <span className="sheetfield__label">Sold by</span>
              <select
                className="sheetfield__control"
                value={fields.unit}
                onChange={(e) => set('unit', e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="sheetfield sheetfield--price">
              <span className="sheetfield__label">Price / {fields.unit}</span>
              <span className="sheetfield__money">
                <span className="sheetfield__symbol" aria-hidden="true">
                  {symbol}
                </span>
                <input
                  className="sheetfield__control sheetfield__control--money"
                  type="text"
                  inputMode="decimal"
                  value={fields.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="unknown"
                  aria-label="Price per unit"
                />
              </span>
            </label>
          </div>

          <div className="sheetrow">
            <label className="sheetfield">
              <span className="sheetfield__label">Quantity</span>
              <input
                className="sheetfield__control"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={fields.qty}
                onChange={(e) => set('qty', e.target.value)}
              />
            </label>

            <label className="sheetfield sheetfield--grow">
              <span className="sheetfield__label">Aisle</span>
              <select
                className="sheetfield__control"
                value={fields.category}
                onChange={(e) => {
                  set('category', e.target.value)
                  setPinnedCategory(true)
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="sheetfield sheetfield--package">
            <span className="sheetfield__label">
              Package size <span className="sheetfield__optional">(optional)</span>
            </span>
            <div className="packagesize">
              <input
                className="sheetfield__control packagesize__value"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={fields.packageValue}
                onChange={(e) => set('packageValue', e.target.value)}
                placeholder="—"
                aria-label="Package size"
              />
              <select
                className="sheetfield__control packagesize__unit"
                value={fields.packageUnit}
                onChange={(e) => set('packageUnit', e.target.value)}
                aria-label="Package size unit"
              >
                {PACKAGE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {fields.packageValue && (
                <button
                  className="packagesize__clear"
                  type="button"
                  onClick={() => set('packageValue', '')}
                  aria-label="Clear package size"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="itemsheet__actions">
            <button className="btn btn--ghost" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn--primary btn--wide"
              type="submit"
              disabled={!fields.name.trim()}
            >
              {editing ? 'Save' : 'Add item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
