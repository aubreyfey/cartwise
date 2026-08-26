// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  excludeOnList,
  median,
  purchaseHistory,
  restockDue,
  restockLabel,
  rhythmOf,
} from './restock.js'
import { splitShop } from './stores.js'
import {
  assign,
  mealCount,
  planFor,
  prunePast,
  recipesOn,
  shoppingFor,
  unassign,
  weekFrom,
} from './mealplan.js'
import { addIngredient, makeRecipe } from './recipes.js'

const DAY = 86400000
const NOW = new Date(2026, 5, 30, 10, 0).getTime()
const ago = (days) => NOW - days * DAY

/** A trip containing the given item names, `days` ago. */
const trip = (days, ...names) => ({
  id: `t${days}`,
  completedAt: ago(days),
  items: names.map((n) => ({ name: n, category: 'dairy', qty: 1, price: 10, unit: 'pc' })),
})

describe('median', () => {
  it('takes the middle, averaging the two middles when even', () => {
    assert.equal(median([5, 1, 3]), 3)
    assert.equal(median([1, 2, 3, 4]), 2.5)
    assert.equal(median([]), null)
  })

  it('ignores an outlier the way a mean would not', () => {
    assert.equal(median([7, 7, 7, 90]), 7)
  })
})

describe('purchaseHistory', () => {
  it('collects the days each item was bought, oldest first', () => {
    const history = purchaseHistory([trip(20, 'Milk'), trip(10, 'Milk', 'Bread')])
    const milk = history.find((h) => h.name === 'Milk')
    assert.equal(milk.days.length, 2)
    assert.ok(milk.days[0] < milk.days[1])
    assert.equal(history.length, 2)
  })

  it('counts two trips on the same day once', () => {
    // Shopping twice on a Saturday is one restock; counting it twice would
    // halve every interval.
    const history = purchaseHistory([trip(5, 'Milk'), trip(5, 'Milk')])
    assert.equal(history[0].days.length, 1)
  })

  it('matches regardless of case and spacing', () => {
    const history = purchaseHistory([trip(9, 'Milk'), trip(2, '  milk ')])
    assert.equal(history.length, 1)
    assert.equal(history[0].days.length, 2)
  })

  it('ignores nameless rows rather than crashing', () => {
    const odd = { id: 'x', completedAt: ago(3), items: [{ name: '  ' }, { name: 'Milk' }] }
    assert.deepEqual(purchaseHistory([odd]).map((h) => h.name), ['Milk'])
  })
})

describe('rhythmOf', () => {
  const at = (...daysAgo) => ({ days: daysAgo.map((d) => ago(d)).sort((a, b) => a - b) })

  it('finds a steady interval', () => {
    const r = rhythmOf(at(28, 21, 14, 7))
    assert.equal(r.everyDays, 7)
    assert.equal(r.purchases, 4)
    assert.equal(r.steady, true)
  })

  it('says nothing from a single purchase', () => {
    assert.equal(rhythmOf(at(7)), null)
    assert.equal(rhythmOf({ days: [] }), null)
  })

  it('refuses when no two gaps agree', () => {
    // Gaps of 2, 20 and 45 days: every interval disagrees with every other,
    // so the median is a number without a meaning behind it.
    assert.equal(rhythmOf(at(67, 65, 45, 0)), null)
  })

  it('reads a resumed habit from its recent rhythm', () => {
    // Gaps of 2, 40, 3. The long gap is an item that was dropped and picked
    // up again; the recent behaviour is the useful signal, so this is not
    // treated as rhythmless.
    const r = rhythmOf(at(45, 43, 3, 0))
    assert.ok(r, 'still has a usable rhythm')
    assert.equal(r.everyDays, 3)
  })

  it('tolerates one unusual gap in an otherwise steady item', () => {
    // Weekly, with a fortnight away in the middle.
    const r = rhythmOf(at(35, 28, 14, 7, 0))
    assert.ok(r, 'still has a rhythm')
    assert.equal(r.everyDays, 7)
  })

  it('refuses same-day duplicates that survived into the days list', () => {
    assert.equal(rhythmOf({ days: [ago(3), ago(3) + 1000] }), null)
  })
})

describe('restockDue', () => {
  const weekly = [trip(21, 'Milk'), trip(14, 'Milk'), trip(7, 'Milk')]

  it('flags an item that is overdue', () => {
    // Weekly milk, last bought 7 days ago: due today.
    const due = restockDue(weekly, NOW)
    const milk = due.find((d) => d.name === 'Milk')
    assert.ok(milk, 'milk is suggested')
    assert.equal(milk.everyDays, 7)
    assert.equal(milk.daysSince, 7)
    assert.equal(milk.dueIn, 0)
  })

  it('stays quiet about something bought yesterday', () => {
    const fresh = [trip(15, 'Milk'), trip(8, 'Milk'), trip(1, 'Milk')]
    assert.deepEqual(restockDue(fresh, NOW), [])
  })

  it('puts the most overdue first', () => {
    const trips = [
      trip(30, 'Milk', 'Rice'), trip(23, 'Milk'), trip(16, 'Milk'),
      trip(20, 'Rice'), trip(10, 'Rice'),
    ]
    const due = restockDue(trips, NOW)
    assert.ok(due.length >= 2)
    assert.ok(due[0].dueIn <= due[1].dueIn, 'sorted by urgency')
  })

  it('says nothing at all from a single trip', () => {
    assert.deepEqual(restockDue([trip(9, 'Milk')], NOW), [])
  })

  it('copes with no history', () => {
    assert.deepEqual(restockDue([], NOW), [])
    assert.deepEqual(restockDue(), [])
  })
})

describe('excludeOnList', () => {
  it('does not suggest what is already on the list', () => {
    const suggestions = [{ name: 'Milk' }, { name: 'Rice' }]
    const list = [{ name: '  milk ', checked: false }]
    assert.deepEqual(excludeOnList(suggestions, list).map((s) => s.name), ['Rice'])
  })

  it('drops something already ticked off too', () => {
    // It is on screen, in the trolley. Suggesting it would add a second row
    // for a thing that has plainly not been forgotten.
    const list = [{ name: 'Milk', checked: true }]
    assert.deepEqual(excludeOnList([{ name: 'Milk' }], list), [])
  })

  it('leaves suggestions alone when the list is empty', () => {
    assert.equal(excludeOnList([{ name: 'Milk' }], []).length, 1)
    assert.equal(excludeOnList([{ name: 'Milk' }]).length, 1)
  })
})

describe('restockLabel', () => {
  it('leads with how overdue it is', () => {
    assert.match(restockLabel({ dueIn: -3, everyDays: 7 }), /3 days overdue/)
    assert.match(restockLabel({ dueIn: -1, everyDays: 7 }), /1 day overdue/)
    assert.match(restockLabel({ dueIn: 0, everyDays: 7 }), /due today/)
    assert.match(restockLabel({ dueIn: 2, everyDays: 7 }), /due in 2 days/)
  })
})

describe('splitShop', () => {
  const stores = [
    { id: 'a', name: 'Aldi' },
    { id: 'b', name: 'Market' },
  ]
  const vault = [
    { id: '1', name: 'Milk', price: 3, prices: { a: 3, b: 4 } },
    { id: '2', name: 'Rice', price: 20, prices: { a: 25, b: 20 } },
    { id: '3', name: 'Caviar', price: 90, prices: { a: 90 } },
  ]
  const items = [
    { name: 'Milk', qty: 2 },
    { name: 'Rice', qty: 1 },
    { name: 'Caviar', qty: 1 },
  ]

  it('sends each item to its cheapest store', () => {
    const plan = splitShop(stores, vault, items)
    const aldi = plan.groups.find((g) => g.store.id === 'a')
    const market = plan.groups.find((g) => g.store.id === 'b')
    assert.deepEqual(aldi.lines.map((l) => l.item.name), ['Milk'])
    assert.deepEqual(market.lines.map((l) => l.item.name), ['Rice'])
  })

  it('counts items priced at only one store as unknown', () => {
    const plan = splitShop(stores, vault, items)
    assert.equal(plan.comparable, 2)
    assert.equal(plan.unknown, 1, 'caviar sits out')
  })

  it('compares against the best single shop, not the worst', () => {
    // Split: milk at Aldi (6) + rice at Market (20) = 26.
    // Best single: Aldi 6+25=31, Market 8+20=28 -> 28. Saving 2.
    const plan = splitShop(stores, vault, items)
    assert.equal(plan.splitTotal, 26)
    assert.equal(plan.bestSingle.store.name, 'Market')
    assert.equal(plan.bestSingle.total, 28)
    assert.equal(plan.saving, 2)
  })

  it('returns nothing when there is nothing to compare', () => {
    assert.equal(splitShop([stores[0]], vault, items), null, 'needs two stores')
    assert.equal(splitShop(stores, vault, []), null, 'needs items')
    assert.equal(splitShop(stores, [], items), null, 'needs prices')
  })
})

describe('meal plan', () => {
  const dinner = () => {
    let r = makeRecipe('Adobo', 2)
    r = addIngredient(r, { name: 'Chicken', qty: 1, unit: 'kg' })
    r = addIngredient(r, { name: 'Garlic', qty: 4, unit: 'pc' })
    return r
  }
  const soup = () => {
    let r = makeRecipe('Soup', 2)
    r = addIngredient(r, { name: 'Garlic', qty: 2, unit: 'pc' })
    return r
  }

  it('gives seven days starting today', () => {
    const week = weekFrom(NOW)
    assert.equal(week.length, 7)
    assert.equal(week[0], '2026-06-30')
    assert.equal(week[6], '2026-07-06', 'crosses the month end')
  })

  it('assigns and unassigns without duplicating', () => {
    let plan = assign({}, '2026-06-30', 'r1')
    plan = assign(plan, '2026-06-30', 'r1')
    assert.deepEqual(planFor(plan, '2026-06-30'), ['r1'])

    plan = assign(plan, '2026-06-30', 'r2')
    assert.equal(planFor(plan, '2026-06-30').length, 2)

    plan = unassign(plan, '2026-06-30', 'r1')
    assert.deepEqual(planFor(plan, '2026-06-30'), ['r2'])
  })

  it('drops the day entirely once its last meal is removed', () => {
    let plan = assign({}, '2026-06-30', 'r1')
    plan = unassign(plan, '2026-06-30', 'r1')
    assert.equal('2026-06-30' in plan, false)
  })

  it('ignores a recipe that has since been deleted', () => {
    const plan = { '2026-06-30': ['gone', 'r1'] }
    const recipes = [{ ...dinner(), id: 'r1' }]
    assert.deepEqual(recipesOn(plan, recipes, '2026-06-30').map((r) => r.name), ['Adobo'])
  })

  it('adds up an ingredient wanted by two meals', () => {
    const recipes = [{ ...dinner(), id: 'r1' }, { ...soup(), id: 'r2' }]
    const plan = { '2026-06-30': ['r1'], '2026-07-01': ['r2'] }
    const shopping = shoppingFor(plan, recipes, ['2026-06-30', '2026-07-01'])
    const garlic = shopping.find((s) => s.name === 'Garlic')
    assert.equal(garlic.qty, 6, '4 + 2 on one line')
    assert.deepEqual(garlic.from, ['Adobo', 'Soup'])
    assert.equal(shopping.length, 2)
  })

  it('keeps different units apart', () => {
    // 1 kg of chicken and 1 pc of chicken are not 2 of anything.
    const a = { ...makeRecipe('A', 1), id: 'a' }
    a.ingredients = [{ id: 'i1', name: 'Chicken', qty: 1, unit: 'kg', category: 'meat' }]
    const b = { ...makeRecipe('B', 1), id: 'b' }
    b.ingredients = [{ id: 'i2', name: 'Chicken', qty: 1, unit: 'pc', category: 'meat' }]
    const shopping = shoppingFor({ d: ['a', 'b'] }, [a, b], ['d'])
    assert.equal(shopping.length, 2)
  })

  it('forgets yesterday but keeps today', () => {
    const plan = { '2026-06-29': ['r1'], '2026-06-30': ['r2'], '2026-07-05': ['r3'] }
    const pruned = prunePast(plan, NOW)
    assert.deepEqual(Object.keys(pruned).sort(), ['2026-06-30', '2026-07-05'])
  })

  it('counts the meals in a week', () => {
    const plan = { '2026-06-30': ['r1', 'r2'], '2026-07-01': ['r3'] }
    assert.equal(mealCount(plan, ['2026-06-30', '2026-07-01']), 3)
    assert.equal(mealCount({}, ['2026-06-30']), 0)
  })
})
