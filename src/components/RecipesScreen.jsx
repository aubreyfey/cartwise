import { useMemo, useState } from 'react'
import CookbookSheet from './CookbookSheet.jsx'
import { libraryCount } from '../recipeLibrary.js'
import { stepsFor } from '../recipeSteps.js'
import {
  addIngredient,
  byName,
  describeRecipe,
  planAddition,
  removeIngredient,
  scaleFor,
} from '../recipes.js'
import { UNITS, DEFAULT_UNIT, formatQty } from '../units.js'
import { stickerFor } from '../stickerCatalog.js'
import Sticker from '../stickers.jsx'
import Icon from '../icons.jsx'

export default function RecipesScreen({
  recipes,
  carts,
  onCreate,
  onUpdate,
  onRemove,
  onAddToList,
  onAddFromLibrary,
}) {
  const [openId, setOpenId] = useState(null)
  const [newName, setNewName] = useState('')
  const [ingredient, setIngredient] = useState({ name: '', qty: '1', unit: DEFAULT_UNIT })
  const [serves, setServes] = useState(null) // per-open-recipe override
  const [status, setStatus] = useState(null)
  const [cookbook, setCookbook] = useState(false)

  const sorted = useMemo(() => byName(recipes), [recipes])
  const open = sorted.find((r) => r.id === openId) ?? null
  const cooking = serves ?? open?.serves ?? 2
  const scaled = open ? scaleFor(open, cooking) : []

  function create(event) {
    event.preventDefault()
    if (!newName.trim()) return
    onCreate(newName)
    setNewName('')
  }

  function addToList(cartId) {
    if (!open) return
    const cart = carts.find((c) => c.id === cartId)
    const plan = planAddition(open, cooking, cart?.items ?? [])
    onAddToList(cartId, scaled)
    setStatus({
      tone: 'good',
      text:
        plan.merging.length > 0
          ? `Added to ${cart.name}. ${plan.merging.length} already on the list had their quantity increased.`
          : `Added ${plan.total} ${plan.total === 1 ? 'ingredient' : 'ingredients'} to ${cart.name}.`,
    })
  }

  return (
    <div className="recipes">
      <header className="screen-head">
        <h1 className="screen-head__title">Recipes</h1>
      </header>

      <p className="recipes__intro">
        Keep what you cook, then put its ingredients on a list in one tap.
        Scale it to the number of people you are actually feeding.
      </p>

      {onAddFromLibrary && (
        <button className="trackcta" type="button" onClick={() => setCookbook(true)}>
          <span className="trackcta__icon" aria-hidden="true">
            <Icon name="book" size={20} />
          </span>
          <span className="trackcta__text">
            <strong>Open the cookbook</strong>
            <span>{libraryCount()} dishes ready to go — adobo, sinigang, pancit and more</span>
          </span>
          <span className="trackcta__chevron" aria-hidden="true">
            ›
          </span>
        </button>
      )}

      <form className="account__row" onSubmit={create}>
        <input
          className="field__input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Adobo, Sinigang, Sunday roast…"
          aria-label="Recipe name"
        />
        <button className="btn btn--primary" type="submit" disabled={!newName.trim()}>
          Add
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="empty">
          No recipes yet. Open the cookbook above for {libraryCount()} dishes to
          start from, or type your own — either way, their ingredients become a
          shopping list whenever you cook them.
        </p>
      ) : (
        <ul className="cards">
          {sorted.map((recipe) => {
            const isOpen = recipe.id === openId
            return (
              <li key={recipe.id}>
                <div className="recipe">
                  <button
                    className="recipe__head"
                    type="button"
                    onClick={() => {
                      setOpenId(isOpen ? null : recipe.id)
                      setServes(null)
                      setStatus(null)
                    }}
                    aria-expanded={isOpen}
                  >
                    <span className="recipe__stickers" aria-hidden="true">
                      {recipe.ingredients.slice(0, 5).map((i) => (
                        <Sticker key={i.id} id={stickerFor(i.name, i.category)} size={22} />
                      ))}
                      {recipe.ingredients.length === 0 && (
                        <Icon name="basket" size={20} />
                      )}
                    </span>
                    <span className="recipe__names">
                      <span className="recipe__name">{recipe.name}</span>
                      <span className="recipe__meta">{describeRecipe(recipe)}</span>
                    </span>
                    <span
                      className={`insights__chevron ${isOpen ? 'insights__chevron--open' : ''}`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div className="recipe__body">
                      <div className="recipe__serves">
                        <span className="sheetfield__label">Cooking for</span>
                        <span className="qty">
                          <button
                            className="qty__btn"
                            type="button"
                            onClick={() => setServes(Math.max(1, cooking - 1))}
                            aria-label="Fewer people"
                            disabled={cooking <= 1}
                          >
                            −
                          </button>
                          <span className="qty__value">{cooking}</span>
                          <button
                            className="qty__btn"
                            type="button"
                            onClick={() => setServes(cooking + 1)}
                            aria-label="More people"
                          >
                            +
                          </button>
                        </span>
                        {cooking !== recipe.serves && (
                          <span className="recipe__scaled">
                            scaled from {recipe.serves}
                          </span>
                        )}
                      </div>

                      <ul className="recipe__list">
                        {scaled.map((i) => (
                          <li className="recipe__row" key={i.id}>
                            <Sticker id={stickerFor(i.name, i.category)} size={18} />
                            <span className="recipe__qty">
                              {formatQty(i.qty)} {i.unit}
                            </span>
                            <span className="recipe__ing">{i.name}</span>
                            <button
                              className="item__remove"
                              type="button"
                              onClick={() =>
                                onUpdate(recipe.id, (r) => removeIngredient(r, i.id))
                              }
                              aria-label={`Remove ${i.name}`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>

                      <form
                        className="recipe__add"
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (!ingredient.name.trim()) return
                          onUpdate(recipe.id, (r) => addIngredient(r, ingredient))
                          setIngredient({ name: '', qty: '1', unit: DEFAULT_UNIT })
                        }}
                      >
                        <input
                          className="field__input"
                          value={ingredient.name}
                          onChange={(e) =>
                            setIngredient((s) => ({ ...s, name: e.target.value }))
                          }
                          placeholder="Ingredient"
                          aria-label="Ingredient name"
                        />
                        <input
                          className="field__input field__input--qty"
                          type="number"
                          min="0"
                          step="any"
                          value={ingredient.qty}
                          onChange={(e) => setIngredient((s) => ({ ...s, qty: e.target.value }))}
                          aria-label="Quantity"
                        />
                        <select
                          className="field__input field__input--unit"
                          value={ingredient.unit}
                          onChange={(e) => setIngredient((s) => ({ ...s, unit: e.target.value }))}
                          aria-label="Unit"
                        >
                          {UNITS.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                        <button className="btn btn--ghost" type="submit">
                          Add
                        </button>
                      </form>

                      {recipe.ingredients.length > 0 && carts.length > 0 && (
                        <div className="recipe__send">
                          <span className="sheetfield__label">Add to a list</span>
                          <div className="recipe__carts">
                            {carts.map((cart) => (
                              <button
                                key={cart.id}
                                className="btn btn--ghost"
                                type="button"
                                onClick={() => addToList(cart.id)}
                              >
                                {cart.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {status && (
                        <p className={`account__status account__status--${status.tone}`}>
                          {status.text}
                        </p>
                      )}

                      <button
                        className="btn btn--ghost btn--danger recipe__delete"
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${recipe.name}"?`)) {
                            onRemove(recipe.id)
                            setOpenId(null)
                          }
                        }}
                      >
                        Delete recipe
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {cookbook && (
        <CookbookSheet
          recipes={recipes}
          onAdd={(entry) => onAddFromLibrary(entry)}
          onClose={() => setCookbook(false)}
        />
      )}
    </div>
  )
}
