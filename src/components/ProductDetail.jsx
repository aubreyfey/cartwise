import { useEffect, useMemo, useState } from 'react'
import { formatMoney, parsePrice } from '../money.js'
import { UNITS } from '../units.js'
import { historyFor, priceStats, storeComparison } from '../purchases.js'
import { expectedRange, paidRange, suggestExpected } from '../priceRange.js'
import { priceGap, productShops, seenAgo } from '../productMap.js'
import StoreMap from './StoreMap.jsx'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

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
 * shelf prices. CartWise has no retailer feed and the copy says so plainly,
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
    // What you expect this to cost. Kept apart from every other price here,
    // because those are records of what happened and this is your opinion
    // about what should.
    expectedLow: item.expectedLow != null ? String(item.expectedLow) : '',
    expectedHigh: item.expectedHigh != null ? String(item.expectedHigh) : '',
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
  const paid = useMemo(() => paidRange(purchases, item.id), [purchases, item.id])
  const expected = expectedRange(item)
  const shops = useMemo(
    () => productShops(purchases, stores, item.id),
    [purchases, stores, item.id],
  )
  const gap = useMemo(() => priceGap(shops), [shops])

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
      expectedLow: parsePrice(fields.expectedLow),
      expectedHigh: parsePrice(fields.expectedHigh),
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

        {onTrackExpiry && (
          <button className="pdetail__track" type="button" onClick={onTrackExpiry}>
            <span className="pdetail__track-icon" aria-hidden="true">
              <Icon name="calendar" size={18} />
            </span>
            <span className="pdetail__track-text">
              <strong>Track expiry</strong>
              <span>Say when this goes off and where it's kept</span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        )}

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

            {/* The two ranges, side by side and clearly labelled. One is what
                you have been charged; the other is what you think it should
                cost. Showing them together is the point — the second is much
                easier to set once you can see the first. */}
            <section className="prange">
              <h3 className="prange__head">Price range</h3>

              {paid ? (
                <p className="prange__paid">
                  You have paid{' '}
                  <strong>
                    {paid.spread
                      ? `${formatMoney(paid.low)}–${formatMoney(paid.high)}`
                      : formatMoney(paid.low)}
                  </strong>
                  {/* Naming both ends is only worth it when they are different
                      shops. "lowest at Savemore, highest at Savemore" is noise. */}
                  {paid.spread && paid.lowStore && paid.highStore && paid.lowStore !== paid.highStore && (
                    <span className="prange__where">
                      {' '}
                      · lowest at {paid.lowStore}, highest at {paid.highStore}
                    </span>
                  )}
                  <span className="prange__count">
                    {' '}
                    · from {paid.count} {paid.count === 1 ? 'price' : 'prices'}
                  </span>
                </p>
              ) : (
                <p className="prange__paid prange__paid--none">
                  No prices recorded yet, so there is nothing to draw a range
                  from.
                </p>
              )}

              <div className="prange__fields">
                <label className="field">
                  <span className="field__label">Expect from</span>
                  <input
                    className="field__input"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={fields.expectedLow}
                    onChange={(e) => set({ expectedLow: e.target.value })}
                    placeholder="—"
                  />
                </label>
                <label className="field">
                  <span className="field__label">to</span>
                  <input
                    className="field__input"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={fields.expectedHigh}
                    onChange={(e) => set({ expectedHigh: e.target.value })}
                    placeholder="—"
                  />
                </label>
              </div>

              <p className="prange__hint">
                {expected || fields.expectedLow || fields.expectedHigh
                  ? 'A price outside this is flagged on your list while you shop.'
                  : 'Set one and CartWise will flag a shelf price outside it while you shop.'}
              </p>

              {paid && (
                <button
                  className="btn btn--ghost btn--small"
                  type="button"
                  onClick={() => {
                    const s = suggestExpected(paid)
                    if (s) set({ expectedLow: String(s.low), expectedHigh: String(s.high) })
                  }}
                >
                  Use what I have paid
                </button>
              )}
            </section>

            {shops.all.length > 0 && (
              <section className="pmap">
                <h3 className="prange__head">Where you have bought it</h3>

                {gap && (
                  <p className="pmap__gap">
                    <strong>{formatMoney(gap.difference)}</strong> between{' '}
                    {gap.cheapest.name} and {gap.dearest.name}
                  </p>
                )}

                {/* Only shops whose location you have saved can be drawn. The
                    rest are listed below — they still sell the thing. */}
                {shops.located.length > 0 && (
                  <StoreMap
                    stores={shops.located.map((s) => ({
                      id: s.storeId ?? s.name,
                      name: s.name,
                      location: s.location,
                    }))}
                    labelFor={(store) => {
                      const row = shops.located.find((s) => s.name === store.name)
                      return row ? formatMoney(row.price) : null
                    }}
                  />
                )}

                <ul className="pmap__list">
                  {shops.all.map((s) => (
                    <li className={`pmap__row ${s.cheapest ? 'pmap__row--best' : ''}`} key={s.name}>
                      <span className="pmap__where">
                        <span className="pmap__name">{s.name}</span>
                        <span className="pmap__when">
                          {seenAgo(s.lastSeen) ?? 'date unknown'}
                          {!s.location && ' · no location saved'}
                        </span>
                      </span>
                      <span className="pmap__price">{formatMoney(s.price)}</span>
                    </li>
                  ))}
                </ul>

                <p className="pmap__note">
                  Prices you recorded, not live shelf prices. A shop appears on
                  the map once you have saved its location while standing in it.
                </p>
              </section>
            )}

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
              These are prices you recorded, not live shop prices — CartWise has
              no connection to any retailer. The date is when you last paid it.
            </p>
          </section>
        )}

        <button className="pdetail__delete" type="button" onClick={onDelete}>
          Forget this product
        </button>
      </div>
    </div>
  )
}
