import { useMemo } from 'react'
import { formatMoney, sumLines } from '../money.js'
import { insights } from '../trips.js'
import { needsAttention } from '../pantry.js'
import { vaultSummary } from '../vaultStats.js'
import { backupUrgency } from '../persistence.js'
import { byPurpose } from '../carts.js'
import { PHOTO_BACKGROUND, backgroundOf, backgroundStyle } from '../backgrounds.js'
import Sticker, { stickerFor } from '../stickers.jsx'
import Icon from '../icons.jsx'

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
})

export default function HomeScreen({
  carts,
  listPhotos = {},
  trips,
  pantry,
  name,
  onNameChange,
  onOpenCart,
  onOpenExpiry,
  vault = [],
  purchases = [],
  onOpenVault,
  lastBackupAt = null,
  durable = null,
  onOpenSettings,
  backupSnoozedUntil = 0,
  onSnoozeBackup,
}) {
  const stats = useMemo(() => insights(trips), [trips])
  const attention = needsAttention(pantry)
  const vaultStats = useMemo(() => vaultSummary(vault, purchases), [vault, purchases])
  const backup = backupUrgency({
    lastBackupAt,
    purchases: purchases.length,
    trips: trips.length,
    persisted: durable === 'granted',
  })
  const groups = useMemo(() => byPurpose(carts), [carts])

  // Which advisory card, if any, earns the single slot above your lists.
  // Food going off beats a backup reminder: one is a thing to do today, the
  // other is a thing to do this month. Neither beats seeing your own lists.
  const backupDue =
    backup.level === 'overdue' && onOpenSettings && Date.now() > backupSnoozedUntil
  const advisory = attention > 0 ? 'expiry' : backupDue ? 'backup' : null

  const since = trips.length
    ? dateFormat.format(new Date(Math.min(...trips.map((t) => t.completedAt))))
    : null

  return (
    <div className="home">
      <section className="greeting">
        <h1 className="greeting__hi">
          Hey{name ? `, ${name}` : ''}
          {/* Waves once when the screen arrives, then stops. A hand that never
              stops waving stops reading as a greeting and starts reading as a
              loading spinner. */}
          <span className="wave" aria-hidden="true">
            👋
          </span>
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
        {onOpenVault && vaultStats.products > 0 && (
          <p className="greeting__line greeting__line--sub">
            <button className="greeting__vault" type="button" onClick={onOpenVault}>
              {vaultStats.products} {vaultStats.products === 1 ? 'product' : 'products'} in your
              Vault
              {vaultStats.pricesRecorded > 0 &&
                `, ${vaultStats.pricesRecorded} ${
                  vaultStats.pricesRecorded === 1 ? 'price' : 'prices'
                } kept`}
              <span aria-hidden="true"> ›</span>
            </button>
          </p>
        )}
      </section>

      {advisory === 'expiry' && (
      <button
        className="expiry-card expiry-card--alert"
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
      )}

      {advisory === 'backup' && (
        <div className="backup-card">
          <button className="backup-card__main" type="button" onClick={onOpenSettings}>
            <span className="expiry-card__icon" aria-hidden="true">
              <Icon name="save" size={22} />
            </span>
            <span className="expiry-card__text">
              <strong>Save a copy of your data</strong>
              <span className="expiry-card__sub">
                {backup.days === null
                  ? 'It lives on this device only and has never been backed up'
                  : `Last copy was ${backup.days} days ago`}
              </span>
            </span>
            <span className="expiry-card__chevron" aria-hidden="true">
              ›
            </span>
          </button>
          {onSnoozeBackup && (
            <button
              className="backup-card__later"
              type="button"
              onClick={() => onSnoozeBackup(Date.now() + 30 * 86400000)}
              aria-label="Remind me about backups later"
            >
              Later
            </button>
          )}
        </div>
      )}

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
                    className={`card card--tinted ${
                      backgroundOf(cart, listPhotos[cart.id]) === PHOTO_BACKGROUND
                        ? 'card--photo'
                        : ''
                    }`}
                    type="button"
                    onClick={() => onOpenCart(cart.id)}
                    style={backgroundStyle(
                      backgroundOf(cart, listPhotos[cart.id]),
                      listPhotos[cart.id],
                    )}
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

    </div>
  )
}
