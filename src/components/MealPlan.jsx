import { useMemo, useState } from 'react'
import {
  assign,
  dayLabel,
  isToday,
  mealCount,
  recipesOn,
  shoppingFor,
  unassign,
  weekFrom,
} from '../mealplan.js'
import { formatQty } from '../units.js'
import { byName } from '../recipes.js'
import { stickerFor } from '../stickerCatalog.js'
import Sticker from '../stickers.jsx'

export default function MealPlan({ plan, recipes, carts, onChange, onAddToList }) {
  const week = useMemo(() => weekFrom(), [])
  const [picking, setPicking] = useState(null) // date awaiting a recipe
  const [status, setStatus] = useState(null)
  const sorted = useMemo(() => byName(recipes), [recipes])
  const shopping = useMemo(() => shoppingFor(plan, recipes, week), [plan, recipes, week])
  const meals = mealCount(plan, week)

  if (recipes.length === 0) {
    return (
      <p className="empty">
        Add a recipe first, then you can plan which days you are cooking it.
      </p>
    )
  }

  function send(cartId) {
    const cart = carts.find((c) => c.id === cartId)
    onAddToList(cartId, shopping)
    setStatus(`Added ${shopping.length} ${shopping.length === 1 ? 'ingredient' : 'ingredients'} to ${cart.name}.`)
  }

  return (
    <section className="plan">
      <header className="plan__head">
        <h2 className="plan__title">This week</h2>
        <span className="plan__count">
          {meals} {meals === 1 ? 'meal' : 'meals'} planned
        </span>
      </header>

      <ul className="plan__week">
        {week.map((date) => {
          const onDay = recipesOn(plan, recipes, date)
          return (
            <li className={`plan__day ${isToday(date) ? 'plan__day--today' : ''}`} key={date}>
              <span className="plan__label">
                {dayLabel(date)}
                {isToday(date) && <span className="plan__today">today</span>}
              </span>

              <div className="plan__meals">
                {onDay.map((recipe) => (
                  <span className="plan__meal" key={recipe.id}>
                    <span className="plan__mealname">{recipe.name}</span>
                    <button
                      type="button"
                      onClick={() => onChange(unassign(plan, date, recipe.id))}
                      aria-label={`Remove ${recipe.name} from ${dayLabel(date)}`}
                    >
                      ×
                    </button>
                  </span>
                ))}

                {picking === date ? (
                  <select
                    className="plan__picker"
                    autoFocus
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) onChange(assign(plan, date, e.target.value))
                      setPicking(null)
                    }}
                    onBlur={() => setPicking(null)}
                    aria-label={`Choose a recipe for ${dayLabel(date)}`}
                  >
                    <option value="">Pick a recipe…</option>
                    {sorted.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    className="plan__add"
                    type="button"
                    onClick={() => setPicking(date)}
                    aria-label={`Plan a meal for ${dayLabel(date)}`}
                  >
                    +
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {shopping.length > 0 && (
        <div className="plan__shopping">
          <h3 className="plan__subtitle">Everything the week needs</h3>
          <ul className="plan__ingredients">
            {shopping.map((i) => (
              <li key={`${i.name}-${i.unit}`}>
                <Sticker id={stickerFor(i.name, i.category)} size={16} />
                <span className="plan__qty">
                  {formatQty(i.qty)} {i.unit}
                </span>
                <span className="plan__ing">{i.name}</span>
                {i.from.length > 1 && (
                  <span className="plan__from">{i.from.length} meals</span>
                )}
              </li>
            ))}
          </ul>

          {carts.length > 0 && (
            <div className="recipe__carts">
              {carts.map((cart) => (
                <button
                  key={cart.id}
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => send(cart.id)}
                >
                  Add to {cart.name}
                </button>
              ))}
            </div>
          )}

          {status && <p className="account__status account__status--good">{status}</p>}
        </div>
      )}
    </section>
  )
}
