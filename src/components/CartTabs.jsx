import { useState } from 'react'
import { formatMoney } from '../money.js'

export default function CartTabs({
  carts,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')

  function commitAdd() {
    onAdd(draft)
    setDraft('')
    setAdding(false)
  }

  function commitRename() {
    onRename(renamingId, renameDraft)
    setRenamingId(null)
  }

  return (
    <nav className="carts" aria-label="Lists">
      <ul className="carts__list">
        {carts.map((cart) => {
          const total = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0)
          const left = cart.items.filter((i) => !i.checked).length

          if (cart.id === renamingId) {
            return (
              <li key={cart.id}>
                <input
                  className="carts__input"
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  aria-label={`Rename ${cart.name}`}
                  autoFocus
                />
              </li>
            )
          }

          return (
            <li key={cart.id}>
              <button
                className={`cart-tab ${cart.id === activeId ? 'cart-tab--active' : ''}`}
                type="button"
                onClick={() => {
                  // A second click on the open tab starts a rename — no
                  // separate edit mode to hunt for.
                  if (cart.id === activeId) {
                    setRenameDraft(cart.name)
                    setRenamingId(cart.id)
                  } else {
                    onSelect(cart.id)
                  }
                }}
                aria-current={cart.id === activeId ? 'true' : undefined}
                title={cart.id === activeId ? 'Click again to rename' : cart.name}
              >
                <span className="cart-tab__name">{cart.name}</span>
                <span className="cart-tab__meta">
                  {left > 0 && <>{left}</>}
                  {total > 0 && <> · {formatMoney(total)}</>}
                </span>
              </button>
            </li>
          )
        })}

        <li>
          {adding ? (
            <input
              className="carts__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAdd()
                if (e.key === 'Escape') {
                  setDraft('')
                  setAdding(false)
                }
              }}
              placeholder="List name"
              aria-label="New list name"
              autoFocus
            />
          ) : (
            <button
              className="carts__add"
              type="button"
              onClick={() => setAdding(true)}
              aria-label="New list"
            >
              +
            </button>
          )}
        </li>

        {carts.length > 1 && (
          <li className="carts__delete">
            <button
              type="button"
              onClick={() => onRemove(activeId)}
              aria-label="Delete this list"
              title="Delete this list"
            >
              Delete list
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
