// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MASCOT_STATES, breathes, homeMascotState, tripMascotState } from './mascotState.js'

const withItems = [{ id: 'c1', items: [{ id: 'i1', name: 'Rice' }] }]
const empty = [{ id: 'c1', items: [] }]
const oneTrip = [{ id: 't1' }]

describe('homeMascotState', () => {
  it('is sad on a genuinely empty app', () => {
    // The honest picture on day one. A grin at an empty app is decoration
    // pretending to be feedback.
    assert.equal(homeMascotState({ carts: empty, trips: [] }), 'sad')
    assert.equal(homeMascotState({}), 'sad')
  })

  it('is happy once money has actually been kept back', () => {
    assert.equal(
      homeMascotState({ carts: withItems, trips: oneTrip, savedVsBudget: 240 }),
      'happy',
    )
  })

  it('is not happy about savings of nothing', () => {
    assert.equal(
      homeMascotState({ carts: withItems, trips: oneTrip, savedVsBudget: 0 }),
      'wink',
    )
  })

  it('walks while a trip is in progress', () => {
    assert.equal(homeMascotState({ carts: withItems, trips: oneTrip, shopping: true }), 'walking')
  })

  it('worries when the trip in progress has gone over', () => {
    assert.equal(
      homeMascotState({ carts: withItems, trips: oneTrip, shopping: true, overBudgetNow: true }),
      'thinking',
    )
  })

  it('prefers the mid-trip face over a past success', () => {
    // What is happening now beats what happened last month.
    assert.equal(
      homeMascotState({ carts: withItems, trips: oneTrip, savedVsBudget: 900, shopping: true }),
      'walking',
    )
  })

  it('winks when there is a list but no finished trip', () => {
    assert.equal(homeMascotState({ carts: withItems, trips: [] }), 'wink')
  })

  it('never returns a state the component cannot draw', () => {
    const cases = [
      {},
      { carts: empty, trips: [] },
      { carts: withItems, trips: oneTrip, savedVsBudget: 5 },
      { carts: withItems, trips: oneTrip, shopping: true },
      { carts: withItems, trips: oneTrip, shopping: true, overBudgetNow: true },
      { carts: withItems, trips: [] },
      { carts: empty, trips: oneTrip },
    ]
    for (const c of cases) {
      assert.ok(MASCOT_STATES.includes(homeMascotState(c)), JSON.stringify(c))
    }
  })
})

describe('tripMascotState', () => {
  it('celebrates coming in under budget', () => {
    assert.equal(tripMascotState({ total: 800, budget: 1000 }), 'success')
  })

  it('does not sulk about going over', () => {
    // Being told off by a cartoon basket is not why anyone installed this.
    assert.equal(tripMascotState({ total: 1200, budget: 1000 }), 'thinking')
  })

  it('stays neutral when there was no budget to judge against', () => {
    assert.equal(tripMascotState({ total: 1200, budget: 0 }), 'idle')
    assert.equal(tripMascotState({}), 'idle')
  })

  it('treats exactly on budget as a success', () => {
    assert.equal(tripMascotState({ total: 1000, budget: 1000 }), 'success')
  })
})

describe('breathes', () => {
  it('bobs only the resting faces', () => {
    assert.equal(breathes('idle'), true)
    assert.equal(breathes('wink'), true)
    // A celebration has its own motion; bobbing as well would be noise.
    assert.equal(breathes('success'), false)
    assert.equal(breathes('walking'), false)
  })
})
