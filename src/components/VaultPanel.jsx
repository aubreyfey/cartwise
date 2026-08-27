import { useMemo, useState } from 'react'
import { CATEGORY_BY_ID } from '../categories.js'
import { formatMoney } from '../money.js'
import { priceFor, priceSource, searchVault, vaultCategories } from '../vault.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

/**
 * Everything you have bought before, searchable.
 *
 * Rows rather than the chip cloud this used to be: once the Vault is a few
 * dozen items, a wall of chips is something you scan rather than read, and it
 * has nowhere to put the price, the unit or the size — which are the whole
 * reason to add from here rather than typing the name again.
 */
export default function VaultPanel({
  open: openProp,
  onOpenChange,
  purchases = [],
  categoryFor,
  onWhy,
  onOpenProduct,
  vault,
  stores = [],
  activeStoreId,
  aisleOrder,
  onQuickAdd,
  onRemove,
  onList,
}) {
  // Controlled when the parent passes `open` (the search sheet opens it),
  // self-managed otherwise.
  const [ownOpen, setOwnOpen] = useState(false)
  const open = openProp ?? ownOpen
  const setOpen = (next) => {
    const value = typeof next === 'function' ? next(open) : next
    setOwnOpen(value)
    onOpenChange?.(value)
  }
  const [managing, setManaging] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)

  const aisles = useMemo(() => vaultCategories(vault, aisleOrder), [vault, aisleOrder])
  const results = useMemo(
    () => searchVault(vault, { query, category }),
    [vault, query, category],
  )

  if (vault.length === 0) return null

  // Names already on the list — their rows show as added rather than inviting
  // a second tap.
  const onListNames = new Set(onList.map((n) => n.toLowerCase()))
  const storeName = (id) => stores.find((s) => s.id === id)?.name ?? null

  return (
    <section className="vault">
      <button
        className="vault__toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="vault__toggle-label">
          <Icon name="vault" size={16} /> Vault
          <span className="vault__count">{vault.length}</span>
        </span>
        <span className={`vault__chevron ${open ? 'vault__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && onWhy && (
        <button className="vault__why" type="button" onClick={onWhy} aria-label="Why build your Vault?">
          <Icon name="sparkle" size={14} /> Why build your Vault?
        </button>
      )}

      {open && (
        <div className="vault__body">
          <div className="vault__search">
            <Icon name="search" size={16} />
            <input
              className="vault__search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${vault.length} ${vault.length === 1 ? 'item' : 'items'} in your Vault`}
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
                const cat = CATEGORY_BY_ID[id] ?? CATEGORY_BY_ID.other
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

          {results.length === 0 ? (
            <p className="vault__empty">
              Nothing in your Vault matches “{query}”
              {category && ' in this aisle'}.
            </p>
          ) : (
            <ul className="vault__rows">
              {results.map((item) => {
                const added = onListNames.has(item.name.toLowerCase())
                const price = priceFor(item, activeStoreId)
                const source = priceSource(item, activeStoreId)
                const cat = categoryFor ? categoryFor(item.category) : (CATEGORY_BY_ID[item.category] ?? CATEGORY_BY_ID.other)
                const from = source && source !== 'anywhere' ? storeName(source) : null

                return (
                  <li className={`vrow ${added ? 'vrow--added' : ''}`} key={item.id}>
                    <span className="vrow__thumb" aria-hidden="true">
                      <Sticker id={cat.sticker} size={20} />
                    </span>

                    <button
                      className="vrow__text vrow__text--open"
                      type="button"
                      onClick={() => onOpenProduct?.(item.id)}
                      disabled={!onOpenProduct}
                      aria-label={`${item.name} — price history and details`}
                      title="Price history and details"
                    >
                      <span className="vrow__name">
                        {item.brand && <span className="vrow__brand">{item.brand} </span>}
                        {item.name}
                        {item.packageSize && (
                          <span className="vrow__size"> ({item.packageSize})</span>
                        )}
                      </span>
                      <span className="vrow__price">
                        {price > 0 ? (
                          <>
                            {formatMoney(price)} / {item.unit ?? 'pc'}
                            {/* The price we have is from somewhere else, so say
                                so rather than passing it off as this shop's. */}
                            {activeStoreId && source === 'anywhere' && (
                              <span className="vrow__elsewhere"> · last paid elsewhere</span>
                            )}
                            {!activeStoreId && from && (
                              <span className="vrow__store"> · {from}</span>
                            )}
                          </>
                        ) : (
                          <span className="vrow__unpriced">No price yet</span>
                        )}
                      </span>
                    </button>

                    {managing ? (
                      <button
                        className="vrow__remove"
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Forget ${item.name}`}
                      >
                        ×
                      </button>
                    ) : (
                      <button
                        className="vrow__add"
                        type="button"
                        onClick={() => onQuickAdd(item)}
                        disabled={added}
                        aria-label={
                          added ? `${item.name} is already on the list` : `Add ${item.name}`
                        }
                        title={added ? 'Already on the list' : 'Add to the list'}
                      >
                        {added ? '✓' : '+'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <button
            className="btn btn--ghost vault__manage"
            type="button"
            onClick={() => setManaging((m) => !m)}
          >
            {managing ? 'Done' : 'Edit vault'}
          </button>
        </div>
      )}
    </section>
  )
}
