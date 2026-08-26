// Original flat vector stickers — no third-party product art anywhere.
//
// Each is a 48×48 drawing. The "cutout" look comes from CSS: every path is
// painted stroke-first with a white stroke, so the shapes get a sticker
// border without needing a second copy of each path.

const P = {
  banana: (
    <>
      <path fill="#f7cf4a" d="M12 10c-2 12 4 26 20 28 8 1 8-4 3-5C22 31 18 21 19 11z" />
      <path fill="#e0ae2c" d="M32 38c8 1 8-4 3-5-4-1-7-2-9-4 3 5 6 8 6 9z" />
      <path fill="#8a6a2f" d="M11 8h4v5h-4z" />
    </>
  ),
  apple: (
    <>
      <path fill="#e05252" d="M24 12c7-4 16 0 16 11 0 12-8 19-12 19-2 0-3-1-4-1s-2 1-4 1c-4 0-12-7-12-19 0-11 9-15 16-11z" />
      <path fill="#4a8f3c" d="M24 13c0-5 3-8 8-8 0 5-3 8-8 8z" />
      <path fill="#6b4a2a" d="M23 6h2v7h-2z" />
    </>
  ),
  broccoli: (
    <>
      <circle cx="18" cy="16" r="8" fill="#4f9c3f" />
      <circle cx="30" cy="15" r="8" fill="#5cae49" />
      <circle cx="24" cy="23" r="8" fill="#468c38" />
      <path fill="#9dc47f" d="M21 26h6l2 16h-10z" />
    </>
  ),
  carrot: (
    <>
      <path fill="#ea8a33" d="M20 18l8-4 12 26-4 4z" />
      <path fill="#4a8f3c" d="M18 16l-8-6 10 2-2-8 6 8 4-6-2 10z" />
    </>
  ),
  tomato: (
    <>
      <circle cx="24" cy="27" r="14" fill="#dd4b45" />
      <path fill="#4a8f3c" d="M24 14l-7-5 6 2-1-6 4 5 4-5-1 6 6-2z" />
    </>
  ),
  leaf: (
    <>
      <path fill="#4f9c3f" d="M38 8C18 8 8 18 8 32c0 5 3 8 3 8S16 22 38 8z" />
      <path fill="#69b455" d="M38 8c0 20-12 30-24 30 0 0 4 4 10 4 12 0 16-14 14-34z" />
    </>
  ),
  bread: (
    <>
      <path fill="#d9a35d" d="M8 22c0-8 7-12 16-12s16 4 16 12v14a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" />
      <path fill="#c1874a" d="M14 16c2-2 5-3 10-3s8 1 10 3c-3-1-6-2-10-2s-7 1-10 2z" />
    </>
  ),
  baguette: (
    <>
      <path fill="#d9a35d" d="M9 36 33 9c3-3 8 1 5 5L14 41c-3 3-8-1-5-5z" />
      <path fill="#b9793e" d="m18 25 4 3m2-8 4 3m2-8 4 3" stroke="#b9793e" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  drumstick: (
    <>
      <path fill="#c4763f" d="M30 8c7 0 11 5 11 10 0 8-8 10-12 14l-7-7c4-4 6-12 8-17z" />
      <path fill="#e8d5b5" d="m21 25 7 7-9 9-3-1-1 4-4 1-1-4-4-1 1-3z" />
    </>
  ),
  fish: (
    <>
      <path fill="#5aa8c9" d="M8 24c6-8 14-11 22-11s14 5 14 11-6 11-14 11-16-3-22-11z" />
      <path fill="#3f89aa" d="M8 24 2 15v18z" />
      <circle cx="35" cy="21" r="2.5" fill="#1f4b5e" />
    </>
  ),
  milk: (
    <>
      <path fill="#eef3f8" d="M17 18h14v20a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
      <path fill="#dbe6f0" d="M19 8h10v10H19z" />
      <path fill="#5b8fd6" d="M17 26h14v7H17z" />
    </>
  ),
  egg: (
    <>
      <ellipse cx="24" cy="27" rx="13" ry="16" fill="#fdf6e6" />
      <ellipse cx="24" cy="30" rx="7" ry="6" fill="#f5c33b" />
    </>
  ),
  cheese: (
    <>
      <path fill="#f2c14e" d="M6 32 40 12v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <circle cx="16" cy="29" r="3" fill="#dba52f" />
      <circle cx="28" cy="26" r="2.5" fill="#dba52f" />
    </>
  ),
  yogurt: (
    <>
      <path fill="#f6f2ec" d="M13 18h22l-3 20a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" />
      <path fill="#c98bb4" d="M11 13h26v6H11z" />
    </>
  ),
  ice: (
    <>
      <path fill="#7fc4e8" d="M24 5v38M8 15l32 18M40 15 8 33" stroke="#7fc4e8" strokeWidth="5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="5" fill="#c8e9f8" />
    </>
  ),
  can: (
    <>
      <ellipse cx="24" cy="13" rx="12" ry="4" fill="#c3ccd6" />
      <path fill="#aab6c2" d="M12 13h24v22c0 3-5 5-12 5s-12-2-12-5z" />
      <path fill="#dd6b5b" d="M12 20h24v10H12z" />
    </>
  ),
  jar: (
    <>
      <path fill="#b06a3f" d="M13 20h22v16a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5z" />
      <path fill="#6d4425" d="M12 11h24v8H12z" />
    </>
  ),
  pasta: (
    <>
      <path fill="#3f7fbf" d="M14 8h20v34H14z" />
      <path fill="#f0d9a8" d="M18 14h12v22H18z" />
      <path fill="#d9b877" d="M20 14h2v22h-2zm5 0h2v22h-2zm5 0h-2v22h2z" />
    </>
  ),
  oil: (
    <>
      <path fill="#8fbf4a" d="M17 20h14v18a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
      <path fill="#6f9c34" d="M21 8h6v12h-6z" />
      <path fill="#4d6f22" d="M20 5h8v4h-8z" />
    </>
  ),
  chips: (
    <>
      <path fill="#e8873a" d="M12 10h24l-2 32H14z" />
      <path fill="#f3b06a" d="M17 18h14v12H17z" />
      <path fill="#c96a24" d="M12 10h24l-1 5H13z" />
    </>
  ),
  cookie: (
    <>
      <circle cx="24" cy="26" r="15" fill="#d2a05c" />
      <circle cx="19" cy="21" r="2.5" fill="#5e3a1c" />
      <circle cx="29" cy="24" r="2.5" fill="#5e3a1c" />
      <circle cx="22" cy="32" r="2.5" fill="#5e3a1c" />
    </>
  ),
  bottle: (
    <>
      <path fill="#8ecbe8" d="M17 19h14v19a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
      <path fill="#b7e0f2" d="M20 7h8v12h-8z" />
      <path fill="#3f89aa" d="M19 6h10v3H19z" />
    </>
  ),
  cup: (
    <>
      <path fill="#c96a4a" d="M12 14h22l-3 25a4 4 0 0 1-4 3h-8a4 4 0 0 1-4-3z" />
      <path fill="#f0e2d4" d="M14 20h18l-.5 5h-17z" />
    </>
  ),
  paper: (
    <>
      <path fill="#f2f2f5" d="M13 10h22v32H13z" />
      <ellipse cx="24" cy="10" rx="11" ry="4" fill="#dfe0e6" />
      <path fill="#c9cad2" d="M21 14h6v24h-6z" />
    </>
  ),
  spray: (
    <>
      <path fill="#7fbf8f" d="M16 18h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" />
      <path fill="#4f8f60" d="M20 10h7v8h-7z" />
      <path fill="#3c6b4a" d="M27 8h8v4h-8z" />
    </>
  ),
  basket: (
    <>
      <path fill="#8f7ac0" d="M6 18h36l-4 20a4 4 0 0 1-4 3H14a4 4 0 0 1-4-3z" />
      <path fill="#6d5aa0" d="M15 8h3v11h-3zm15 0h3v11h-3z" />
    </>
  ),
}

// name keyword -> sticker. Checked before the category fallback, so
// "olive oil" gets the bottle rather than a generic can.
const KEYWORDS = [
  [/banana/, 'banana'],
  [/apple/, 'apple'],
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
  [/frozen|ice/, 'ice'],
  [/pasta|spaghetti|linguine|noodle|macaroni/, 'pasta'],
  [/oil|vinegar/, 'oil'],
  [/jam|honey|peanut butter|spread|sauce/, 'jar'],
  [/chip|crisp|pretzel|popcorn|snack/, 'chips'],
  [/cookie|biscuit|chocolate|candy|sweet/, 'cookie'],
  [/coffee|tea|latte/, 'cup'],
  [/water|juice|soda|cola|beer|wine|drink|seltzer/, 'bottle'],
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

export function stickerFor(name = '', category = 'other') {
  const lower = name.toLowerCase()
  for (const [pattern, id] of KEYWORDS) {
    if (pattern.test(lower)) return id
  }
  return BY_CATEGORY[category] ?? 'basket'
}

export const STICKER_IDS = Object.keys(P)

export default function Sticker({ id, size = 28, tilt = 0, className = '' }) {
  const art = P[id] ?? P.basket
  return (
    <svg
      className={`sticker ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      {art}
    </svg>
  )
}
