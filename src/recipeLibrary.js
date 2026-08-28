// A cookbook to start from.
//
// Recipes were entirely bring-your-own: a new user opened the tab, found
// nothing, and had to type every dish and every ingredient by hand before the
// feature did anything at all. That is a lot of typing to reach a payoff you
// have not seen yet, and it is why the tab sat empty.
//
// So: a bundled set of dishes people here actually cook, each with a real
// ingredient list. Adding one copies it into your own recipes, where you can
// edit or delete it like anything else — nothing here is read-only, and a
// recipe you change is yours.
//
// Ingredient names deliberately match the staples list where they can, so the
// stickers, the aisle guesses and the Vault all recognise them.

const r = (name, serves, cuisine, ingredients) => ({ name, serves, cuisine, ingredients })
const i = (name, qty, unit) => ({ name, qty, unit })

export const CUISINES = [
  { id: 'filipino', label: 'Filipino' },
  { id: 'quick', label: 'Quick & easy' },
  { id: 'world', label: 'From elsewhere' },
]

export const RECIPE_LIBRARY = [
  // ------------------------------------------------------------- Filipino
  r('Chicken Adobo', 4, 'filipino', [
    i('Chicken', 1, 'kg'),
    i('Soy sauce', 0.5, 'cup'),
    i('Vinegar', 0.5, 'cup'),
    i('Garlic', 1, 'pc'),
    i('Pepper', 1, 'pack'),
    i('Cooking oil', 2, 'tbsp'),
  ]),
  r('Pork Adobo', 4, 'filipino', [
    i('Pork', 1, 'kg'),
    i('Soy sauce', 0.5, 'cup'),
    i('Vinegar', 0.5, 'cup'),
    i('Garlic', 1, 'pc'),
    i('Onions', 1, 'pc'),
  ]),
  r('Sinigang na Baboy', 5, 'filipino', [
    i('Pork', 1, 'kg'),
    i('Tomatoes', 3, 'pc'),
    i('Onions', 1, 'pc'),
    i('Kangkong', 1, 'bunch'),
    i('Sitaw', 1, 'bunch'),
    i('Eggplant', 2, 'pc'),
    i('Okra', 6, 'pc'),
    i('Fish sauce', 2, 'tbsp'),
  ]),
  r('Sinigang na Hipon', 4, 'filipino', [
    i('Shrimp', 0.5, 'kg'),
    i('Tomatoes', 2, 'pc'),
    i('Onions', 1, 'pc'),
    i('Kangkong', 1, 'bunch'),
    i('Sitaw', 1, 'bunch'),
    i('Fish sauce', 2, 'tbsp'),
  ]),
  r('Tinolang Manok', 4, 'filipino', [
    i('Chicken', 1, 'kg'),
    i('Ginger', 1, 'pc'),
    i('Garlic', 1, 'pc'),
    i('Onions', 1, 'pc'),
    i('Squash', 0.5, 'kg'),
    i('Malunggay', 1, 'bunch'),
    i('Fish sauce', 2, 'tbsp'),
  ]),
  r('Beef Kaldereta', 5, 'filipino', [
    i('Beef', 1, 'kg'),
    i('Potatoes', 3, 'pc'),
    i('Carrots', 2, 'pc'),
    i('Bell pepper', 2, 'pc'),
    i('Tomato sauce', 1, 'pack'),
    i('Onions', 1, 'pc'),
    i('Garlic', 1, 'pc'),
    i('Cheese', 1, 'pack'),
  ]),
  r('Pork Menudo', 4, 'filipino', [
    i('Pork', 0.75, 'kg'),
    i('Potatoes', 2, 'pc'),
    i('Carrots', 2, 'pc'),
    i('Tomato sauce', 1, 'pack'),
    i('Bell pepper', 1, 'pc'),
    i('Onions', 1, 'pc'),
    i('Garlic', 1, 'pc'),
  ]),
  r('Chicken Afritada', 4, 'filipino', [
    i('Chicken', 1, 'kg'),
    i('Potatoes', 2, 'pc'),
    i('Carrots', 2, 'pc'),
    i('Tomato sauce', 1, 'pack'),
    i('Bell pepper', 1, 'pc'),
    i('Onions', 1, 'pc'),
  ]),
  r('Pancit Bihon', 6, 'filipino', [
    i('Noodles', 0.5, 'kg'),
    i('Chicken', 0.3, 'kg'),
    i('Carrots', 2, 'pc'),
    i('Cabbage', 0.5, 'pc'),
    i('Soy sauce', 3, 'tbsp'),
    i('Garlic', 1, 'pc'),
    i('Calamansi', 5, 'pc'),
  ]),
  r('Pancit Canton', 6, 'filipino', [
    i('Noodles', 0.5, 'kg'),
    i('Pork', 0.3, 'kg'),
    i('Shrimp', 0.2, 'kg'),
    i('Cabbage', 0.5, 'pc'),
    i('Carrots', 2, 'pc'),
    i('Oyster sauce', 2, 'tbsp'),
  ]),
  r('Lumpiang Shanghai', 6, 'filipino', [
    i('Ground pork', 0.5, 'kg'),
    i('Lumpia wrapper', 1, 'pack'),
    i('Carrots', 2, 'pc'),
    i('Onions', 1, 'pc'),
    i('Garlic', 1, 'pc'),
    i('Eggs', 1, 'pc'),
    i('Cooking oil', 1, 'L'),
  ]),
  r('Ginisang Munggo', 4, 'filipino', [
    i('Beans', 0.25, 'kg'),
    i('Pork', 0.25, 'kg'),
    i('Malunggay', 1, 'bunch'),
    i('Tomatoes', 2, 'pc'),
    i('Onions', 1, 'pc'),
    i('Garlic', 1, 'pc'),
  ]),
  r('Chopsuey', 4, 'filipino', [
    i('Cabbage', 0.5, 'pc'),
    i('Carrots', 2, 'pc'),
    i('Cauliflower', 0.5, 'pc'),
    i('Bell pepper', 1, 'pc'),
    i('Shrimp', 0.2, 'kg'),
    i('Oyster sauce', 2, 'tbsp'),
    i('Garlic', 1, 'pc'),
  ]),
  r('Pinakbet', 4, 'filipino', [
    i('Eggplant', 2, 'pc'),
    i('Okra', 8, 'pc'),
    i('Ampalaya', 1, 'pc'),
    i('Squash', 0.5, 'kg'),
    i('Sitaw', 1, 'bunch'),
    i('Tomatoes', 2, 'pc'),
    i('Bagoong', 2, 'tbsp'),
  ]),
  r('Ginataang Gulay', 4, 'filipino', [
    i('Coconut milk', 2, 'can'),
    i('Squash', 0.5, 'kg'),
    i('Sitaw', 1, 'bunch'),
    i('Shrimp', 0.2, 'kg'),
    i('Ginger', 1, 'pc'),
    i('Chili', 1, 'pack'),
  ]),
  r('Bistek Tagalog', 4, 'filipino', [
    i('Beef', 0.75, 'kg'),
    i('Onions', 3, 'pc'),
    i('Soy sauce', 0.25, 'cup'),
    i('Calamansi', 8, 'pc'),
    i('Garlic', 1, 'pc'),
  ]),
  r('Tortang Talong', 3, 'filipino', [
    i('Eggplant', 3, 'pc'),
    i('Eggs', 4, 'pc'),
    i('Onions', 1, 'pc'),
    i('Cooking oil', 3, 'tbsp'),
  ]),
  r('Arroz Caldo', 4, 'filipino', [
    i('Glutinous rice', 1, 'kg'),
    i('Chicken', 0.5, 'kg'),
    i('Ginger', 1, 'pc'),
    i('Garlic', 1, 'pc'),
    i('Eggs', 4, 'pc'),
    i('Spring onions', 1, 'bunch'),
    i('Calamansi', 5, 'pc'),
  ]),
  r('Tapsilog', 2, 'filipino', [
    i('Tapa', 1, 'pack'),
    i('Eggs', 2, 'pc'),
    i('Rice', 0.5, 'kg'),
    i('Garlic', 1, 'pc'),
  ]),
  r('Champorado', 4, 'filipino', [
    i('Glutinous rice', 0.5, 'kg'),
    i('Cocoa', 1, 'pack'),
    i('Condensed milk', 1, 'can'),
    i('Sugar', 0.25, 'kg'),
  ]),

  // ------------------------------------------------------- quick and easy
  r('Fried Rice', 3, 'quick', [
    i('Rice', 0.5, 'kg'),
    i('Eggs', 3, 'pc'),
    i('Garlic', 1, 'pc'),
    i('Spring onions', 1, 'bunch'),
    i('Cooking oil', 2, 'tbsp'),
  ]),
  r('Scrambled Eggs on Toast', 2, 'quick', [
    i('Eggs', 4, 'pc'),
    i('Bread', 1, 'loaf'),
    i('Butter', 1, 'pack'),
    i('Milk', 2, 'tbsp'),
  ]),
  r('Tuna Pasta', 4, 'quick', [
    i('Pasta', 0.5, 'kg'),
    i('Canned tuna', 2, 'can'),
    i('Tomato sauce', 1, 'pack'),
    i('Garlic', 1, 'pc'),
    i('Onions', 1, 'pc'),
    i('Cheese', 1, 'pack'),
  ]),
  r('Grilled Cheese', 2, 'quick', [
    i('Bread', 1, 'loaf'),
    i('Cheddar cheese', 1, 'pack'),
    i('Butter', 1, 'pack'),
  ]),
  r('Vegetable Stir Fry', 3, 'quick', [
    i('Broccoli', 1, 'pc'),
    i('Carrots', 2, 'pc'),
    i('Bell pepper', 1, 'pc'),
    i('Soy sauce', 2, 'tbsp'),
    i('Garlic', 1, 'pc'),
    i('Rice', 0.5, 'kg'),
  ]),
  r('Pancakes', 4, 'quick', [
    i('Flour', 0.5, 'kg'),
    i('Eggs', 2, 'pc'),
    i('Milk', 0.5, 'L'),
    i('Sugar', 0.25, 'kg'),
    i('Baking powder', 1, 'pack'),
    i('Butter', 1, 'pack'),
  ]),

  // ---------------------------------------------------------- from abroad
  r('Spaghetti Bolognese', 5, 'world', [
    i('Pasta', 0.5, 'kg'),
    i('Ground beef', 0.5, 'kg'),
    i('Tomato sauce', 2, 'pack'),
    i('Onions', 1, 'pc'),
    i('Garlic', 1, 'pc'),
    i('Carrots', 1, 'pc'),
    i('Cheese', 1, 'pack'),
  ]),
  r('Carbonara', 4, 'world', [
    i('Pasta', 0.5, 'kg'),
    i('Bacon', 1, 'pack'),
    i('Eggs', 3, 'pc'),
    i('Cream', 1, 'pack'),
    i('Cheese', 1, 'pack'),
    i('Garlic', 1, 'pc'),
  ]),
  r('Chicken Curry', 4, 'world', [
    i('Chicken', 1, 'kg'),
    i('Coconut milk', 2, 'can'),
    i('Curry powder', 1, 'pack'),
    i('Potatoes', 2, 'pc'),
    i('Carrots', 2, 'pc'),
    i('Onions', 1, 'pc'),
    i('Ginger', 1, 'pc'),
  ]),
  r('Beef Tacos', 4, 'world', [
    i('Ground beef', 0.5, 'kg'),
    i('Tortillas', 1, 'pack'),
    i('Tomatoes', 3, 'pc'),
    i('Lettuce', 1, 'pc'),
    i('Cheese', 1, 'pack'),
    i('Onions', 1, 'pc'),
  ]),
  r('Omelette', 2, 'world', [
    i('Eggs', 4, 'pc'),
    i('Cheese', 1, 'pack'),
    i('Tomatoes', 1, 'pc'),
    i('Onions', 1, 'pc'),
    i('Butter', 1, 'pack'),
  ]),
  r('Tomato Soup', 4, 'world', [
    i('Tomatoes', 8, 'pc'),
    i('Onions', 1, 'pc'),
    i('Garlic', 1, 'pc'),
    i('Cream', 1, 'pack'),
    i('Bread', 1, 'loaf'),
  ]),
]

export const libraryCount = () => RECIPE_LIBRARY.length

const normalise = (v) =>
  String(v ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Filter the cookbook by cuisine and free text, matching ingredients too. */
export function searchLibrary(query = '', cuisine = null) {
  const q = normalise(query)
  return RECIPE_LIBRARY.filter((recipe) => {
    if (cuisine && recipe.cuisine !== cuisine) return false
    if (!q) return true
    if (normalise(recipe.name).includes(q)) return true
    // Searching by what you have in the fridge is a real way to use this.
    return recipe.ingredients.some((ing) => normalise(ing.name).includes(q))
  })
}

/**
 * A library entry as one of the user's own recipes.
 *
 * A copy, with fresh ids, so editing or deleting it afterwards behaves exactly
 * like a recipe typed by hand. Nothing in the app should be a special case
 * that cannot be changed.
 */
export function toUserRecipe(entry, makeId) {
  return {
    id: makeId(),
    name: entry.name,
    serves: entry.serves,
    ingredients: entry.ingredients.map((ing) => ({
      id: makeId(),
      name: ing.name,
      qty: ing.qty,
      unit: ing.unit,
    })),
  }
}

/** Names already saved, lowercased — so the sheet can mark what you have. */
export const savedNames = (recipes = []) =>
  new Set(recipes.map((r) => String(r.name).trim().toLowerCase()))
