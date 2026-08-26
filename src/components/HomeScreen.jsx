import { useMemo, useState } from 'react'
import { formatMoney, sumLines } from '../money.js'
import { insights } from '../trips.js'
import { needsAttention } from '../pantry.js'
import { PURPOSES, byPurpose } from '../carts.js'
import { backgroundOf, backgroundStyle } from '../backgrounds.js'
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
  name,
  onNameChange,
  onOpenCart,
  onNewCart,
  onOpenExpiry,
}) {
  const [adding, setAdding] = useState(null) // purpose id being added to
  const [draft, setDraft] = useState('')
  const stats = useMemo(() => insights(trips), [trips])
  const attention = needsAttention(pantry)
  const groups = useMemo(() => byPurpose(carts), [carts])

  const since = trips.length
    ? dateFormat.format(new Date(Math.min(...trips.map((t) => t.completedAt))))
    : null

  function submitNew(purposeId) {
    onNewCart(draft, purposeId)
    setDraft('')
    setAdding(null)
  }

  return (
    <div className="home">
      <section className="greeting">
        <div className="greeting__decor" aria-hidden="true">
          {DECOR.map((id, i) => (
            <Sticker key={id} id={id} size={30} tilt={DECOR_TILT[i]} />
          ))}
        </div>

        <h1 className="greeting__hi">
          Hey{name ? `, ${name}` : ''} <Icon name="wave" size={26} className="greeting__wave" />
        </h1>

        {stats ? (
          <>
            <p className="greeting__line">
              You've kept back{' '}
              <strong className="greeting__good">{formatMoney(stats.savedVsBudget)}</strong>
              {since && <> since {since}</>}, across {stats.tripCount}{' '}
              {stats.tripCount === 1 ? 'trip' : 'trips'}.
            </p>
            {stats.overspend > 0 && (
              <p className="greeting__line greeting__line--sub">
                You've also gone{' '}
                <strong className="greeting__bad">{formatMoney(stats.overspend)}</strong> over on
                other trips — the two aren't netted off, so both stay honest.
              </p>
            )}
          </>
        ) : (
          <p className="greeting__line">
            {name
              ? 'Finish your first trip and your savings will show up here.'
              : 'Add your name in Settings and finish a trip — your savings show up here.'}
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

      {groups.map(({ purpose, carts: group }) => (
        <section className="purpose" key={purpose.id}>
          <h2 className="purpose__head">
            <Icon name={purpose.icon} size={16} />
            {purpose.label}
            <span className="purpose__count">{group.length}</span>
          </h2>

          <ul className="cards">
            {group.map((cart) => {
              const { total, unpriced } = sumLines(cart.items)
              const done = cart.items.filter((i) => i.checked).length
              const pct = cart.items.length > 0 ? (done / cart.items.length) * 100 : 0
              const overBudget = cart.budget > 0 && total > cart.budget

              return (
                <li key={cart.id}>
                  <button
                    className="card card--tinted"
                    type="button"
                    onClick={() => onOpenCart(cart.id)}
                    style={backgroundStyle(backgroundOf(cart))}
                  >
                    <span className="card__head">
                      <span className="card__name">{cart.name}</span>
                      <span className={`card__total ${overBudget ? 'card__total--over' : ''}`}>
                        {formatMoney(total)}
                        {cart.budget > 0 && (
                          <span className="card__budget"> / {formatMoney(cart.budget)}</span>
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
                        <span className="card__progress-fill" style={{ width: `${pct}%` }} />
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
          </ul>
        </section>
      ))}

      {/* One "new list" control per purpose, so choosing what a list is for is
          part of making it rather than a setting to find afterwards. */}
      <section className="newlist">
        <h2 className="purpose__head">New list</h2>
        {adding ? (
          <div className="newlist__form">
            <input
              className="field__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew(adding)
                if (e.key === 'Escape') setAdding(null)
              }}
              placeholder={`Name this ${adding} list`}
              aria-label="List name"
              autoFocus
            />
            <button className="btn btn--primary" type="button" onClick={() => submitNew(adding)}>
              Create
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => setAdding(null)}>
              Cancel
            </button>
          </div>
        ) : (
          <ul className="newlist__choices">
            {PURPOSES.map((p) => (
              <li key={p.id}>
                <button
                  className="newlist__choice"
                  type="button"
                  onClick={() => {
                    setDraft('')
                    setAdding(p.id)
                  }}
                >
                  <Icon name={p.icon} size={18} />
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
