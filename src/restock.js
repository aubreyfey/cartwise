// "You buy milk every nine days, and it has been fourteen."
//
// Nothing new is collected for this. Every completed trip already records
// what was in it and when, so the buying rhythm of each item is sitting in
// the history waiting to be read.
//
// The hard part is not the arithmetic, it is knowing when to keep quiet. An
// item bought twice, months apart, has no rhythm; saying "due" about it would
// be a guess wearing a number. The rules below are deliberately conservative,
// because a restock list that is wrong twice gets ignored forever.

import { DAY, startOfDay } from './pantry.js'

const key = (name) => String(name ?? '').trim().toLowerCase()

/** Middle value, not the mean: one holiday gap should not drag the estimate. */
export function median(numbers) {
  if (numbers.length === 0) return null
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Every item ever bought, with the days it was bought on.
 *
 * Two trips on the same day count once: shopping twice on a Saturday is one
 * restock, and counting it as two would halve every interval.
 */
export function purchaseHistory(trips = []) {
  const history = new Map()

  for (const trip of trips) {
    const day = startOfDay(trip.completedAt)
    for (const item of trip.items ?? []) {
      const k = key(item.name)
      if (!k) continue
      if (!history.has(k)) {
        history.set(k, { name: item.name, category: item.category ?? 'other', unit: item.unit, days: new Set() })
      }
      const entry = history.get(k)
      entry.days.add(day)
      // Keep the most recent spelling and aisle.
      entry.name = item.name
      entry.category = item.category ?? entry.category
      entry.unit = item.unit ?? entry.unit
    }
  }

  return [...history.values()].map((e) => ({
    ...e,
    days: [...e.days].sort((a, b) => a - b),
  }))
}

/**
 * How often an item gets bought, or null when there is no honest answer.
 *
 * Refuses when:
 *  - there are fewer than two purchases, so there is no interval at all
 *  - the median interval is under a day, which means same-day duplicates
 *  - the gaps are wildly inconsistent, where a median is a number without a
 *    meaning. Judged on the interquartile-ish spread rather than the range,
 *    so a single unusual gap does not disqualify an otherwise steady item.
 */
export function rhythmOf(entry) {
  const days = entry.days ?? []
  if (days.length < 2) return null

  const gaps = []
  for (let i = 1; i < days.length; i += 1) {
    gaps.push(Math.round((days[i] - days[i - 1]) / DAY))
  }

  const everyDays = median(gaps)
  if (everyDays === null || everyDays < 1) return null

  // With three or more gaps we can ask whether they agree with each other.
  if (gaps.length >= 3) {
    const spread = median(gaps.map((g) => Math.abs(g - everyDays)))
    if (spread > everyDays * 0.75) return null
  }

  return {
    everyDays: Math.round(everyDays),
    purchases: days.length,
    lastBought: days[days.length - 1],
    steady: gaps.length >= 3,
  }
}

/**
 * Items that look due, soonest-overdue last so the most pressing is first.
 *
 * `dueIn` is negative for something already overdue, which is what the UI
 * leads with.
 */
export function restockDue(trips = [], now = Date.now(), { horizonDays = 2 } = {}) {
  const today = startOfDay(now)

  return purchaseHistory(trips)
    .map((entry) => {
      const rhythm = rhythmOf(entry)
      if (!rhythm) return null
      const daysSince = Math.round((today - rhythm.lastBought) / DAY)
      return {
        name: entry.name,
        category: entry.category,
        unit: entry.unit,
        everyDays: rhythm.everyDays,
        purchases: rhythm.purchases,
        steady: rhythm.steady,
        daysSince,
        dueIn: rhythm.everyDays - daysSince,
      }
    })
    .filter(Boolean)
    .filter((r) => r.dueIn <= horizonDays)
    .sort((a, b) => a.dueIn - b.dueIn)
}

/**
 * Drop anything already on the list, ticked or not.
 *
 * Ticked matters here. The panel's job is "you might have forgotten this",
 * and something sitting on screen has not been forgotten — suggesting it
 * would add a second row for an item already in the trolley.
 */
export function excludeOnList(suggestions = [], listItems = []) {
  const on = new Set(listItems.map((i) => key(i.name)))
  return suggestions.filter((s) => !on.has(key(s.name)))
}

/** Wording for a single suggestion. */
export function restockLabel(item) {
  if (item.dueIn < 0) {
    const over = Math.abs(item.dueIn)
    return `${over} ${over === 1 ? 'day' : 'days'} overdue · usually every ${item.everyDays}`
  }
  if (item.dueIn === 0) return `due today · usually every ${item.everyDays} days`
  return `due in ${item.dueIn} ${item.dueIn === 1 ? 'day' : 'days'}`
}
