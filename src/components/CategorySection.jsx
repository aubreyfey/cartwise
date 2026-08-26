import ItemRow from './ItemRow.jsx'
import { formatMoney, sumLines } from '../money.js'
import { photoKey } from '../photos.js'

export default function CategorySection({
  category,
  items,
  deltas,
  shopping,
  photos,
  onPhoto,
  onEdit,
  onToggle,
  onUpdate,
  onRemove,
}) {
  const { total, unpriced } = sumLines(items)
  const done = items.filter((i) => i.checked).length

  // While shopping, what's still to find belongs at the top; picked-up items
  // sink out of the way rather than making you scan past them.
  const ordered = shopping
    ? [...items].sort((a, b) => Number(a.checked) - Number(b.checked))
    : items

  return (
    <section className="section">
      <header className="section__header">
        <span className="section__tag">
          <span className="section__icon" aria-hidden="true">
            {category.icon}
          </span>
          {category.label}
        </span>
        <span className="section__meta">
          {done}/{items.length}
          {total > 0 && <> · {formatMoney(total)}</>}
          {unpriced > 0 && <span className="section__unpriced"> · {unpriced} unpriced</span>}
        </span>
      </header>

      <ul className={`section__items ${shopping ? 'section__items--shopping' : ''}`}>
        {ordered.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            priceDelta={deltas?.get(item.id) ?? null}
            shopping={shopping}
            photo={photos?.[photoKey(item.name)]}
            onPhoto={onPhoto}
            onEdit={onEdit}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  )
}
