import { colorForIndex } from '../stores.js'
import { formatMoney } from '../money.js'

export default function StoreCompare({ comparison, stores, activeId, onSelect }) {
  if (!comparison) return null

  const { totals, cheapest, savings, comparable, total } = comparison
  const partial = comparable < total
  const max = Math.max(...totals.map((t) => t.total), 1)

  return (
    <section className="compare">
      <header className="compare__header">
        <h2 className="compare__title">Where it's cheapest</h2>
        <span className="compare__coverage">
          {comparable} of {total} items
        </span>
      </header>

      <ul className="compare__rows">
        {totals.map(({ store, total: storeTotal }) => {
          const isCheapest = store.id === cheapest.store.id
          const index = stores.findIndex((s) => s.id === store.id)
          return (
            <li key={store.id}>
              <button
                className={`compare__row ${isCheapest ? 'compare__row--best' : ''} ${
                  store.id === activeId ? 'compare__row--active' : ''
                }`}
                type="button"
                onClick={() => onSelect(store.id)}
                style={{ '--store-color': colorForIndex(index) }}
              >
                <span className="compare__name">{store.name}</span>
                <span className="compare__bar" aria-hidden="true">
                  <span
                    className="compare__bar-fill"
                    style={{ width: `${(storeTotal / max) * 100}%` }}
                  />
                </span>
                <span className="compare__amount">{formatMoney(storeTotal)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="compare__note">
        {savings > 0 ? (
          <>
            <strong>{cheapest.store.name}</strong> saves{' '}
            <strong>{formatMoney(savings)}</strong> on the items priced at every
            store.
          </>
        ) : (
          <>Same price at every store on the items we can compare.</>
        )}
        {partial && (
          <>
            {' '}
            The other {total - comparable}{' '}
            {total - comparable === 1 ? 'item is' : 'items are'} not priced
            everywhere yet, so they sit out of this comparison.
          </>
        )}
      </p>
    </section>
  )
}
