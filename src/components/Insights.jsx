import { useMemo, useState } from 'react'
import { CATEGORY_BY_ID } from '../categories.js'
import { formatMoney } from '../money.js'
import { byRecent, insights } from '../trips.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
})

export default function Insights({ trips, onDeleteTrip }) {
  const [open, setOpen] = useState(false)
  const stats = useMemo(() => insights(trips), [trips])

  if (!stats) return null

  const recent = byRecent(trips)
  const topCategory = stats.byCategory[0]

  return (
    <section className="insights">
      <button
        className="insights__toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="insights__toggle-label">
          <Icon name="chart" size={16} /> Trips
          <span className="insights__count">{stats.tripCount}</span>
        </span>
        <span className="insights__headline">
          {formatMoney(stats.totalSpent)} spent
        </span>
        <span
          className={`insights__chevron ${open ? 'insights__chevron--open' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="insights__body">
          <dl className="insights__stats">
            <div className="stat">
              <dt>Average trip</dt>
              <dd>{formatMoney(stats.averageTrip)}</dd>
            </div>
            <div className="stat">
              <dt>Under budget</dt>
              <dd>
                {stats.budgetedCount > 0
                  ? `${stats.underBudgetCount} of ${stats.budgetedCount}`
                  : '—'}
              </dd>
            </div>
            <div className="stat">
              <dt>Kept back</dt>
              <dd className="stat--good">{formatMoney(stats.savedVsBudget)}</dd>
            </div>
            {stats.overspend > 0 && (
              <div className="stat">
                <dt>Overspent</dt>
                <dd className="stat--bad">{formatMoney(stats.overspend)}</dd>
              </div>
            )}
            {stats.plannedShare !== null && (
              <div className="stat">
                <dt>Stuck to the list</dt>
                <dd>{Math.round(stats.plannedShare * 100)}%</dd>
              </div>
            )}
            {stats.impulseItems > 0 && (
              <div className="stat">
                <dt>Impulse buys</dt>
                <dd className="stat--bad">
                  {formatMoney(stats.impulseSpend)}
                  <span className="stat__sub"> · {stats.impulseItems} items</span>
                </dd>
              </div>
            )}
          </dl>

          {stats.plannedShare !== null && stats.trackedTrips < stats.tripCount && (
            <p className="insights__note">
              Impulse figures cover the {stats.trackedTrips} of {stats.tripCount}{' '}
              trips logged since tracking started.
            </p>
          )}

          {stats.budgetedCount > 0 && (
            <p className="insights__note">
              "Kept back" totals only the trips that came in under budget —
              trips that went over are counted separately rather than cancelling
              it out.
            </p>
          )}

          {topCategory && (
            <>
              <h3 className="insights__subtitle">Where the money goes</h3>
              <ul className="breakdown">
                {stats.byCategory.slice(0, 6).map(({ id, amount }) => {
                  const category = CATEGORY_BY_ID[id] ?? CATEGORY_BY_ID.other
                  return (
                    <li key={id} className="breakdown__row">
                      <span className="breakdown__label">
                        <Sticker id={category.sticker} size={14} />{' '}
                        {category.label}
                      </span>
                      <span className="breakdown__bar" aria-hidden="true">
                        <span
                          className="breakdown__fill"
                          style={{ width: `${(amount / topCategory.amount) * 100}%` }}
                        />
                      </span>
                      <span className="breakdown__amount">{formatMoney(amount)}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {stats.byStore.length > 1 && (
            <>
              <h3 className="insights__subtitle">By store</h3>
              <ul className="breakdown">
                {stats.byStore.map(({ id, amount }) => (
                  <li key={id} className="breakdown__row breakdown__row--plain">
                    <span className="breakdown__label">{id}</span>
                    <span className="breakdown__amount">{formatMoney(amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="insights__subtitle">History</h3>
          <ul className="history">
            {recent.slice(0, 12).map((trip) => {
              const over = trip.budget > 0 && trip.total > trip.budget
              return (
                <li key={trip.id} className="history__row">
                  <span className="history__date">
                    {dateFormat.format(new Date(trip.completedAt))}
                  </span>
                  <span className="history__where">
                    {trip.cartName}
                    {trip.storeName && <span className="history__store"> · {trip.storeName}</span>}
                    <span className="history__items">
                      {' '}
                      · {trip.items.length}{' '}
                      {trip.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </span>
                  <span className={`history__total ${over ? 'history__total--over' : ''}`}>
                    {formatMoney(trip.total)}
                  </span>
                  <button
                    className="history__remove"
                    type="button"
                    onClick={() => onDeleteTrip(trip.id)}
                    aria-label={`Delete trip from ${dateFormat.format(new Date(trip.completedAt))}`}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
