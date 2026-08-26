// Appearance: an accent colour and a background texture.
//
// Both are CSS custom properties set on the root element, so nothing has to
// re-render when they change — the stylesheet already refers to --primary
// everywhere, and the texture is a gradient rather than an image, so it costs
// no download and scales to any screen.

const ACCENT_KEY = 'cartwise.accent'
const TEXTURE_KEY = 'cartwise.texture'

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

const ACCENT_BY_ID = Object.fromEntries(ACCENTS.map((a) => [a.id, a]))
const TEXTURE_IDS = new Set(TEXTURES.map((t) => t.id))

export const accentOf = (id) => (ACCENT_BY_ID[id] ? id : DEFAULT_ACCENT)
export const textureOf = (id) => (TEXTURE_IDS.has(id) ? id : DEFAULT_TEXTURE)

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

/**
 * Apply to the document. Called on load and on every change; setting a custom
 * property is cheap and avoids re-rendering the tree just to repaint a colour.
 */
export function applyTheme(accentId, textureId) {
  if (typeof document === 'undefined') return
  const accent = ACCENT_BY_ID[accentOf(accentId)]
  const root = document.documentElement

  root.style.setProperty('--primary', accent.color)
  root.style.setProperty('--primary-soft', accent.soft)
  root.style.setProperty('--primary-soft-dark', accent.softDark)
  root.dataset.texture = textureOf(textureId)

  // Keep the browser chrome in step with the app.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', accent.color)
}

export function saveAccent(id) {
  const next = accentOf(id)
  try {
    window.localStorage.setItem(ACCENT_KEY, JSON.stringify(next))
  } catch {
    // Applies for this session regardless.
  }
  return next
}

export function saveTexture(id) {
  const next = textureOf(id)
  try {
    window.localStorage.setItem(TEXTURE_KEY, JSON.stringify(next))
  } catch {
    // Applies for this session regardless.
  }
  return next
}
