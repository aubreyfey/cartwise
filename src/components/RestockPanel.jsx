import { useMemo, useState } from 'react'
import { excludeOnList, restockDue, restockLabel } from '../restock.js'
import { stickerFor } from '../stickerCatalog.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

/**
 * Things you buy on a rhythm that look due. Hidden entirely when there is
 * nothing to say — an empty "suggestions" box that never fills is worse than
 * no box at all.
 */
export default function RestockPanel({ trips, items, onAdd }) {
  const [dismissed, setDismissed] = useState(() => new Set())

  const due = useMemo(
    () => excludeOnList(restockDue(trips), items).filter((s) => !dismissed.has(s.name)),
    [trips, items, dismissed],
  )

  if (due.length === 0) return null

  return (
    <section className="restock">
      <header className="restock__head">
        <Icon name="bell" size={15} />
        <h2 className="restock__title">Usually about now</h2>
        <span className="restock__count">{due.length}</span>
      </header>

      <ul className="restock__list">
        {due.slice(0, 6).map((item) => (
          <li key={item.name} className="restock__row">
            <Sticker id={stickerFor(item.name, item.category)} size={22} />
            <span className="restock__names">
              <span className="restock__name">{item.name}</span>
              <span className={`restock__when ${item.dueIn < 0 ? 'restock__when--over' : ''}`}>
                {restockLabel(item)}
              </span>
            </span>
            <button
              className="restock__add"
              type="button"
              onClick={() => onAdd(item)}
              aria-label={`Add ${item.name} to the list`}
            >
              +
            </button>
            <button
              className="restock__no"
              type="button"
              onClick={() => setDismissed((prev) => new Set(prev).add(item.name))}
              aria-label={`Not this time: ${item.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <p className="restock__note">
        Worked out from how often you have actually bought these, not a guess.
      </p>
    </section>
  )
}
