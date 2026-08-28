import { useMemo, useState } from 'react'
import { CATEGORY_BY_ID } from '../categories.js'
import { formatMoney } from '../money.js'
import { searchVault, vaultCategories } from '../vault.js'
import { VAULT_SORTS, sortVaultRows, vaultRows, vaultSummary } from '../vaultStats.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

const relative = (days) => {
  if (days === null) return null
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

/**
 * The Vault, as a screen rather than a drawer.
 *
 * The Vault was always the best idea in CartWise — the one part that gets more
 * valuable the longer you use it — and the worst screen. It was folded away
 * behind a toggle inside a list, nothing anywhere showed it growing, and the
 * one question you would actually ask it, "what do I usually pay for this?",
 * needed you to open every product in turn.
 *
 * So: a headline that counts what it knows, and rows that answer the question
 * without a tap. Everything shown is derived from purchases you recorded. When
 * there is no history the row says so, rather than inventing a number.
 */
export default function VaultScreen({
  vault = [],
  purchases = [],
  aisleOrder,
  categoryFor,
  onOpenProduct,
  onWhy,
  onAddToList,
  onList = [],
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)
  const [sort, setSort] = useState('recent')

  const summary = useMemo(() => vaultSummary(vault, purchases), [vault, purchases])
  const aisles = useMemo(() => vaultCategories(vault, aisleOrder), [vault, aisleOrder])

  const rows = useMemo(() => {
    const matching = searchVault(vault, { query, category })
    return sortVaultRows(vaultRows(matching, purchases), sort)
  }, [vault, purchases, query, category, sort])

  const onListNames = useMemo(
    () => new Set(onList.map((n) => String(n).toLowerCase())),
    [onList],
  )

  if (vault.length === 0) {
    return (
      <div className="vaultview">
        <header className="screen-head">
          <h1 className="screen-head__title">Vault</h1>
        </header>
        <p className="empty">
          Your Vault fills itself. Finish a trip and everything you bought is
          remembered here with what you paid — so next time you can add it in
          one tap, and CartWise can tell you when a price has moved.
        </p>
        {onWhy && (
          <button className="btn btn--ghost" type="button" onClick={onWhy}>
            <Icon name="sparkle" size={15} /> Why build your Vault?
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="vaultview">
      <header className="screen-head">
        <h1 className="screen-head__title">Vault</h1>
        {onWhy && (
          <button className="btn btn--ghost btn--small" type="button" onClick={onWhy}>
            What is this?
          </button>
        )}
      </header>

      {/* The growth signal. Counts, not a money figure — "your Vault is worth
          ₱4,000" would not mean anything. */}
      <ul className="vstat">
        <li className="vstat__cell">
          <strong className="vstat__num">{summary.products}</strong>
          <span className="vstat__label">{summary.products === 1 ? 'product' : 'products'}</span>
        </li>
        <li className="vstat__cell">
          <strong className="vstat__num">{summary.pricesRecorded}</strong>
          <span className="vstat__label">
            {summary.pricesRecorded === 1 ? 'price kept' : 'prices kept'}
          </span>
        </li>
        <li className="vstat__cell">
          <strong className="vstat__num">{summary.shops}</strong>
          <span className="vstat__label">{summary.shops === 1 ? 'shop' : 'shops'}</span>
        </li>
      </ul>

      {summary.withHistory > 0 ? (
        <p className="vaultview__note">
          {summary.withHistory} {summary.withHistory === 1 ? 'product has' : 'products have'} enough
          history to show which way the price is moving.
        </p>
      ) : (
        <p className="vaultview__note">
          Buy something a second time and CartWise will start showing you which
          way its price is moving.
        </p>
      )}

      <div className="vault__search vaultview__search">
        <Icon name="search" size={16} />
        <input
          className="vault__search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${vault.length} ${vault.length === 1 ? 'product' : 'products'}`}
          aria-label="Search your Vault"
          autoComplete="off"
        />
        {query && (
          <button
            className="vault__clear"
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {aisles.length > 1 && (
        <ul className="vault__aisles">
          <li>
            <button
              type="button"
              className={`vaisle ${category === null ? 'vaisle--on' : ''}`}
              onClick={() => setCategory(null)}
              aria-pressed={category === null}
            >
              <span className="vaisle__tile vaisle__tile--all">All</span>
              <span className="vaisle__count">{vault.length}</span>
            </button>
          </li>
          {aisles.map(({ id, count }) => {
            const cat = categoryFor ? categoryFor(id) : (CATEGORY_BY_ID[id] ?? CATEGORY_BY_ID.other)
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`vaisle ${category === id ? 'vaisle--on' : ''}`}
                  onClick={() => setCategory(category === id ? null : id)}
                  aria-pressed={category === id}
                  title={cat.label}
                >
                  <span className={`vaisle__tile vaisle__tile--${id}`}>
                    <Sticker id={cat.sticker} size={22} />
                  </span>
                  <span className="vaisle__count">{count}</span>
                  <span className="sr-only">{cat.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="vsort" role="group" aria-label="Sort products">
        {VAULT_SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`vsort__btn ${sort === s.id ? 'vsort__btn--on' : ''}`}
            onClick={() => setSort(s.id)}
            aria-pressed={sort === s.id}
          >
            {s.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="vault__empty">
          Nothing matches “{query}”{category && ' in this aisle'}.
        </p>
      ) : (
        <ul className="vault__rows vaultview__rows">
          {rows.map((row) => {
            const { item, stats, cheapest, shopCount, lastPaid, lastStore, change } = row
            const cat = categoryFor
              ? categoryFor(item.category)
              : (CATEGORY_BY_ID[item.category] ?? CATEGORY_BY_ID.other)
            const added = onListNames.has(String(item.name).toLowerCase())
            const when = relative(row.daysSince)

            return (
              <li className={`vrow vrow--rich ${added ? 'vrow--added' : ''}`} key={item.id}>
                <span className="vrow__thumb" aria-hidden="true">
                  <Sticker id={cat.sticker} size={20} />
                </span>

                <button
                  className="vrow__text vrow__text--open"
                  type="button"
                  onClick={() => onOpenProduct?.(item.id)}
                  disabled={!onOpenProduct}
                  aria-label={`${item.name} — price history and details`}
                >
                  <span className="vrow__name">
                    {item.brand && <span className="vrow__brand">{item.brand} </span>}
                    {item.name}
                    {item.packageSize && <span className="vrow__size"> ({item.packageSize})</span>}
                  </span>

                  {stats ? (
                    <>
                      <span className="vrow__price">
                        {/* The question this screen exists to answer. But one
                            observation is not "usually" — with a single price
                            the average is that price, and calling it a habit
                            would be the app claiming to know more than it
                            does. */}
                        {stats.count > 1 ? (
                          <>
                            <strong>{formatMoney(stats.average)}</strong> usually
                          </>
                        ) : (
                          <>
                            <strong>{formatMoney(lastPaid)}</strong>
                            <span className="vrow__once"> paid once</span>
                          </>
                        )}
                        {change !== null && Math.abs(change) >= 0.01 && (
                          <span
                            className={`vtrend ${change > 0 ? 'vtrend--up' : 'vtrend--down'}`}
                            title={
                              change > 0
                                ? 'Dearer than the first time you bought it'
                                : 'Cheaper than the first time you bought it'
                            }
                          >
                            {change > 0 ? '▲' : '▼'} {formatMoney(Math.abs(change))}
                          </span>
                        )}
                      </span>
                      <span className="vrow__meta">
                        {/* Repeating the price here when it is the only one we
                            have would just be the same number twice. */}
                        {stats.count > 1 && `${formatMoney(lastPaid)} `}
                        {lastStore && `at ${lastStore}`}
                        {when && ` · ${when}`}
                        {/* Only a finding when there was something to beat. */}
                        {cheapest && cheapest.storeName !== lastStore && (
                          <span className="vrow__cheapest">
                            {' '}
                            · cheapest {formatMoney(cheapest.price)} at {cheapest.storeName}
                          </span>
                        )}
                        {stats.count > 1 && ` · ${stats.count} prices`}
                        {shopCount > 1 && ` · ${shopCount} shops`}
                      </span>
                    </>
                  ) : (
                    <span className="vrow__price">
                      <span className="vrow__unpriced">
                        No price yet — record one on your next trip
                      </span>
                    </span>
                  )}
                </button>

                {onAddToList && (
                  <button
                    className="vrow__add"
                    type="button"
                    onClick={() => onAddToList(item)}
                    disabled={added}
                    aria-label={added ? `${item.name} is already on a list` : `Add ${item.name}`}
                    title={added ? 'Already on the list' : 'Add to the current list'}
                  >
                    {added ? '✓' : '+'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="vaultview__note vaultview__note--foot">
        These are prices you recorded, not live shelf prices. CartWise has no
        feed from any shop and will never pretend otherwise.
      </p>
    </div>
  )
}
