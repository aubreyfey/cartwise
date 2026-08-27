import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMoney } from '../money.js'
import { priceFor, priceSource, searchVault } from '../vault.js'
import { lastPurchasedAt } from '../purchases.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'
import { searchProducts } from '../lookup.js'

const when = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

/**
 * Search for something to add to the list.
 *
 * What is searched is your own Vault — every product you have bought or saved,
 * with the price you actually paid. CartWise ships no product catalogue and
 * this screen will not pretend otherwise: the count in the field is the size
 * of *your* catalogue, and it grows as you shop.
 *
 * The three buttons at the foot are the ways out when it is not in there yet,
 * and each one goes somewhere real.
 */
export default function ProductSearch({
  vault,
  purchases = [],
  stores = [],
  activeStoreId,
  categoryFor,
  onAdd,
  onScan,
  onManual,
  onOpenVault,
  purpose = 'list',
  onClose,
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  // Opening a search screen and having to tap the field is a wasted step.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo(
    () => (query.trim() ? searchVault(vault, { query }) : []),
    [vault, query],
  )

  const searching = query.trim().length > 0
  const storeName = (id) => stores.find((s) => s.id === id)?.name ?? null

  // Open Food Facts, on a tap and never automatically. CartWise ships no
  // catalogue of its own; this is the honest alternative to inventing one.
  const [online, setOnline] = useState({ state: 'idle', results: [] })

  async function searchOnline() {
    setOnline({ state: 'looking', results: [] })
    try {
      const found = await searchProducts(query.trim())
      setOnline({ state: found.length ? 'found' : 'empty', results: found })
    } catch {
      setOnline({ state: 'error', results: [] })
    }
  }

  // A new query invalidates the last online answer.
  useEffect(() => {
    setOnline({ state: 'idle', results: [] })
  }, [query])

  return (
    <div className="sheet sheet--full" role="presentation" onMouseDown={onClose}>
      <div
        className="psearch"
        role="dialog"
        aria-modal="true"
        aria-label="Search for a product"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="psearch__grip" aria-hidden="true" />
        {purpose === 'expiry' && (
          <p className="psearch__purpose">
            Pick something to track the expiry of
          </p>
        )}

        <div className="psearch__field">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            className="psearch__input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${vault.length.toLocaleString()} ${
              vault.length === 1 ? 'item' : 'items'
            } to browse`}
            aria-label="Search for a product"
            autoComplete="off"
          />
          {query && (
            <button
              className="psearch__clear"
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="psearch__body">
          {!searching && (
            <div className="psearch__state">
              <Icon name="search" size={44} strokeWidth={1.3} />
              <p className="psearch__state-title">Search for a product</p>
              <p className="psearch__state-sub">
                {vault.length === 0
                  ? 'Your Vault is empty for now. Add something manually and it will be here next time.'
                  : 'Everything you have bought before, with the price you paid.'}
              </p>
            </div>
          )}

          {searching && results.length === 0 && (
            <div className="psearch__state">
              <Icon name="search" size={44} strokeWidth={1.3} />
              <p className="psearch__state-title">No results</p>
              <p className="psearch__state-sub">
                Nothing in your Vault matches “{query.trim()}”. Add it manually
                or scan it, and it will be here next time.
              </p>
            </div>
          )}

          {searching && results.length > 0 && (
            <ul className="psearch__results">
              {results.map((item) => {
                const price = priceFor(item, activeStoreId)
                const source = priceSource(item, activeStoreId)
                const bought = lastPurchasedAt(purchases, item.id)
                const from = source && source !== 'anywhere' ? storeName(source) : null

                return (
                  <li key={item.id}>
                    <button
                      className="presult"
                      type="button"
                      onClick={() => onAdd(item)}
                    >
                      <span className="presult__thumb" aria-hidden="true">
                        <Sticker id={categoryFor(item.category).sticker} size={22} />
                      </span>
                      <span className="presult__text">
                        <span className="presult__name">
                          {item.brand && <span className="presult__brand">{item.brand} </span>}
                          {item.name}
                          {item.packageSize && (
                            <span className="presult__size">
                              {' '}
                              ({item.packageSize.value}
                              {item.packageSize.unit})
                            </span>
                          )}
                        </span>
                        <span className="presult__meta">
                          {price > 0 ? (
                            <>
                              {formatMoney(price)} / {item.unit ?? 'pc'}
                              {from && <> · {from}</>}
                              {activeStoreId && source === 'anywhere' && (
                                <> · last paid elsewhere</>
                              )}
                            </>
                          ) : (
                            'No price yet'
                          )}
                          {bought && <> · {when.format(bought)}</>}
                        </span>
                      </span>
                      <span className="presult__add" aria-hidden="true">
                        +
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {searching && (
            <div className="psearch__online">
              {online.state === 'idle' && (
                <button className="btn btn--ghost btn--small" type="button" onClick={searchOnline}>
                  Search the Open Food Facts database
                </button>
              )}
              {online.state === 'looking' && <p className="psearch__note">Searching…</p>}
              {online.state === 'empty' && (
                <p className="psearch__note">Open Food Facts has nothing for that either.</p>
              )}
              {online.state === 'error' && (
                <p className="psearch__note psearch__note--bad">
                  Couldn't reach Open Food Facts. You're either offline or it is.
                </p>
              )}

              {online.results.length > 0 && (
                <>
                  <p className="psearch__online-head">
                    From Open Food Facts · names only, no prices
                  </p>
                  <ul className="psearch__results">
                    {online.results.map((product) => (
                      <li key={product.barcode ?? product.name}>
                        <button
                          className="presult"
                          type="button"
                          onClick={() => onManual(product.name, product)}
                        >
                          <span className="presult__thumb" aria-hidden="true">
                            <Sticker
                              id={categoryFor(product.category ?? 'other').sticker}
                              size={22}
                            />
                          </span>
                          <span className="presult__text">
                            <span className="presult__name">
                              {product.brand && (
                                <span className="presult__brand">{product.brand} </span>
                              )}
                              {product.name}
                            </span>
                            <span className="presult__meta">
                              You set the price when you add it
                            </span>
                          </span>
                          <span className="presult__add" aria-hidden="true">
                            +
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* The ways out when it is not in the Vault yet. All three go
            somewhere real — a decorative button here would be worse than none. */}
        <div className="psearch__alts">
          <p className="psearch__alts-head">Couldn't find an item?</p>
          <div className="psearch__alts-row">
            <button className="palt" type="button" onClick={onScan}>
              <Icon name="barcode" size={17} /> Item Scan
            </button>
            <button
              className="palt"
              type="button"
              onClick={() => onManual(query.trim())}
            >
              <Icon name="save" size={17} /> Manual
            </button>
            <button className="palt" type="button" onClick={onOpenVault}>
              <Icon name="vault" size={17} /> Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
