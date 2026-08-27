// Backgrounds for a list: twelve gradients, or a photograph of your own.
//
// The gradients are deliberately soft, so the dark text of a card stays
// readable on every one, and they carry both themes so they can follow the
// light/dark setting the way nothing photographic can.
//
// A photo cannot promise any of that — the contrast problem is unsolvable in
// advance, because it depends on the picture. So a photo background is always
// laid under a scrim and never asked to sit behind body text: on the home card
// it takes white type over a dark wash, and on the list screen it sits behind
// the opaque cards rather than under them. See PHOTO in the stylesheet.

export const BACKGROUNDS = [
  { id: 'plain', label: 'Plain', light: 'var(--surface)', dark: 'var(--surface)' },
  { id: 'mint', label: 'Mint', light: 'linear-gradient(150deg,#e7f7ee,#cfeede)', dark: 'linear-gradient(150deg,#16302a,#102420)' },
  { id: 'sky', label: 'Sky', light: 'linear-gradient(150deg,#e8f2fd,#d3e6f9)', dark: 'linear-gradient(150deg,#16243a,#101a2b)' },
  { id: 'lilac', label: 'Lilac', light: 'linear-gradient(150deg,#f1ecfb,#e3daf6)', dark: 'linear-gradient(150deg,#251e38,#191428)' },
  { id: 'blush', label: 'Blush', light: 'linear-gradient(150deg,#fdeef1,#f8dde5)', dark: 'linear-gradient(150deg,#301c24,#22141a)' },
  { id: 'peach', label: 'Peach', light: 'linear-gradient(150deg,#fff0e2,#ffdfc6)', dark: 'linear-gradient(150deg,#332314,#2a1c10)' },
  { id: 'butter', label: 'Butter', light: 'linear-gradient(150deg,#fff8dd,#fdeeb6)', dark: 'linear-gradient(150deg,#2f2a12,#231f0d)' },
  { id: 'sage', label: 'Sage', light: 'linear-gradient(150deg,#eef3e6,#dde8cd)', dark: 'linear-gradient(150deg,#22281a,#181d12)' },
  { id: 'clay', label: 'Clay', light: 'linear-gradient(150deg,#f6eee7,#e8d8c9)', dark: 'linear-gradient(150deg,#2b221c,#1f1813)' },
  { id: 'slate', label: 'Slate', light: 'linear-gradient(150deg,#eef0f4,#dde1e9)', dark: 'linear-gradient(150deg,#20232b,#171920)' },
  { id: 'teal', label: 'Teal', light: 'linear-gradient(150deg,#e4f4f2,#c9e9e4)', dark: 'linear-gradient(150deg,#152e2c,#0f2220)' },
  { id: 'grape', label: 'Grape', light: 'linear-gradient(150deg,#f0e9f6,#ded0ec)', dark: 'linear-gradient(150deg,#26203a,#1a162a)' },
]

export const DEFAULT_BACKGROUND = 'plain'

export const BACKGROUND_BY_ID = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b]))

/** Marks a background as "the photo stored for this list" rather than a preset. */
export const PHOTO_BACKGROUND = 'photo'

export const isPhotoBackground = (id) => id === PHOTO_BACKGROUND

/**
 * A list made before backgrounds existed, or one naming a background we
 * dropped, falls back to plain rather than rendering as a blank card.
 *
 * A list set to `photo` whose picture has since been deleted — or failed to
 * load on this device — also falls back, so the card is never a grey hole.
 */
export function backgroundOf(cart, photo) {
  const id = cart?.background
  if (isPhotoBackground(id)) return photo ? PHOTO_BACKGROUND : DEFAULT_BACKGROUND
  return BACKGROUND_BY_ID[id] ? id : DEFAULT_BACKGROUND
}

/**
 * The CSS value for a background. Both themes are declared up front so the
 * caller can hand them to a custom property and let the stylesheet pick.
 *
 * A photo is the same picture in both, since a photograph has no dark variant;
 * the scrim over it is what changes.
 */
export function backgroundStyle(id, photo) {
  if (isPhotoBackground(id) && photo) {
    // Quotes matter: an unquoted data URL with a comma in it ends the value.
    const image = `url("${photo}") center / cover no-repeat`
    return { '--card-bg': image, '--card-bg-dark': image }
  }
  const bg = BACKGROUND_BY_ID[id] ?? BACKGROUND_BY_ID[DEFAULT_BACKGROUND]
  return { '--card-bg': bg.light, '--card-bg-dark': bg.dark }
}
