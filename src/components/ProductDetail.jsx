import { useEffect, useMemo, useState } from 'react'
import { formatMoney, parsePrice } from '../money.js'
import { UNITS } from '../units.js'
import { historyFor, priceStats, storeComparison } from '../purchases.js'
import Sticker from '../stickers.jsx'

const longDate = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})
const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

/**
 * One product, as a receipt: what it is, what it cost, and everywhere it has
 * cost that.
 *
 * The prices below the fold are every purchase you have recorded — not live
 * shelf prices. Cartwise has no retailer feed and the copy says so plainly,
 * because "Gaisano ₱289.50" read as a current price would be a claim the app
 * cannot support.
 */
export default function ProductDetail({
  item,
  purchases,
  stores = [],
  categories = [],
  onSave,
  onTrackExpiry,
  onDelete,
  onClose,
}) {
  const [fields, setFields] = useState(() => ({
    name: item.name ?? '',
    brand: item.brand ?? '',
    category: item.category ?? 'other',
    unit: item.unit ?? 'pc',
    price: item.price != null ? String(item.price) : '',
    packageValue: item.packageSize?.value ? String(item.packageSize.value) : '',
    packageUnit: item.packageSize?.unit ?? 'g',
  }))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const history = useMemo(() => historyFor(purchases, item.id), [purchases, item.id])
  const stats = useMemo(() => priceStats(purchases, item.id), [purchases, item.id])
  const byStore = useMemo(() => storeComparison(purchases, item.id), [purchases, item.id])

  const set = (patch) => setFields((f) => ({ ...f, ...patch }))
  const sticker =
    categories.find((c) => c.id === fields.category)?.sticker ?? 'basket'

  function submit() {
    const value = Number(fields.packageValue)
    onSave({
      name: fields.name.trim() || item.name,
      brand: fields.brand.trim() || null,
      category: fields.category,
      unit: fields.unit,
      price: parsePrice(fields.price),
      packageSize:
        Number.isFinite(value) && value > 0
          ? { value, unit: fields.packageUnit }
          : null,
    })
  }

  return (
    <div className="sheet" role="presentation" onMouseDown={onClose}>
      <div
        className="pdetail"
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pdetail__bar">
          <button className="btn btn--ghost btn--small" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary btn--small" type="button" onClick={submit}>
            Update
          </button>
        </div>

        <div className="receipt pdetail__receipt">
          <div className="receipt__body">
            <div className="pdetail__head">
              <input
                className="pdetail__name"
                value={fields.name}
                onChange={(e) => set({ name: e.target.value })}
                aria-label="Product name"
                maxLength={80}
              />
              <span className="pdetail__sticker" aria-hidden="true">
                <Sticker id={sticker} size={44} tilt={-8} />
              </span>
            </div>

            <input
              className="pdetail__brand"
              value={fields.brand}
              onChange={(e) => set({ brand: e.target.value })}
              placeholder="Brand (optional)"
              aria-label="Brand"
              maxLength={40}
            />

            <dl className="pdetail__rows">
              <div className="pdetail__row">
                <dt>Category</dt>
                <dd>
                  <select
                    className="pdetail__select"
                    value={fields.category}
                    onChange={(e) => set({ category: e.target.value })}
                    aria-label="Category"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>

              <div className="pdetail__row">
                <dt>Sold by</dt>
                <dd>
                  <select
                    className="pdetail__select"
                    value={fields.unit}
                    onChange={(e) => set({ unit: e.target.value })}
                    aria-label="Sold by"
                  >
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>

              <div className="pdetail__row">
                <dt>Price / {fields.unit}</dt>
                <dd>
                  <input
                    className="pdetail__price"
                    inputMode="decimal"
                    value={fields.price}
                    onChange={(e) => set({ price: e.target.value })}
                    placeholder="—"
                    aria-label="Price per unit"
                  />
                </dd>
              </div>

              <div className="pdetail__row">
                <dt>Package size</dt>
                <dd className="pdetail__package">
                  <input
                    className="pdetail__pkgvalue"
                    inputMode="decimal"
                    value={fields.packageValue}
                    onChange={(e) => set({ packageValue: e.target.value })}
                    placeholder="optional"
                    aria-label="Package size"
                  />
                  <select
                    className="pdetail__select"
                    value={fields.packageUnit}
                    onChange={(e) => set({ packageUnit: e.target.value })}
                    aria-label="Package size unit"
                  >
                    {['g', 'kg', 'ml', 'L', 'pc'].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>

              <div className="pdetail__row">
                <dt>Last bought</dt>
                <dd>{history.length ? longDate.format(history.at(-1).purchasedAt) : '—'}</dd>
              </div>

              {item.barcode && (
                <div className="pdetail__row">
                  <dt>Barcode</dt>
                  <dd className="pdetail__barcode">{item.barcode}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* ---------------------------------------------------- price history */}

        <section className="phistory">
          <h3 className="phistory__head">Price history</h3>

          {history.length === 0 ? (
            <p className="phistory__empty">
              No recorded purchases yet. Finish a shopping trip with this on the
              list and its price lands here.
            </p>
          ) : (
            <>
              {stats && stats.count > 1 && (
                <ul className="phistory__stats">
                  <li>
                    <span>Lowest</span>
                    <strong className="phistory__low">{formatMoney(stats.lowest.price)}</strong>
                    <small>{stats.lowest.storeName ?? '—'}</small>
                  </li>
                  <li>
                    <span>Average</span>
                    <strong>{formatMoney(stats.average)}</strong>
                    <small>{stats.count} buys</small>
                  </li>
                  <li>
                    <span>Highest</span>
                    <strong className="phistory__high">{formatMoney(stats.highest.price)}</strong>
                    <small>{stats.highest.storeName ?? '—'}</small>
                  </li>
                </ul>
              )}

              {stats?.change != null && stats.change !== 0 && (
                <p className="phistory__change">
                  {stats.change > 0 ? '↑' : '↓'} {formatMoney(Math.abs(stats.change))}{' '}
                  {stats.change > 0 ? 'dearer' : 'cheaper'} than the first time you
                  bought it.
                </p>
              )}

              <ul className="phistory__list">
                {[...history].reverse().map((record) => (
                  <li className="phrow" key={record.id}>
                    <span className="phrow__date">{shortDate.format(record.purchasedAt)}</span>
                    <span className="phrow__store">{record.storeName ?? 'No shop'}</span>
                    <span className="phrow__price">{formatMoney(record.price)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ------------------------------------------------- store comparison */}

        {byStore.length > 1 && (
          <section className="pcompare">
            <h3 className="phistory__head">Where you've bought it</h3>
            <ul className="pcompare__list">
              {byStore.map((row) => (
                <li
                  className={`pcrow ${row.cheapest ? 'pcrow--best' : ''}`}
                  key={row.storeId ?? 'none'}
                >
                  <span className="pcrow__store">{row.storeName ?? 'No shop'}</span>
                  <span className="pcrow__price">{formatMoney(row.price)}</span>
                  <span className="pcrow__seen">{shortDate.format(row.lastSeen)}</span>
                </li>
              ))}
            </ul>
            <p className="pcompare__caveat">
              These are prices you recorded, not live shop prices — Cartwise has
              no connection to any retailer. The date is when you last paid it.
            </p>
          </section>
        )}

        <div className="pdetail__foot">
          {onTrackExpiry && (
            <button className="btn btn--ghost btn--small" type="button" onClick={onTrackExpiry}>
              Track expiry
            </button>
          )}
          <button className="pdetail__delete" type="button" onClick={onDelete}>
            Forget this product
          </button>
        </div>
      </div>
    </div>
  )
}
