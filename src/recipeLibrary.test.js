// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CUISINES,
  RECIPE_LIBRARY,
  libraryCount,
  savedNames,
  searchLibrary,
  toUserRecipe,
} from './recipeLibrary.js'
import { guessCategory } from './categories.js'
import { searchStaples } from './staples.js'
import { planAddition } from './recipes.js'

describe('the cookbook itself', () => {
  it('has enough to be worth opening', () => {
    assert.ok(libraryCount() >= 25, `only ${libraryCount()} recipes`)
  })

  it('has no duplicate names', () => {
    const seen = new Set()
    for (const r of RECIPE_LIBRARY) {
      const key = r.name.toLowerCase()
      assert.equal(seen.has(key), false, `duplicate recipe: ${r.name}`)
      seen.add(key)
    }
  })

  it('gives every recipe ingredients, servings and a cuisine we list', () => {
    const known = new Set(CUISINES.map((c) => c.id))
    for (const r of RECIPE_LIBRARY) {
      assert.ok(r.ingredients.length >= 3, `${r.name} has too few ingredients`)
      assert.ok(r.serves > 0, `${r.name} serves nobody`)
      assert.ok(known.has(r.cuisine), `${r.name} has unknown cuisine ${r.cuisine}`)
    }
  })

  it('gives every ingredient a name, a quantity and a unit', () => {
    for (const r of RECIPE_LIBRARY) {
      for (const ing of r.ingredients) {
        assert.ok(ing.name, `${r.name} has a nameless ingredient`)
        assert.ok(ing.qty > 0, `${r.name}: ${ing.name} has no quantity`)
        assert.ok(ing.unit, `${r.name}: ${ing.name} has no unit`)
      }
    }
  })

  it('covers every cuisine it advertises', () => {
    // A filter chip that always returns nothing is a broken promise.
    for (const c of CUISINES) {
      assert.ok(
        RECIPE_LIBRARY.some((r) => r.cuisine === c.id),
        `no recipes for ${c.label}`,
      )
    }
  })

  it('names ingredients the rest of the app recognises', () => {
    // Ingredients land on a shopping list, where they get a sticker and an
    // aisle. A name nothing matches becomes an unsorted grey blob.
    const unknown = []
    for (const r of RECIPE_LIBRARY) {
      for (const ing of r.ingredients) {
        const matched = searchStaples(ing.name).some(
          (s) => s.name.toLowerCase() === ing.name.toLowerCase(),
        )
        if (!matched) unknown.push(`${r.name}: ${ing.name}`)
      }
    }
    assert.deepEqual(unknown, [], 'ingredients with no matching staple')
  })

  it('gives every ingredient a category that is not the fallback', () => {
    const vague = []
    for (const r of RECIPE_LIBRARY) {
      for (const ing of r.ingredients) {
        if (guessCategory(ing.name) === 'other') vague.push(`${r.name}: ${ing.name}`)
      }
    }
    assert.deepEqual(vague, [], 'ingredients that would land in Other')
  })
})

describe('searchLibrary', () => {
  it('returns everything for an empty query', () => {
    assert.equal(searchLibrary('').length, libraryCount())
  })

  it('finds a dish by name', () => {
    const found = searchLibrary('adobo')
    assert.ok(found.length >= 2)
    assert.ok(found.every((r) => r.name.toLowerCase().includes('adobo')))
  })

  it('finds dishes by an ingredient you already have', () => {
    // Searching by what is in the fridge is a real way to use this.
    const found = searchLibrary('eggplant')
    assert.ok(found.some((r) => r.name === 'Tortang Talong'))
  })

  it('filters by cuisine', () => {
    const filipino = searchLibrary('', 'filipino')
    assert.ok(filipino.length > 10)
    assert.ok(filipino.every((r) => r.cuisine === 'filipino'))
  })

  it('combines a cuisine with a query', () => {
    const found = searchLibrary('chicken', 'world')
    assert.ok(found.every((r) => r.cuisine === 'world'))
    assert.ok(found.some((r) => r.name === 'Chicken Curry'))
  })

  it('is insensitive to case and punctuation', () => {
    assert.ok(searchLibrary('  ADOBO ').length >= 2)
  })

  it('returns nothing for a dish we do not have', () => {
    assert.deepEqual(searchLibrary('beef wellington'), [])
  })
})

describe('toUserRecipe', () => {
  let n = 0
  const makeId = () => `id-${++n}`
  const entry = RECIPE_LIBRARY[0]
  const copy = toUserRecipe(entry, makeId)

  it('carries the name, servings and every ingredient', () => {
    assert.equal(copy.name, entry.name)
    assert.equal(copy.serves, entry.serves)
    assert.equal(copy.ingredients.length, entry.ingredients.length)
  })

  it('gives everything a fresh id, so it edits like any other recipe', () => {
    assert.ok(copy.id)
    assert.ok(copy.ingredients.every((ing) => ing.id))
    assert.equal(new Set(copy.ingredients.map((i) => i.id)).size, copy.ingredients.length)
  })

  it('is a copy, not a reference into the library', () => {
    // Editing a saved recipe must not rewrite the cookbook for everyone else.
    copy.ingredients[0].qty = 999
    assert.notEqual(entry.ingredients[0].qty, 999)
  })

  it('produces something planAddition can actually use', () => {
    // The whole point is putting the ingredients on a list.
    const fresh = toUserRecipe(RECIPE_LIBRARY[0], () => `x-${++n}`)
    const plan = planAddition(fresh, fresh.serves, [])
    assert.equal(plan.total, fresh.ingredients.length)
  })
})

describe('savedNames', () => {
  it('lowercases, so the sheet can mark what you already have', () => {
    assert.equal(savedNames([{ name: 'Chicken Adobo' }]).has('chicken adobo'), true)
  })

  it('copes with nothing saved', () => {
    assert.equal(savedNames().size, 0)
  })
})
