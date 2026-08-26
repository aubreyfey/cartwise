import { useState } from 'react'
import { CATEGORY_BY_ID } from '../categories.js'
import { formatMoney } from '../money.js'
import { byPopularity, priceFor } from '../vault.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

export default function VaultPanel({
  vault,
  activeStoreId,
  onQuickAdd,
  onRemove,
  onList,
}) {
  const [open, setOpen] = useState(false)
  const [managing, setManaging] = useState(false)

  if (vault.length === 0) return null

  const items = byPopularity(vault)
  // Names already on the list — their chips show as added rather than
  // inviting a second tap.
  const onListNames = new Set(onList.map((n) => n.toLowerCase()))

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

      {open && (
        <div className="vault__body">
          <p className="vault__hint">
            Everything you've bought before, with the last price you paid. Tap
            to add it to the list.
          </p>

          <ul className="vault__chips">
            {items.map((item) => {
              const added = onListNames.has(item.name.toLowerCase())
              const price = priceFor(item, activeStoreId)
              return (
                <li key={item.id}>
                  <span className={`chip ${added ? 'chip--added' : ''}`}>
                    <button
                      className="chip__add"
                      type="button"
                      onClick={() => onQuickAdd(item)}
                      disabled={added}
                      title={
                        added
                          ? `${item.name} is already on the list`
                          : `Add ${item.name}`
                      }
                    >
                      <Sticker
                        id={(CATEGORY_BY_ID[item.category] ?? CATEGORY_BY_ID.other).sticker}
                        size={15}
                        className="chip__icon"
                      />
                      <span className="chip__name">{item.name}</span>
                      {price > 0 && (
                        <span className="chip__price">{formatMoney(price)}</span>
                      )}
                    </button>

                    {managing && (
                      <button
                        className="chip__remove"
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Forget ${item.name}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>

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
