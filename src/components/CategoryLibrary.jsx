import { useState } from 'react'
import {
  addCustomCategory,
  countUnder,
  deleteCustomCategory,
  renameCategory,
  setCategoryActive,
} from '../categoryLibrary.js'
import { moveAisle } from '../aisleOrder.js'
import Sticker, { STICKER_IDS } from '../stickers.jsx'
import Icon from '../icons.jsx'

/**
 * Which aisles exist, what they are called, and which ones you use.
 *
 * A built-in can be renamed, switched off and reordered, but never deleted:
 * its id is written into every item, Vault entry, pantry entry and archived
 * trip, so removing it would silently orphan them. Custom ones can be deleted,
 * and anything filed under them moves to Other rather than disappearing.
 */
export default function CategoryLibrary({
  categories,
  library,
  order,
  counts,
  onLibraryChange,
  onOrderChange,
  onReassign,
}) {
  const [tab, setTab] = useState('active')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newSticker, setNewSticker] = useState('basket')

  const shown = categories.filter((c) => (tab === 'active' ? c.active : !c.active))

  function commitRename(id) {
    onLibraryChange(renameCategory(library, id, draft))
    setEditingId(null)
  }

  function remove(category) {
    const n = counts[category.id] ?? 0
    const message = n
      ? `${category.label} has ${n} ${n === 1 ? 'item' : 'items'} filed under it. Delete the category and move ${n === 1 ? 'it' : 'them'} to Other?`
      : `Delete ${category.label}?`
    if (!window.confirm(message)) return

    const { library: next, reassignFrom } = deleteCustomCategory(library, category.id)
    if (reassignFrom) onReassign(reassignFrom)
    onLibraryChange(next)
  }

  return (
    <div className="catlib">
      <header className="screen-head">
        <h1 className="screen-head__title">Category Library</h1>
      </header>

      <div className="segmented catlib__tabs" role="group" aria-label="Show">
        <button
          type="button"
          className={`segmented__btn ${tab === 'active' ? 'segmented__btn--on' : ''}`}
          onClick={() => setTab('active')}
          aria-pressed={tab === 'active'}
        >
          In use
        </button>
        <button
          type="button"
          className={`segmented__btn ${tab === 'archived' ? 'segmented__btn--on' : ''}`}
          onClick={() => setTab('archived')}
          aria-pressed={tab === 'archived'}
        >
          Archived
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="catlib__empty">
          {tab === 'archived'
            ? 'Nothing archived. Switching an aisle off hides it from the pickers without touching anything already filed under it.'
            : 'No categories in use.'}
        </p>
      ) : (
        <ul className="catlib__list">
          {shown.map((category, i) => {
            const n = counts[category.id] ?? 0
            return (
              <li className="catrow" key={category.id}>
                <span className={`catrow__tile catrow__tile--${category.id}`} aria-hidden="true">
                  <Sticker id={category.sticker} size={22} />
                </span>

                <span className="catrow__text">
                  <span className="catrow__badge">
                    {category.custom ? 'Custom' : 'Default'}
                  </span>
                  {editingId === category.id ? (
                    <input
                      className="catrow__input"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitRename(category.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(category.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      aria-label={`Rename ${category.label}`}
                      maxLength={40}
                      autoFocus
                    />
                  ) : (
                    <button
                      className="catrow__name"
                      type="button"
                      onClick={() => {
                        setDraft(category.label)
                        setEditingId(category.id)
                      }}
                      title="Rename"
                    >
                      {category.label}
                      {n > 0 && <span className="catrow__count">{n}</span>}
                    </button>
                  )}
                </span>

                {tab === 'active' && (
                  <span className="catrow__moves">
                    <button
                      className="aisles__move"
                      type="button"
                      onClick={() => onOrderChange(moveAisle(order, category.id, -1))}
                      disabled={i === 0}
                      aria-label={`Move ${category.label} up`}
                    >
                      ↑
                    </button>
                    <button
                      className="aisles__move"
                      type="button"
                      onClick={() => onOrderChange(moveAisle(order, category.id, 1))}
                      disabled={i === shown.length - 1}
                      aria-label={`Move ${category.label} down`}
                    >
                      ↓
                    </button>
                  </span>
                )}

                {category.custom && tab === 'archived' ? (
                  <button
                    className="catrow__act"
                    type="button"
                    onClick={() => remove(category)}
                    aria-label={`Delete ${category.label}`}
                    title="Delete"
                  >
                    ×
                  </button>
                ) : (
                  <button
                    className="catrow__act"
                    type="button"
                    onClick={() =>
                      onLibraryChange(setCategoryActive(library, category.id, !category.active))
                    }
                    disabled={category.protected}
                    aria-label={
                      category.protected
                        ? 'Other is always available'
                        : `${category.active ? 'Archive' : 'Restore'} ${category.label}`
                    }
                    title={
                      category.protected
                        ? 'Other is always available — items need somewhere to land'
                        : category.active
                          ? 'Archive'
                          : 'Restore'
                    }
                  >
                    <Icon name={category.active ? 'box' : 'save'} size={17} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {adding ? (
        <div className="catlib__new">
          <input
            className="field__input"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Name this category"
            aria-label="New category name"
            maxLength={40}
            autoFocus
          />
          <ul className="catlib__stickers">
            {STICKER_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={`catlib__sticker ${id === newSticker ? 'catlib__sticker--on' : ''}`}
                  onClick={() => setNewSticker(id)}
                  aria-pressed={id === newSticker}
                  aria-label={id}
                >
                  <Sticker id={id} size={20} />
                </button>
              </li>
            ))}
          </ul>
          <div className="catlib__newactions">
            <button
              className="btn btn--primary"
              type="button"
              disabled={!newLabel.trim()}
              onClick={() => {
                onLibraryChange(addCustomCategory(library, newLabel, newSticker))
                setNewLabel('')
                setNewSticker('basket')
                setAdding(false)
              }}
            >
              Create
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn--ghost catlib__add" type="button" onClick={() => setAdding(true)}>
          + New category
        </button>
      )}

      <p className="catlib__note">
        Built-in categories can be renamed, reordered and archived, but not
        deleted — everything you have ever filed under one still points at it.
      </p>
    </div>
  )
}
