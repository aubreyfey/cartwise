import { useState } from 'react'
import { colorForIndex } from '../stores.js'

export default function StoreBar({ stores, activeId, onSelect, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [managing, setManaging] = useState(false)

  function commit() {
    onAdd(draft)
    setDraft('')
    setAdding(false)
  }

  return (
    <section className="stores">
      <ul className="stores__list">
        {stores.map((store, i) => (
          <li key={store.id}>
            <span
              className={`store ${store.id === activeId ? 'store--active' : ''}`}
              style={{ '--store-color': colorForIndex(i) }}
            >
              <button
                className="store__pick"
                type="button"
                onClick={() => onSelect(store.id === activeId ? null : store.id)}
                aria-pressed={store.id === activeId}
              >
                <span className="store__dot" aria-hidden="true" />
                {store.name}
              </button>
              {managing && (
                <button
                  className="store__remove"
                  type="button"
                  onClick={() => onRemove(store.id)}
                  aria-label={`Remove ${store.name} and its prices`}
                >
                  ×
                </button>
              )}
            </span>
          </li>
        ))}

        <li>
          {adding ? (
            <input
              className="stores__input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') {
                  setDraft('')
                  setAdding(false)
                }
              }}
              placeholder="Store name"
              aria-label="New store name"
              autoFocus
            />
          ) : (
            <button
              className="stores__add"
              type="button"
              onClick={() => setAdding(true)}
            >
              + Store
            </button>
          )}
        </li>

        {stores.length > 0 && (
          <li className="stores__manage">
            <button type="button" onClick={() => setManaging((m) => !m)}>
              {managing ? 'Done' : 'Edit'}
            </button>
          </li>
        )}
      </ul>

      {stores.length > 0 && !activeId && (
        <p className="stores__note">
          Pick a store to price the list against it.
        </p>
      )}
    </section>
  )
}
