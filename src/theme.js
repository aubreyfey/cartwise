// Appearance: an accent colour, a paper tint, a background texture, and how
// strongly the last two are laid on.
//
// All of it lands as CSS custom properties on the root element, so nothing has
// to re-render when it changes — the stylesheet already refers to --primary
// and --bg everywhere, and the texture is a gradient rather than an image, so
// it costs no download and scales to any screen.
//
// Anything set inline on the root beats the stylesheet's dark-mode block, so
// every value that differs between schemes has to be chosen here in
// JavaScript and re-applied when the system flips. See watchColorScheme.

const ACCENT_KEY = 'cartwise.accent'
const TEXTURE_KEY = 'cartwise.texture'
const PAPER_KEY = 'cartwise.paper'
const TEXTURE_STRENGTH_KEY = 'cartwise.textureStrength'
const SATURATION_KEY = 'cartwise.saturation'

export const ACCENTS = [
  { id: 'violet', label: 'Violet', color: '#7b5ea7', soft: '#f0eaf8', softDark: '#2c2440' },
  { id: 'forest', label: 'Forest', color: '#3f8a5c', soft: '#e6f4ec', softDark: '#1a3227' },
  { id: 'ocean', label: 'Ocean', color: '#2f6fa8', soft: '#e6f0f9', softDark: '#152a3d' },
  { id: 'rose', label: 'Rose', color: '#b8546e', soft: '#fceaef', softDark: '#331a22' },
  { id: 'amber', label: 'Amber', color: '#b57a1c', soft: '#fbf0da', softDark: '#332714' },
  { id: 'teal', label: 'Teal', color: '#2c8079', soft: '#e2f2f0', softDark: '#153029' },
  { id: 'slate', label: 'Slate', color: '#5c6478', soft: '#eceef3', softDark: '#242833' },
]

export const DEFAULT_ACCENT = 'violet'

// Drawn with gradients, so a texture is a few hundred bytes of CSS rather
// than a tiling image to download and cache.
export const TEXTURES = [
  { id: 'none', label: 'Plain' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'paper', label: 'Paper' },
  { id: 'weave', label: 'Weave' },
  { id: 'stripe', label: 'Stripe' },
]

export const DEFAULT_TEXTURE = 'none'

// The paper the app is printed on. Kept within a hair of white so body text
// keeps its contrast — a tint you can name is already too strong to read on.
// Each carries its own dark-mode counterpart, warmed or cooled the same way.
export const PAPERS = [
  { id: 'white', label: 'White', light: '#ffffff', dark: '#08080a' },
  { id: 'bone', label: 'Bone', light: '#fbfbf9', dark: '#0b0b0d' },
  { id: 'blush', label: 'Blush', light: '#fdf7f6', dark: '#110d0e' },
  { id: 'rose', label: 'Rose', light: '#fdf5f8', dark: '#120d10' },
  { id: 'peach', label: 'Peach', light: '#fdf6f0', dark: '#120e0a' },
  { id: 'sand', label: 'Sand', light: '#fbf8f0', dark: '#100f0a' },
  { id: 'butter', label: 'Butter', light: '#fdfbea', dark: '#101009' },
  { id: 'mint', label: 'Mint', light: '#f4faf6', dark: '#08100b' },
]

export const DEFAULT_PAPER = 'bone'

// Both sliders are 0-100. The texture default lands on the 7% ink that reading
// tests settled on; 4% could not be seen at all and 16% fought the content.
export const DEFAULT_TEXTURE_STRENGTH = 40
export const DEFAULT_SATURATION = 100

// The most ink a texture may use at the top of the slider. Past this the
// pattern stops being a ground and starts being content.
const MAX_TEXTURE_INK = 18

const ACCENT_BY_ID = Object.fromEntries(ACCENTS.map((a) => [a.id, a]))
const PAPER_BY_ID = Object.fromEntries(PAPERS.map((p) => [p.id, p]))
const TEXTURE_IDS = new Set(TEXTURES.map((t) => t.id))

export const accentOf = (id) => (ACCENT_BY_ID[id] ? id : DEFAULT_ACCENT)
export const textureOf = (id) => (TEXTURE_IDS.has(id) ? id : DEFAULT_TEXTURE)
export const paperOf = (id) => (PAPER_BY_ID[id] ? id : DEFAULT_PAPER)

/**
 * A slider position: a whole number of percent, or the default if it is not
 * one.
 *
 * The type check earns its keep. Number(null) and Number('') are both 0, which
 * is a perfectly finite number, so a missing or blank stored value would slide
 * the texture to invisible and report that as the user's own choice.
 */
export function levelOf(value, fallback) {
  const numeric =
    typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
  if (!numeric) return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** How much ink the texture layer gets, as a CSS percentage. */
export const textureInk = (strength) =>
  `${((levelOf(strength, DEFAULT_TEXTURE_STRENGTH) / 100) * MAX_TEXTURE_INK).toFixed(2)}%`

const clampByte = (n) => Math.min(255, Math.max(0, Math.round(n)))

function hexToRgb(hex) {
  const s = String(hex).replace('#', '')
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

const toHex = (n) => clampByte(n).toString(16).padStart(2, '0')

/**
 * Drain the colour out of a hex towards its own grey, so 0 is greyscale and
 * 100 leaves it untouched.
 *
 * The target is the colour's own luminance rather than a fixed grey: mixing
 * every accent towards one mid-grey drags pale colours darker and dark ones
 * lighter, so the app would change brightness while claiming to change only
 * saturation.
 */
export function desaturate(hex, level) {
  const amount = levelOf(level, DEFAULT_SATURATION)
  if (amount >= 100) return hex
  const { r, g, b } = hexToRgb(hex)
  const grey = 0.299 * r + 0.587 * g + 0.114 * b
  const t = amount / 100
  return `#${toHex(grey + (r - grey) * t)}${toHex(grey + (g - grey) * t)}${toHex(
    grey + (b - grey) * t,
  )}`
}

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const loadAccent = () => accentOf(read(ACCENT_KEY, DEFAULT_ACCENT))
export const loadTexture = () => textureOf(read(TEXTURE_KEY, DEFAULT_TEXTURE))
export const loadPaper = () => paperOf(read(PAPER_KEY, DEFAULT_PAPER))
export const loadTextureStrength = () =>
  levelOf(read(TEXTURE_STRENGTH_KEY, DEFAULT_TEXTURE_STRENGTH), DEFAULT_TEXTURE_STRENGTH)
export const loadSaturation = () =>
  levelOf(read(SATURATION_KEY, DEFAULT_SATURATION), DEFAULT_SATURATION)

/** Everything the look is made of, read from storage in one go. */
export const loadLook = () => ({
  accent: loadAccent(),
  texture: loadTexture(),
  paper: loadPaper(),
  textureStrength: loadTextureStrength(),
  saturation: loadSaturation(),
})

/**
 * Apply to the document. Called on load and on every change; setting a custom
 * property is cheap and avoids re-rendering the tree just to repaint a colour.
 */
const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches

export function applyTheme(look = {}) {
  if (typeof document === 'undefined') return
  const {
    accent: accentId,
    texture: textureId,
    paper: paperId,
    textureStrength,
    saturation,
  } = look

  const accent = ACCENT_BY_ID[accentOf(accentId)]
  const paper = PAPER_BY_ID[paperOf(paperId)]
  const dark = prefersDark()
  const root = document.documentElement

  // An inline custom property beats the stylesheet's dark-mode block, so the
  // right variant has to be chosen here. Setting the light one unconditionally
  // put pale lilac panels on a dark background.
  const primary = desaturate(accent.color, saturation)
  root.style.setProperty('--primary', primary)
  root.style.setProperty(
    '--primary-soft',
    desaturate(dark ? accent.softDark : accent.soft, saturation),
  )
  root.style.setProperty('--bg', dark ? paper.dark : paper.light)
  root.style.setProperty('--texture-ink', textureInk(textureStrength))
  root.dataset.texture = textureOf(textureId)

  // Keep the browser chrome in step with the app.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', primary)
}

/**
 * Re-apply when the system flips between light and dark, since the soft
 * variant is resolved in JavaScript and CSS cannot do it for us.
 */
export function watchColorScheme(onChange) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => onChange()
  query.addEventListener('change', handler)
  return () => query.removeEventListener('change', handler)
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Applies for this session regardless.
  }
}

export function saveAccent(id) {
  const next = accentOf(id)
  write(ACCENT_KEY, next)
  return next
}

export function saveTexture(id) {
  const next = textureOf(id)
  write(TEXTURE_KEY, next)
  return next
}

export function savePaper(id) {
  const next = paperOf(id)
  write(PAPER_KEY, next)
  return next
}

export function saveTextureStrength(value) {
  const next = levelOf(value, DEFAULT_TEXTURE_STRENGTH)
  write(TEXTURE_STRENGTH_KEY, next)
  return next
}

export function saveSaturation(value) {
  const next = levelOf(value, DEFAULT_SATURATION)
  write(SATURATION_KEY, next)
  return next
}

/** Back to the look the app ships with, for when a slider has gone somewhere odd. */
export function defaultLook() {
  return {
    accent: DEFAULT_ACCENT,
    texture: DEFAULT_TEXTURE,
    paper: DEFAULT_PAPER,
    textureStrength: DEFAULT_TEXTURE_STRENGTH,
    saturation: DEFAULT_SATURATION,
  }
}
