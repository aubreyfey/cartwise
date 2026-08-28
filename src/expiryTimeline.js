// The expiry list as a run of days you can swipe through.
//
// A static list groups things into "expired", "today", "this week" — which is
// how the data is shaped, not how anyone thinks about their fridge. What
// people actually ask is "what do I need to eat before the weekend", and that
// is a question about days.
//
// So: one entry per day, in order, and the empty days stay in. A gap in the
// middle of your week is information — it is the difference between "nothing
// goes off on Thursday" and "Thursday is off the end of the list".

import { DAY, activePantry, daysUntil, parseDate, startOfDay } from './pantry.js'

/** How urgent a day is, from the most urgent thing in it. */
export function toneFor(days) {
  if (days === null) return null
  if (days < 0) return 'over'
  if (days <= 3) return 'soon'
  return 'ok'
}

/**
 * Days to show, oldest first.
 *
 * The window is bounded so the rail does not run to a tin of beans that
 * expires in 2029: `past` and `future` days around today are always present,
 * and anything outside that with something in it is appended rather than
 * dropped — the item still exists and hiding it would be a lie.
 */
export function timelineDays(pantry = [], { now = Date.now(), past = 5, future = 21 } = {}) {
  const today = startOfDay(now)
  const active = activePantry(pantry)

  // Group by day offset. Items with an unreadable date are handled by the
  // caller, not silently dropped into today.
  const byOffset = new Map()
  for (const item of active) {
    const days = daysUntil(item.expiresAt, now)
    if (days === null) continue
    if (!byOffset.has(days)) byOffset.set(days, [])
    byOffset.get(days).push(item)
  }

  const offsets = new Set()
  for (let d = -past; d <= future; d++) offsets.add(d)
  // Anything with contents, however far out or far back.
  for (const d of byOffset.keys()) offsets.add(d)

  return [...offsets]
    .sort((a, b) => a - b)
    .map((offset) => {
      const items = (byOffset.get(offset) ?? []).sort((a, b) =>
        String(a.name).localeCompare(String(b.name)),
      )
      return {
        offset,
        date: today + offset * DAY,
        items,
        count: items.length,
        // A day is only as urgent as the day itself: everything in it expires
        // on the same date, so one tone covers the lot.
        tone: items.length ? toneFor(offset) : null,
      }
    })
}

/** Items whose date we cannot read. Shown apart rather than guessed at. */
export function undatedItems(pantry = []) {
  return activePantry(pantry).filter((item) => parseDate(item.expiresAt) === null)
}

/**
 * Which day the rail should open on.
 *
 * The first day that needs attention — something already gone off, or going
 * off within three days — because that is why someone opened this screen. If
 * nothing is urgent it opens on today, which is the neutral answer.
 */
export function initialOffset(days = []) {
  const urgent = days.find((d) => d.count > 0 && (d.tone === 'over' || d.tone === 'soon'))
  if (urgent) return urgent.offset
  return days.some((d) => d.offset === 0) ? 0 : (days[0]?.offset ?? 0)
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Short label for a chip on the rail. */
export function chipLabel(offset, date) {
  if (offset === 0) return 'Today'
  return WEEKDAY[new Date(date).getDay()]
}

/** Full label for the heading under the rail. */
export function dayLabel(offset, date) {
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  if (offset === -1) return 'Yesterday'
  const d = new Date(date)
  return `${WEEKDAY[d.getDay()]} ${d.getDate()}`
}

/** How the day reads in a sentence: "3 days ago", "in 5 days". */
export function relativeDay(offset) {
  if (offset === 0) return 'today'
  if (offset === 1) return 'tomorrow'
  if (offset === -1) return 'yesterday'
  if (offset < 0) return `${Math.abs(offset)} days ago`
  return `in ${offset} days`
}
