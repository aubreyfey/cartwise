// The in-app tour: the App Store panels, shown as a story.
//
// These are the real designed panels rather than a re-creation. They live in
// public/tour as WebP at phone width — 407 KB for the set instead of the
// 5.9 MB the print-resolution PNGs weigh. Regenerate with `npm run tour:images`
// after changing anything in marketing/.
//
// `title` and `body` are not drawn: the text is part of the image. They are
// the alternative text, so the tour is not a wall of unlabelled pictures to
// anyone using a screen reader.

export const TOUR_PANELS = [
  {
    id: 'hero',
    image: 'appstore-01',
    title: 'Cartwise',
    body: 'The grocery list that remembers what things cost. Works offline, no account.',
  },
  {
    id: 'budget',
    image: 'appstore-02',
    title: 'Know the total before the till',
    body: 'Every price sits on the row and the budget bar moves as you shop.',
  },
  {
    id: 'vault',
    image: 'appstore-03',
    title: 'It remembers every price',
    body: 'Type a name you have bought before and the price, unit and aisle fill themselves in.',
  },
  {
    id: 'compare',
    image: 'appstore-04',
    title: 'Which shop is actually cheaper?',
    body: 'Compared only on what you have priced at both, and it says how much of the list that covers.',
  },
  {
    id: 'trips',
    image: 'appstore-05',
    title: 'Every trip, remembered',
    body: 'Finish a shop and it keeps what you bought and how it landed against your budget.',
  },
  {
    id: 'expiry',
    image: 'appstore-06',
    title: 'Know what to eat first',
    body: 'Expired, today, this week. Sorted so the thing that needs eating is at the top.',
  },
  {
    id: 'insights',
    image: 'appstore-07',
    title: 'See where the money went',
    body: 'Spend by aisle and by shop, and what the impulse buys really cost.',
  },
  {
    id: 'private',
    image: 'appstore-08',
    title: 'Stays on your phone',
    body: 'No account, no analytics. Your lists and prices never leave the device.',
  },
]

export const TOUR_SEEN_KEY = 'cartwise.tourSeen'

/** How long each slide holds before advancing itself. */
export const SLIDE_MS = 4200

/** Bounds-checked so a stored index from an older, longer tour cannot break it. */
export function clampPanel(index, total = TOUR_PANELS.length) {
  if (!Number.isFinite(index)) return 0
  return Math.min(Math.max(Math.trunc(index), 0), Math.max(total - 1, 0))
}

/**
 * Which slides to keep in the DOM: the current one plus its neighbours.
 *
 * Rendering all eight at once would have the browser decode 400 KB of images
 * before the first frame; this way it decodes the one being looked at and
 * quietly warms the next.
 */
export function windowAround(index, total = TOUR_PANELS.length) {
  const keep = new Set()
  for (let d = -1; d <= 1; d += 1) {
    const i = index + d
    if (i >= 0 && i < total) keep.add(i)
  }
  return keep
}

/** Public path for a panel image, respecting the app's base path. */
export function tourImage(panel, base = '/') {
  return `${base}tour/${panel.image}.webp`.replace(/\/{2,}/g, '/')
}
