// Which recipes you are cooking on which days, and what that means for the
// shop.
//
// The plan is a plain map of date -> recipe ids. Recipes are referenced, not
// copied, so editing a recipe updates every day it appears on; and a deleted
// recipe leaves an id that resolves to nothing, which the readers below drop
// rather than rendering as a blank row.

import { DAY, dateInDays, parseDate, startOfDay } from './pantry.js'
import { findRecipe, scaleFor } from './recipes.js'

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** The seven days starting today, as 'YYYY-MM-DD'. */
export function weekFrom(now = Date.now(), length = 7) {
  return Array.from({ length }, (_, i) => dateInDays(i, now))
}

export function dayLabel(date) {
  const ts = parseDate(date)
  if (ts === null) return date
  return DAY_NAMES[new Date(ts).getDay()]
}

export function isToday(date, now = Date.now()) {
  return parseDate(date) === startOfDay(now)
}

export function planFor(plan = {}, date) {
  const ids = plan[date]
  return Array.isArray(ids) ? ids : []
}

export function assign(plan = {}, date, recipeId) {
  const current = planFor(plan, date)
  if (current.includes(recipeId)) return plan
  return { ...plan, [date]: [...current, recipeId] }
}

export function unassign(plan = {}, date, recipeId) {
  const next = planFor(plan, date).filter((id) => id !== recipeId)
  const copy = { ...plan }
  if (next.length === 0) delete copy[date]
  else copy[date] = next
  return copy
}

/** Resolve a day's ids to recipes, dropping any that no longer exist. */
export function recipesOn(plan, recipes, date) {
  return planFor(plan, date)
    .map((id) => findRecipe(recipes, id))
    .filter(Boolean)
}

/**
 * Forget days that have already gone by, so the plan does not grow forever.
 * Today is kept — you have not necessarily cooked dinner yet.
 */
export function prunePast(plan = {}, now = Date.now()) {
  const today = startOfDay(now)
  const next = {}
  for (const [date, ids] of Object.entries(plan)) {
    const ts = parseDate(date)
    if (ts !== null && ts >= today) next[date] = ids
  }
  return next
}

/**
 * Everything the planned week needs, combined.
 *
 * Ingredients wanted by more than one meal are added together rather than
 * listed twice — cooking two dishes that each want an onion means two onions,
 * on one line.
 */
export function shoppingFor(plan, recipes, dates = []) {
  const totals = new Map()

  for (const date of dates) {
    for (const recipe of recipesOn(plan, recipes, date)) {
      for (const ingredient of scaleFor(recipe, recipe.serves)) {
        const k = `${ingredient.name.trim().toLowerCase()}|${ingredient.unit}`
        if (totals.has(k)) {
          const line = totals.get(k)
          line.qty = Number.parseFloat((line.qty + ingredient.qty).toFixed(3))
          if (!line.from.includes(recipe.name)) line.from.push(recipe.name)
        } else {
          totals.set(k, { ...ingredient, from: [recipe.name] })
        }
      }
    }
  }

  return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** How many meals are planned across the given days. */
export function mealCount(plan, dates = []) {
  return dates.reduce((n, date) => n + planFor(plan, date).length, 0)
}
