// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { RECIPE_STEPS, stepCount, stepsFor } from './recipeSteps.js'
import { RECIPE_LIBRARY } from './recipeLibrary.js'

describe('the method for every dish', () => {
  it('covers every recipe in the cookbook', () => {
    // A recipe with ingredients and no method is a shopping list wearing a
    // recipe's name. Any dish added later without steps fails here.
    const missing = RECIPE_LIBRARY.filter((r) => stepsFor(r.name).length === 0).map((r) => r.name)
    assert.deepEqual(missing, [])
  })

  it('has no steps for dishes that are not in the cookbook', () => {
    const names = new Set(RECIPE_LIBRARY.map((r) => r.name.toLowerCase()))
    const orphans = Object.keys(RECIPE_STEPS).filter((k) => !names.has(k.toLowerCase()))
    assert.deepEqual(orphans, [])
  })

  it('gives each dish enough steps to be a method, and few enough to read', () => {
    for (const [name, steps] of Object.entries(RECIPE_STEPS)) {
      assert.ok(steps.length >= 4, `${name} has only ${steps.length} steps`)
      assert.ok(steps.length <= 7, `${name} has ${steps.length} steps — too many to scan`)
    }
  })

  it('writes steps as instructions, not fragments', () => {
    for (const [name, steps] of Object.entries(RECIPE_STEPS)) {
      for (const step of steps) {
        assert.ok(step.length > 15, `${name}: "${step}" is too short to be useful`)
        assert.match(step, /[.!]$/, `${name}: "${step}" does not end as a sentence`)
      }
    }
  })

  it('matches a name whatever its case', () => {
    assert.ok(stepsFor('chicken adobo').length > 0)
    assert.ok(stepsFor('  Chicken Adobo  ').length > 0)
  })

  it('returns nothing rather than throwing for an unknown dish', () => {
    assert.deepEqual(stepsFor('Beef Wellington'), [])
    assert.deepEqual(stepsFor(''), [])
    assert.deepEqual(stepsFor(null), [])
    assert.deepEqual(stepsFor(), [])
  })

  it('has one method per dish in the cookbook', () => {
    assert.equal(stepCount(), RECIPE_LIBRARY.length)
  })
})
