// Recipes exist for one reason: to put their ingredients on a shopping list
// without typing them again. They are not a cookbook — there is no method,
// no cooking time, no photo of the finished dish. Everything here earns its
// place by making the next shop shorter.

import { guessCategory } from './categories.js'
import { DEFAULT_UNIT, normalizeQty } from './units.js'

export const newId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function makeRecipe(name = 'New recipe', serves = 2) {
  return {
    id: newId(),
    name: name.trim() || 'New recipe',
    serves: Math.max(1, Math.round(serves) || 1),
    ingredients: [],
    createdAt: Date.now(),
  }
}

export function addRecipe(recipes, name, serves) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return recipes
  return [...recipes, makeRecipe(trimmed, serves)]
}

export const removeRecipe = (recipes, id) => recipes.filter((r) => r.id !== id)

export function updateRecipe(recipes, id, patch) {
  return recipes.map((r) =>
    r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r,
  )
}

export const findRecipe = (recipes, id) => recipes.find((r) => r.id === id) ?? null

export function addIngredient(recipe, { name, qty, unit }) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return recipe
  return {
    ...recipe,
    ingredients: [
      ...recipe.ingredients,
      {
        id: newId(),
        name: trimmed,
        qty: normalizeQty(qty ?? 1, unit ?? DEFAULT_UNIT),
        unit: unit ?? DEFAULT_UNIT,
        category: guessCategory(trimmed),
      },
    ],
  }
}

export function removeIngredient(recipe, ingredientId) {
  return { ...recipe, ingredients: recipe.ingredients.filter((i) => i.id !== ingredientId) }
}

/**
 * Scale a recipe to the number of people you are actually cooking for.
 *
 * Rounded to three decimals rather than left raw: 1/3 of a recipe should read
 * "0.333 kg", not a number with seventeen digits in it.
 */
export function scaleFor(recipe, serves) {
  const from = Math.max(1, recipe.serves || 1)
  const to = Math.max(1, Math.round(serves) || 1)
  const factor = to / from
  return recipe.ingredients.map((i) => ({
    ...i,
    qty: Number.parseFloat((i.qty * factor).toFixed(3)),
  }))
}

/**
 * What adding this recipe to a list would do.
 *
 * Ingredients already on the list are reported separately rather than added
 * twice — two recipes both wanting onions should mean more onions, not a
 * second onions row, and the caller decides which.
 */
export function planAddition(recipe, serves, listItems = []) {
  const scaled = scaleFor(recipe, serves)
  const onList = new Map(
    listItems.filter((i) => !i.checked).map((i) => [i.name.trim().toLowerCase(), i]),
  )

  const fresh = []
  const merging = []
  for (const ingredient of scaled) {
    const existing = onList.get(ingredient.name.trim().toLowerCase())
    if (existing) merging.push({ ingredient, existing })
    else fresh.push(ingredient)
  }
  return { fresh, merging, total: scaled.length }
}

/** Recipes you cook most often first, then alphabetically. */
export function byName(recipes = []) {
  return [...recipes].sort((a, b) => a.name.localeCompare(b.name))
}

/** A short line for a recipe card: "6 ingredients · serves 4". */
export function describeRecipe(recipe) {
  const n = recipe.ingredients.length
  return `${n} ${n === 1 ? 'ingredient' : 'ingredients'} · serves ${recipe.serves}`
}
