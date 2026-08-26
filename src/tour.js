// The in-app tour: the same story as the store panels, told with the app's
// own stickers and type rather than screenshots.
//
// Drawn rather than photographed on purpose. Eight screenshots would add
// roughly 700 KB to a 91 KB app, they would go stale the moment the UI
// changed, and they cannot follow the light/dark theme. Stickers and text
// cost almost nothing and always match what the user is actually looking at.

export const TOUR_PANELS = [
  {
    id: 'home',
    tone: 'violet',
    stickers: ['basket', 'banana', 'bread'],
    title: 'Everything in one place',
    body: 'Your lists, what you have saved, and anything about to go off — all on the first screen.',
  },
  {
    id: 'aisles',
    tone: 'green',
    demo: 'aisles',
    stickers: ['broccoli', 'carrot', 'apple'],
    title: 'Sorted by aisle',
    body: 'Type "bananas" and it lands in Produce. Sections follow the order you walk a shop, so you stop doubling back.',
  },
  {
    id: 'budget',
    demo: 'budget',
    tone: 'mint',
    stickers: ['cheese', 'egg'],
    title: 'Know the total before the till',
    body: 'Every price sits on the row and the bar moves as you shop. No surprises at the checkout.',
  },
  {
    id: 'vault',
    demo: 'vault',
    tone: 'violet',
    stickers: ['milk', 'can', 'jar'],
    title: 'It remembers every price',
    body: 'Add something you have bought before and the price, unit and aisle fill themselves in — from your shopping, not a guess.',
  },
  {
    id: 'compare',
    demo: 'compare',
    tone: 'rose',
    stickers: ['basket', 'pasta'],
    title: 'Which shop is cheaper',
    body: 'Compared only on the items you have priced at both, and it tells you how much of the list that covers. No flattering maths.',
  },
  {
    id: 'shopping',
    demo: 'shopping',
    tone: 'blue',
    stickers: ['drumstick', 'fish', 'bread'],
    title: 'Shopping mode',
    body: 'Bigger targets for one-handed use, picked-up items drop to the bottom, and nothing can be deleted by a stray tap.',
  },
  {
    id: 'scan',
    demo: 'scan',
    tone: 'violet',
    stickers: ['chips', 'bottle', 'cookie'],
    title: 'Scan it, or snap it',
    body: 'Scan a barcode and it fills itself in next time. Photograph a product and it becomes its own sticker.',
  },
  {
    id: 'trips',
    demo: 'trips',
    tone: 'rose',
    stickers: ['cheese', 'oil', 'yogurt'],
    title: 'Every trip, remembered',
    body: 'Finish a shop and it keeps what you bought and how it landed against your budget — then shows where the money actually goes.',
  },
  {
    id: 'expiry',
    demo: 'expiry',
    tone: 'amber',
    stickers: ['yogurt', 'milk', 'fish'],
    title: 'Eat it before it turns',
    body: 'Track what is in the fridge. Expired, today, this week — sorted so the thing that needs eating first is at the top.',
  },
  {
    id: 'private',
    tone: 'slate',
    stickers: ['basket'],
    title: 'It stays on your phone',
    body: 'No account needed, no analytics, and it works with no signal. Sign in only if you want to share a list with the people you live with.',
  },
]

export const TOUR_SEEN_KEY = 'cartwise.tourSeen'

/** Bounds-checked so a stored index from an older, longer tour cannot break it. */
export function clampPanel(index, total = TOUR_PANELS.length) {
  if (!Number.isFinite(index)) return 0
  return Math.min(Math.max(Math.trunc(index), 0), Math.max(total - 1, 0))
}
