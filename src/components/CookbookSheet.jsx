import { useEffect, useMemo, useState } from 'react'
import { CUISINES, savedNames, searchLibrary } from '../recipeLibrary.js'
import { guessCategory } from '../categories.js'
import Sticker, { stickerFor } from '../stickers.jsx'
import Icon from '../icons.jsx'

/**
 * Dishes to start from.
 *
 * Recipes were bring-your-own: you opened the tab, found nothing, and had to
 * type every dish and every ingredient before the feature did anything. This
 * is the shortcut past that.
 *
 * Adding one copies it into your own recipes, where it edits and deletes like
 * anything you typed yourself. Nothing here is read-only.
 */
export default function CookbookSheet({ recipes = [], onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const results = useMemo(() => searchLibrary(query, cuisine), [query, cuisine])
  const saved = useMemo(() => savedNames(recipes), [recipes])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet" role="presentation" onMouseDown={onClose}>
      <section
        className="cookbook"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookbook-title"
      >
        <header className="cookbook__head">
          <h2 className="picker__title" id="cookbook-title">
            Cookbook
          </h2>
          <p className="picker__sub">
            Start from a dish. You can change anything afterwards.
          </p>
        </header>

        <div className="vault__search">
          <Icon name="search" size={16} />
          <input
            className="vault__search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="A dish, or something in your fridge"
            aria-label="Search the cookbook"
            autoComplete="off"
          />
          {query && (
            <button
              className="vault__clear"
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="vsort" role="group" aria-label="Filter by cuisine">
          <button
            type="button"
            className={`vsort__btn ${cuisine === null ? 'vsort__btn--on' : ''}`}
            onClick={() => setCuisine(null)}
            aria-pressed={cuisine === null}
          >
            All
          </button>
          {CUISINES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`vsort__btn ${cuisine === c.id ? 'vsort__btn--on' : ''}`}
              onClick={() => setCuisine(cuisine === c.id ? null : c.id)}
              aria-pressed={cuisine === c.id}
            >
              {c.label}
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <p className="vault__empty">
            Nothing here matches “{query}”. Add it yourself and it becomes
            yours.
          </p>
        ) : (
          <ul className="cookbook__list">
            {results.map((entry) => {
              const already = saved.has(entry.name.toLowerCase())
              const open = expanded === entry.name
              return (
                <li className={`cookrow ${already ? 'cookrow--saved' : ''}`} key={entry.name}>
                  <button
                    className="cookrow__main"
                    type="button"
                    onClick={() => setExpanded(open ? null : entry.name)}
                    aria-expanded={open}
                  >
                    <span className="cookrow__thumb" aria-hidden="true">
                      <Sticker
                        id={stickerFor(entry.ingredients[0].name, guessCategory(entry.ingredients[0].name))}
                        size={22}
                      />
                    </span>
                    <span className="cookrow__text">
                      <span className="cookrow__name">{entry.name}</span>
                      <span className="cookrow__meta">
                        Serves {entry.serves} · {entry.ingredients.length} ingredients
                      </span>
                    </span>
                    <span className={`vault__chevron ${open ? 'vault__chevron--open' : ''}`} aria-hidden="true">
                      ▾
                    </span>
                  </button>

                  {open && (
                    <ul className="cookrow__ings">
                      {entry.ingredients.map((ing) => (
                        <li key={ing.name}>
                          <Sticker id={stickerFor(ing.name, guessCategory(ing.name))} size={16} />
                          {ing.name}
                          <span className="cookrow__qty">
                            {ing.qty} {ing.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    className="cookrow__add"
                    type="button"
                    onClick={() => onAdd(entry)}
                    disabled={already}
                    aria-label={already ? `${entry.name} is already saved` : `Save ${entry.name}`}
                    title={already ? 'Already in your recipes' : 'Save this recipe'}
                  >
                    {already ? '✓' : '+'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="newlistsheet__actions">
          <button className="btn btn--ghost" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  )
}
