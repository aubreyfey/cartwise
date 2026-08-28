// Sticker names and matching, kept apart from the drawings.
//
// The artwork lives in stickers.jsx because it is JSX; this file is plain
// JavaScript so tests can import it. Anything that references a sticker by
// name — the tour, the marketing panels, item rows — resolves it through here.

export const STICKER_IDS = [
  'banana', 'apple', 'broccoli', 'carrot', 'tomato', 'leaf',
  'mango', 'citrus', 'grapes', 'melon', 'berry', 'avocado', 'pineapple',
  'bread', 'baguette',
  'drumstick', 'fish',
  'milk', 'egg', 'cheese', 'yogurt',
  'ice',
  'can', 'jar', 'pasta', 'oil',
  'chips', 'cookie',
  'bottle', 'cup',
  'paper', 'spray',
  'basket',
]

// name keyword -> sticker. Checked before the category fallback, so
// "olive oil" gets the bottle rather than a generic tin.
//
// Order matters and so do word boundaries. These are substring tests, so
// "watermelon" used to match `water` and come back a drinks cup, and
// "pineapple" matched `apple`. Anything whose word is a prefix of another
// word is anchored with \b, and the compound fruit sit above the words they
// contain.
const KEYWORDS = [
  // Compound names first: each of these contains a shorter keyword below it.
  [/watermelon|honeydew|cantaloupe|\bmelon/, 'melon'],
  [/pineapple/, 'pineapple'],
  [/banana/, 'banana'],
  [/\bapple/, 'apple'],
  [/mango/, 'mango'],
  [/orange|lemon|lime|calamansi|dalandan|pomelo|citrus|grapefruit|mandarin/, 'citrus'],
  [/grape(?!fruit)|raisin/, 'grapes'],
  [/strawberr|blueberr|raspberr|blackberr|\bberry|berries|cherry|cherries/, 'berry'],
  [/avocado|guacamole/, 'avocado'],
  [/broccoli|cauliflower|cabbage/, 'broccoli'],
  [/carrot|parsnip/, 'carrot'],
  [/tomato/, 'tomato'],
  [/lettuce|spinach|kale|salad|greens|herb|basil/, 'leaf'],
  [/baguette|sourdough|roll|bun/, 'baguette'],
  [/bread|loaf|toast|bagel|muffin/, 'bread'],
  [/chicken|turkey|drumstick|wing|thigh/, 'drumstick'],
  [/fish|salmon|tuna|cod|prawn|shrimp/, 'fish'],
  [/milk|cream/, 'milk'],
  [/egg/, 'egg'],
  [/cheese|cheddar|mozzarella|parmesan|feta/, 'cheese'],
  [/yogurt|yoghurt|kefir/, 'yogurt'],
  [/frozen|\bice\b/, 'ice'],
  [/pasta|spaghetti|linguine|noodle|macaroni/, 'pasta'],
  [/oil|vinegar/, 'oil'],
  [/jam|honey|peanut butter|spread|sauce/, 'jar'],
  [/chip|crisp|pretzel|popcorn|snack/, 'chips'],
  [/cookie|biscuit|chocolate|candy|sweet/, 'cookie'],
  [/coffee|tea|latte/, 'cup'],
  [/\bwater|juice|soda|cola|beer|wine|drink|seltzer/, 'bottle'],
  [/paper|towel|tissue|toilet|napkin/, 'paper'],
  [/soap|detergent|cleaner|bleach|shampoo|spray/, 'spray'],
]

const BY_CATEGORY = {
  produce: 'leaf',
  bakery: 'bread',
  meat: 'drumstick',
  dairy: 'milk',
  frozen: 'ice',
  pantry: 'can',
  snacks: 'chips',
  drinks: 'bottle',
  household: 'paper',
  other: 'basket',
}

// The same twenty-six things as characters, for when the app is showing the
// device's own emoji instead of the drawn set. Every one of these is Unicode
// 12 or earlier, so nothing lands as a tofu box on a phone old enough to be
// running the app at all.
export const STICKER_EMOJI = {
  banana: '🍌',
  apple: '🍎',
  broccoli: '🥦',
  carrot: '🥕',
  tomato: '🍅',
  mango: '🥭',
  citrus: '🍊',
  grapes: '🍇',
  melon: '🍉',
  berry: '🍓',
  avocado: '🥑',
  pineapple: '🍍',
  leaf: '🥬',
  bread: '🍞',
  baguette: '🥖',
  drumstick: '🍗',
  fish: '🐟',
  milk: '🥛',
  egg: '🥚',
  cheese: '🧀',
  yogurt: '🥣',
  ice: '🧊',
  can: '🥫',
  jar: '🍯',
  pasta: '🍝',
  oil: '🫒',
  chips: '🍿',
  cookie: '🍪',
  bottle: '🥤',
  cup: '☕',
  paper: '🧻',
  spray: '🧴',
  basket: '🧺',
}

/** The character for a sticker id, falling back the way the artwork does. */
export function emojiFor(id) {
  return STICKER_EMOJI[id] ?? STICKER_EMOJI.basket
}

export function stickerFor(name = '', category = 'other') {
  const lower = String(name).toLowerCase()
  for (const [pattern, id] of KEYWORDS) {
    if (pattern.test(lower)) return id
  }
  return BY_CATEGORY[category] ?? 'basket'
}
