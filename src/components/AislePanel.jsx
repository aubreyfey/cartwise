import { useEffect, useRef } from 'react'
import Sticker from '../stickers.jsx'
import { defaultAisleOrder, isDefaultAisleOrder, moveAisle, orderedCategories } from '../aisleOrder.js'

/**
 * Rearrange the aisles so the list runs in the order you walk the shop.
 *
 * Buttons rather than drag-and-drop: dragging a row is fiddly on a phone, it
 * fights the page scroll, and it leaves anyone using a keyboard or a screen
 * reader with no way to do it at all. Two arrows work everywhere.
 */
export default function AislePanel({ order, onChange, onClose }) {
  const panelRef = useRef(null)
  const firstRef = useRef(null)
  const rows = orderedCategories(order)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target)) onClose()
    }
    window.addEventListener('keydown', onKey)
    const id = setTimeout(() => window.addEventListener('pointerdown', onDown), 0)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [onClose])

  return (
    <div className="aisles" ref={panelRef} role="dialog" aria-label="Aisle order">
      <p className="aisles__head">
        Aisle order
        <span className="aisles__hint">The order you walk the shop</span>
      </p>

      <ul className="aisles__list">
        {rows.map((category, i) => (
          <li className="aisles__row" key={category.id}>
            <Sticker id={category.sticker} size={20} />
            <span className="aisles__name">{category.label}</span>
            <button
              ref={i === 0 ? firstRef : undefined}
              className="aisles__move"
              type="button"
              onClick={() => onChange(moveAisle(order, category.id, -1))}
              disabled={i === 0}
              aria-label={`Move ${category.label} up`}
            >
              ↑
            </button>
            <button
              className="aisles__move"
              type="button"
              onClick={() => onChange(moveAisle(order, category.id, 1))}
              disabled={i === rows.length - 1}
              aria-label={`Move ${category.label} down`}
            >
              ↓
            </button>
          </li>
        ))}
      </ul>

      {!isDefaultAisleOrder(order) && (
        <button
          className="aisles__reset"
          type="button"
          onClick={() => onChange(defaultAisleOrder())}
        >
          Back to the usual order
        </button>
      )}
    </div>
  )
}
