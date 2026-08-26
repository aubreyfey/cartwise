import { useState } from 'react'
import { formatMoney } from '../money.js'
import { colorForIndex } from '../stores.js'
import { stickerFor } from '../stickerCatalog.js'
import Sticker from '../stickers.jsx'

/**
 * What you would save buying each item where it is cheapest, rather than
 * doing the whole shop in one place.
 *
 * Only shown when the saving is worth the second trip; a panel announcing
 * that splitting the shop saves twelve pence is noise.
 */
export default function SplitShop({ plan, stores, minimum = 1 }) {
  const [open, setOpen] = useState(false)

  if (!plan || plan.saving < minimum) return null

  return (
    <section className="split">
      <button
        className="split__head"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="split__lead">
          Split the shop and save{' '}
          <strong className="split__saving">{formatMoney(plan.saving)}</strong>
        </span>
        <span className={`insights__chevron ${open ? 'insights__chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="split__body">
          {plan.groups.map((group) => {
            const index = stores.findIndex((s) => s.id === group.store.id)
            return (
              <div className="split__group" key={group.store.id} style={{ '--store-color': colorForIndex(index) }}>
                <header className="split__store">
                  <span className="split__dot" aria-hidden="true" />
                  <span className="split__name">{group.store.name}</span>
                  <span className="split__total">{formatMoney(group.total)}</span>
                </header>
                <ul className="split__items">
                  {group.lines.map((line) => (
                    <li key={line.item.id ?? line.item.name}>
                      <Sticker id={stickerFor(line.item.name, line.item.category)} size={16} />
                      <span className="split__item">{line.item.name}</span>
                      <span className="split__cost">{formatMoney(line.cost)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

          <p className="split__note">
            Compared against {plan.bestSingle.store.name} at{' '}
            {formatMoney(plan.bestSingle.total)} — the cheapest single shop, not
            the dearest, so the saving is the real one.
            {plan.unknown > 0 && (
              <>
                {' '}
                {plan.unknown}{' '}
                {plan.unknown === 1 ? 'item is' : 'items are'} priced at only one
                shop, so {plan.unknown === 1 ? 'it sits' : 'they sit'} out of this.
              </>
            )}
          </p>
        </div>
      )}
    </section>
  )
}
