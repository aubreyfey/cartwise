// What CartWise can do yet, and what it needs from you to do more.
//
// The cold start is this app's hardest problem. Almost everything clever here
// — price history, which shop is cheaper, restock rhythm, how much you saved —
// is computed from your own shopping, so on day one none of it can say
// anything. A new user sees a competent list app and has no way of knowing
// there is more coming.
//
// So say it. Each milestone names the thing it unlocks, in the order they
// actually unlock, and the whole card disappears once they are done. It is a
// promise the app then has to keep, which is why every line here is checked
// against real stored data rather than a counter of screens visited.

const DAY = 86_400_000

/** Distinct shops we have a recorded price for. */
function shopsWithPrices(purchases = []) {
  const shops = new Set()
  for (const p of purchases) {
    if (p.storeId && typeof p.price === 'number' && p.price > 0) shops.add(p.storeId)
  }
  return shops.size
}

/** Products bought on more than one separate day — the basis of a rhythm. */
function repeatBuys(purchases = []) {
  const days = new Map()
  for (const p of purchases) {
    if (!p.productId) continue
    const day = Math.floor(p.purchasedAt / DAY)
    if (!days.has(p.productId)) days.set(p.productId, new Set())
    days.get(p.productId).add(day)
  }
  let repeats = 0
  for (const set of days.values()) if (set.size > 1) repeats += 1
  return repeats
}

/**
 * The milestones, in unlock order. `done` is derived entirely from stored
 * data, so it cannot drift out of step with what the app can actually do.
 */
export function milestones({ carts = [], trips = [], purchases = [], vault = [] } = {}) {
  const anyItems = carts.some((c) => (c.items ?? []).length > 0)
  const priced = purchases.filter((p) => typeof p.price === 'number' && p.price > 0)

  return [
    {
      id: 'list',
      label: 'Put something on a list',
      unlocks: 'a running total against your budget',
      done: anyItems || vault.length > 0,
    },
    {
      id: 'trip',
      label: 'Finish your first shop',
      unlocks: 'your Vault, so prices fill themselves in next time',
      done: trips.length > 0,
    },
    {
      id: 'history',
      label: 'Buy something a second time',
      unlocks: 'price history, and whether it got dearer',
      done: repeatBuys(priced) > 0,
    },
    {
      id: 'compare',
      label: 'Price something at a second shop',
      unlocks: 'which shop is actually cheaper for your list',
      done: shopsWithPrices(priced) > 1,
    },
  ]
}

/**
 * The card's state. Returns null once everything is done — a checklist that
 * lingers after completion is clutter, and the app has by then earned the
 * right to just work.
 */
export function gettingStarted(data) {
  const steps = milestones(data)
  const done = steps.filter((s) => s.done).length
  if (done === steps.length) return null

  return {
    steps,
    done,
    total: steps.length,
    // The one to do next, which is what the card leads with.
    next: steps.find((s) => !s.done) ?? null,
  }
}
