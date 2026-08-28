// Which face the character is wearing, and why.
//
// The states are driven by things that have actually happened, not by a timer
// or a random pick. A mascot that grins at an empty app, or looks worried for
// no reason, is decoration pretending to be feedback — and people work out
// very quickly that it means nothing.
//
// Kept as plain data-in, state-out so it can be tested without rendering
// anything.

export const MASCOT_STATES = [
  'idle',
  'happy',
  'wink',
  'thinking',
  'walking',
  'loading',
  'success',
  'sad',
]

/**
 * The home-screen face.
 *
 * Order matters: the first true thing wins, so a brand-new app reads as "you
 * have nothing yet" rather than as a celebration of nothing.
 */
export function homeMascotState({
  carts = [],
  trips = [],
  savedVsBudget = 0,
  overBudgetNow = false,
  shopping = false,
} = {}) {
  const anyItems = carts.some((c) => (c.items?.length ?? 0) > 0)

  // Nothing at all yet. The empty basket is the honest picture.
  if (!anyItems && trips.length === 0) return 'sad'

  // Mid-trip and over budget: worried, not scolding.
  if (shopping && overBudgetNow) return 'thinking'
  if (shopping) return 'walking'

  // Money kept back across finished trips is the one thing worth celebrating.
  if (trips.length > 0 && savedVsBudget > 0) return 'happy'

  // Shopping listed but nothing finished: ready to go.
  if (anyItems) return 'wink'

  return 'idle'
}

/**
 * The face for a finished trip, shown on the receipt.
 *
 * Under budget is a success; over budget is not a failure the character should
 * sulk about — it is a fact, so it gets the thinking face rather than the sad
 * one. Being told off by a cartoon basket is not why anyone installed this.
 */
export function tripMascotState({ total = 0, budget = 0 } = {}) {
  if (budget > 0 && total > budget) return 'thinking'
  if (budget > 0 && total <= budget) return 'success'
  return 'idle'
}

/** Whether this state should get the slow idle bob. */
export const breathes = (state) => state === 'idle' || state === 'wink' || state === 'sad'
