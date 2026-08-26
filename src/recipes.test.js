// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  addIngredient,
  addRecipe,
  describeRecipe,
  findRecipe,
  makeRecipe,
  planAddition,
  removeIngredient,
  removeRecipe,
  scaleFor,
  updateRecipe,
} from './recipes.js'
import { ACCENTS, TEXTURES, accentOf, textureOf } from './theme.js'

const withIngredients = () => {
  let r = makeRecipe('Adobo', 4)
  r = addIngredient(r, { name: 'Chicken Thighs', qty: 1, unit: 'kg' })
  r = addIngredient(r, { name: 'Soy Sauce', qty: 120, unit: 'mL' })
  r = addIngredient(r, { name: 'Garlic', qty: 6, unit: 'pc' })
  return r
}

describe('recipes', () => {
  it('refuses a blank name', () => {
    assert.equal(addRecipe([], '   ').length, 0)
    assert.equal(addRecipe([], 'Adobo').length, 1)
  })

  it('never serves fewer than one', () => {
    assert.equal(makeRecipe('X', 0).serves, 1)
    assert.equal(makeRecipe('X', -3).serves, 1)
  })

  it('guesses an aisle for each ingredient', () => {
    const r = withIngredients()
    assert.equal(r.ingredients[0].category, 'meat')
    assert.equal(r.ingredients[2].category, 'produce')
  })

  it('adds, finds, updates and removes', () => {
    const list = addRecipe([], 'Adobo')
    const id = list[0].id
    assert.equal(findRecipe(list, id).name, 'Adobo')
    assert.equal(updateRecipe(list, id, { serves: 6 })[0].serves, 6)
    assert.equal(updateRecipe(list, id, (r) => ({ name: r.name + '!' }))[0].name, 'Adobo!')
    assert.equal(removeRecipe(list, id).length, 0)
    assert.equal(findRecipe(list, 'nope'), null)
  })

  it('removes one ingredient without touching the rest', () => {
    const r = withIngredients()
    const fewer = removeIngredient(r, r.ingredients[1].id)
    assert.deepEqual(fewer.ingredients.map((i) => i.name), ['Chicken Thighs', 'Garlic'])
  })

  it('describes itself for a card', () => {
    assert.equal(describeRecipe(withIngredients()), '3 ingredients · serves 4')
    assert.equal(describeRecipe(makeRecipe('X', 1)), '0 ingredients · serves 1')
  })
})

describe('scaling', () => {
  it('doubles for twice the people', () => {
    const scaled = scaleFor(withIngredients(), 8)
    assert.equal(scaled[0].qty, 2)
    assert.equal(scaled[1].qty, 240)
  })

  it('halves, keeping a sane number of decimals', () => {
    const scaled = scaleFor(withIngredients(), 2)
    assert.equal(scaled[0].qty, 0.5)
    assert.equal(scaled[2].qty, 3)
  })

  it('rounds a recurring third rather than printing seventeen digits', () => {
    const r = addIngredient(makeRecipe('X', 3), { name: 'Rice', qty: 1, unit: 'kg' })
    assert.equal(scaleFor(r, 1)[0].qty, 0.333)
  })

  it('never divides by zero', () => {
    const broken = { ...withIngredients(), serves: 0 }
    assert.equal(scaleFor(broken, 2)[0].qty, 2, 'treated as serving one')
  })

  it('leaves the recipe itself untouched', () => {
    const r = withIngredients()
    scaleFor(r, 100)
    assert.equal(r.ingredients[0].qty, 1)
  })
})

describe('planAddition', () => {
  it('separates what is new from what is already on the list', () => {
    const list = [
      { id: 'a', name: 'Garlic', qty: 2, checked: false },
      { id: 'b', name: 'Bread', qty: 1, checked: false },
    ]
    const plan = planAddition(withIngredients(), 4, list)
    assert.equal(plan.total, 3)
    assert.deepEqual(plan.fresh.map((i) => i.name), ['Chicken Thighs', 'Soy Sauce'])
    assert.deepEqual(plan.merging.map((m) => m.ingredient.name), ['Garlic'])
  })

  it('matches regardless of case and spacing', () => {
    const list = [{ id: 'a', name: '  garlic ', qty: 1, checked: false }]
    assert.equal(planAddition(withIngredients(), 4, list).merging.length, 1)
  })

  it('ignores items already ticked off', () => {
    // Something in the trolley is bought; wanting it for a recipe means
    // buying more, not merging into a line that is already done.
    const list = [{ id: 'a', name: 'Garlic', qty: 2, checked: true }]
    assert.equal(planAddition(withIngredients(), 4, list).fresh.length, 3)
  })

  it('copes with an empty list', () => {
    assert.equal(planAddition(withIngredients(), 4, []).fresh.length, 3)
    assert.equal(planAddition(withIngredients(), 4).fresh.length, 3)
  })
})

describe('theme', () => {
  it('every accent is complete and unique', () => {
    const ids = ACCENTS.map((a) => a.id)
    assert.equal(new Set(ids).size, ids.length)
    for (const a of ACCENTS) {
      assert.ok(a.label && a.color && a.soft && a.softDark, `${a.id} incomplete`)
      assert.match(a.color, /^#[0-9a-f]{6}$/i, `${a.id} colour`)
    }
  })

  it('falls back for an unknown accent or texture', () => {
    assert.equal(accentOf('neon'), 'violet')
    assert.equal(accentOf(undefined), 'violet')
    assert.equal(textureOf('plaid'), 'none')
    assert.equal(textureOf(null), 'none')
  })

  it('keeps a real choice', () => {
    assert.equal(accentOf('ocean'), 'ocean')
    assert.equal(textureOf('grid'), 'grid')
  })

  it('offers a plain texture so it can be switched off', () => {
    assert.ok(TEXTURES.some((t) => t.id === 'none'))
  })
})
