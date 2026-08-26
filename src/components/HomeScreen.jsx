import { useMemo, useState } from 'react'
import { formatMoney, sumLines } from '../money.js'
import { byRecent, insights } from '../trips.js'
import { needsAttention } from '../pantry.js'
import { CURRENCIES, currencySymbol } from '../currency.js'
import Sticker, { stickerFor } from '../stickers.jsx'
import Icon from '../icons.jsx'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
})

const DECOR = ['banana', 'broccoli', 'bread', 'milk', 'cookie', 'bottle']
const DECOR_TILT = [-14, 9, -6, 12, -10, 5]

export default function HomeScreen({
  carts,
  trips,
  pantry,
  currency,
  onCurrencyChange,
  onOpenCart,
  onNewCart,
  onOpenExpiry,
  onDeleteTrip,
}) {
  const [tab, setTab] = useState('active')
  const stats = useMemo(() => insights(trips), [trips])
  const attention = needsAttention(pantry)

  const since = trips.length
    ? dateFormat.format(new Date(Math.min(...trips.map((t) => t.completedAt))))
    : null

  return (
    <div className="home">
      <section className="greeting">
        <div className="greeting__decor" aria-hidden="true">
          {DECOR.map((id, i) => (
            <Sticker key={id} id={id} size={30} tilt={DECOR_TILT[i]} />
          ))}
        </div>

        <h1 className="greeting__hi">
          Hey <Icon name="wave" size={26} className="greeting__wave" />
        </h1>

        {stats ? (
          <>
            <p className="greeting__line">
              You've kept back{' '}
              <strong className="greeting__good">
                {formatMoney(stats.savedVsBudget)}
              </strong>{' '}
              across {stats.tripCount} {stats.tripCount === 1 ? 'trip' : 'trips'}
              {since && <> since {since}</>}.
            </p>
            {stats.overspend > 0 && (
              <p className="greeting__line greeting__line--sub">
                You've also gone{' '}
                <strong className="greeting__bad">
                  {formatMoney(stats.overspend)}
                </strong>{' '}
                over on other trips — the two aren't netted off, so both stay
                honest.
              </p>
            )}
          </>
        ) : (
          <p className="greeting__line">
            Finish your first trip and your savings will show up here.
          </p>
        )}
      </section>

      <button
        className={`expiry-card ${attention > 0 ? 'expiry-card--alert' : ''}`}
        type="button"
        onClick={onOpenExpiry}
      >
        <span className="expiry-card__icon" aria-hidden="true">
          <Icon name="calendar" size={22} />
        </span>
        <span className="expiry-card__text">
          {attention > 0 ? (
            <>
              <strong>
                {attention} {attention === 1 ? 'item needs' : 'items need'} eating
              </strong>
              <span className="expiry-card__sub">expired or going off soon</span>
            </>
          ) : (
            <>
              <strong>Expiry</strong>
              <span className="expiry-card__sub">
                {pantry.length > 0
                  ? `${pantry.length} tracked, nothing urgent`
                  : 'Track what goes off and when'}
              </span>
            </>
          )}
        </span>
        <span className="expiry-card__chevron" aria-hidden="true">
          ›
        </span>
      </button>

      <label className="currency">
        <span className="currency__label">Currency</span>
        <select
          className="currency__select"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name} ({currencySymbol(c.code)})
            </option>
          ))}
        </select>
      </label>

      <div className="home__tabs" role="tablist">
        {[
          ['active', `Lists (${carts.length})`],
          ['history', `History (${trips.length})`],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`home__tab ${tab === id ? 'home__tab--on' : ''}`}
            onClick={() => setTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'active' ? (
        <ul className="cards">
          {carts.map((cart) => {
            const { total, unpriced } = sumLines(cart.items)
            const done = cart.items.filter((i) => i.checked).length
            const pct =
              cart.items.length > 0 ? (done / cart.items.length) * 100 : 0
            const overBudget = cart.budget > 0 && total > cart.budget

            return (
              <li key={cart.id}>
                <button
                  className="card"
                  type="button"
                  onClick={() => onOpenCart(cart.id)}
                >
                  <span className="card__head">
                    <span className="card__name">{cart.name}</span>
                    <span
                      className={`card__total ${overBudget ? 'card__total--over' : ''}`}
                    >
                      {formatMoney(total)}
                      {cart.budget > 0 && (
                        <span className="card__budget">
                          {' '}
                          / {formatMoney(cart.budget)}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="card__stickers" aria-hidden="true">
                    {cart.items.slice(0, 7).map((item, i) => (
                      <Sticker
                        key={item.id}
                        id={stickerFor(item.name, item.category)}
                        size={24}
                        tilt={i % 2 ? 7 : -7}
                      />
                    ))}
                    {cart.items.length === 0 && (
                      <span className="card__empty">Nothing on this list yet</span>
                    )}
                  </span>

                  {cart.items.length > 0 && (
                    <span className="card__progress">
                      <span
                        className="card__progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  )}

                  <span className="card__meta">
                    {done}/{cart.items.length} in the cart
                    {unpriced > 0 && (
                      <span className="card__unpriced"> · {unpriced} unpriced</span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}

          <li>
            <button className="card card--new" type="button" onClick={() => onNewCart()}>
              <span className="card--new__plus" aria-hidden="true">
                +
              </span>
              New list
            </button>
          </li>
        </ul>
      ) : (
        <ul className="cards">
          {trips.length === 0 ? (
            <li>
              <p className="empty">No trips logged yet.</p>
            </li>
          ) : (
            byRecent(trips).map((trip) => {
              const over = trip.budget > 0 && trip.total > trip.budget
              return (
                <li key={trip.id}>
                  <div className="card card--trip">
                    <span className="card__head">
                      <span className="card__name">
                        {trip.cartName}
                        {trip.storeName && (
                          <span className="card__store"> · {trip.storeName}</span>
                        )}
                      </span>
                      <span
                        className={`card__total ${over ? 'card__total--over' : ''}`}
                      >
                        {formatMoney(trip.total)}
                      </span>
                    </span>

                    <span className="card__stickers" aria-hidden="true">
                      {trip.items.slice(0, 7).map((item, i) => (
                        <Sticker
                          key={`${trip.id}-${i}`}
                          id={stickerFor(item.name, item.category)}
                          size={24}
                          tilt={i % 2 ? 7 : -7}
                        />
                      ))}
                    </span>

                    <span className="card__meta">
                      {dateFormat.format(new Date(trip.completedAt))} ·{' '}
                      {trip.items.length}{' '}
                      {trip.items.length === 1 ? 'item' : 'items'}
                      {trip.budget > 0 && (
                        <>
                          {' '}
                          ·{' '}
                          {over
                            ? `${formatMoney(trip.total - trip.budget)} over`
                            : `${formatMoney(trip.budget - trip.total)} under`}
                        </>
                      )}
                      <button
                        className="card__delete"
                        type="button"
                        onClick={() => onDeleteTrip(trip.id)}
                        aria-label={`Delete trip from ${dateFormat.format(new Date(trip.completedAt))}`}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
