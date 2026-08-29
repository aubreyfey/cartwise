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


// Illustrated scenes. Same contract as the gradients above — soft enough for
// dark text, and both themes declared — but composed rather than flat, for
// anyone who wants a list that looks like somewhere rather than a colour.
export const SCENE_BACKGROUNDS = [
  {
    id: 'sunrise',
    label: 'Sunrise',
    scene: true,
    light:
      'radial-gradient(ellipse 140% 42% at 18% 112%, #ecd9b6 0%, transparent 62%),' +
      'radial-gradient(ellipse 120% 38% at 88% 114%, #e2c9a2 0%, transparent 62%),' +
      'radial-gradient(circle at 52% 74%, #ffd9a0 0%, #ffe9c9 26%, transparent 52%),' +
      'linear-gradient(180deg,#fff3e4 0%,#ffe6cd 58%,#f8dcc0 100%)',
    dark:
      'radial-gradient(ellipse 140% 42% at 18% 112%, #3a2f22 0%, transparent 62%),' +
      'radial-gradient(ellipse 120% 38% at 88% 114%, #2f261c 0%, transparent 62%),' +
      'radial-gradient(circle at 52% 74%, #6b4a28 0%, #4a3320 30%, transparent 55%),' +
      'linear-gradient(180deg,#2a1f16 0%,#20180f 100%)',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    scene: true,
    light:
      'radial-gradient(ellipse 150% 40% at 40% 114%, #d8cbe4 0%, transparent 60%),' +
      'radial-gradient(circle at 74% 30%, #ffe0d2 0%, transparent 42%),' +
      'linear-gradient(180deg,#efe4f3 0%,#fbdfd8 62%,#fde8d8 100%)',
    dark:
      'radial-gradient(ellipse 150% 40% at 40% 114%, #2a2338 0%, transparent 60%),' +
      'radial-gradient(circle at 74% 30%, #4a2e35 0%, transparent 44%),' +
      'linear-gradient(180deg,#221c31 0%,#2c1e26 100%)',
  },
  {
    id: 'meadow',
    label: 'Meadow',
    scene: true,
    light:
      'radial-gradient(ellipse 150% 46% at 30% 116%, #cfe6bb 0%, transparent 64%),' +
      'radial-gradient(ellipse 60% 22% at 22% 26%, #ffffff 0%, transparent 70%),' +
      'radial-gradient(ellipse 44% 16% at 72% 18%, #ffffff 0%, transparent 70%),' +
      'linear-gradient(180deg,#e6f2fb 0%,#e9f4e6 66%,#dcecd2 100%)',
    dark:
      'radial-gradient(ellipse 150% 46% at 30% 116%, #1c2a1a 0%, transparent 64%),' +
      'radial-gradient(ellipse 60% 22% at 22% 26%, #232b33 0%, transparent 70%),' +
      'linear-gradient(180deg,#151e28 0%,#16241a 100%)',
  },
  {
    id: 'sea',
    label: 'Sea',
    scene: true,
    light:
      'linear-gradient(180deg,transparent 0 54%, #cfe6ee 54%, #b9dbe8 100%),' +
      'radial-gradient(circle at 68% 34%, #fff0cf 0%, transparent 26%),' +
      'linear-gradient(180deg,#e3f1f8 0%,#eef7fa 54%)',
    dark:
      'linear-gradient(180deg,transparent 0 54%, #14252e 54%, #0f1d25 100%),' +
      'radial-gradient(circle at 68% 34%, #3d3a2a 0%, transparent 28%),' +
      'linear-gradient(180deg,#16222c 0%,#1a2732 54%)',
  },
  {
    id: 'night',
    label: 'Night',
    scene: true,
    light:
      'radial-gradient(circle at 78% 22%, #fdf6dd 0%, #fdf6dd 3.2%, transparent 3.6%),' +
      'radial-gradient(circle at 24% 18%, #ffffff 0%, #ffffff 0.7%, transparent 1%),' +
      'radial-gradient(circle at 46% 32%, #ffffff 0%, #ffffff 0.6%, transparent 0.9%),' +
      'radial-gradient(circle at 62% 12%, #ffffff 0%, #ffffff 0.5%, transparent 0.8%),' +
      'radial-gradient(ellipse 150% 40% at 50% 116%, #cfd3e6 0%, transparent 62%),' +
      'linear-gradient(180deg,#e8eaf6 0%,#dfe3f2 100%)',
    dark:
      'radial-gradient(circle at 78% 22%, #f2ecd0 0%, #f2ecd0 3.2%, transparent 3.6%),' +
      'radial-gradient(circle at 24% 18%, #ffffff 0%, #ffffff 0.7%, transparent 1%),' +
      'radial-gradient(circle at 46% 32%, #ffffff 0%, #ffffff 0.6%, transparent 0.9%),' +
      'radial-gradient(circle at 62% 12%, #ffffff 0%, #ffffff 0.5%, transparent 0.8%),' +
      'radial-gradient(ellipse 150% 40% at 50% 116%, #191d2e 0%, transparent 62%),' +
      'linear-gradient(180deg,#131728 0%,#0e111f 100%)',
  },
  {
    id: 'blossom',
    label: 'Blossom',
    scene: true,
    light:
      'radial-gradient(circle at 16% 22%, #fbd0dc 0%, transparent 12%),' +
      'radial-gradient(circle at 34% 12%, #fcdde6 0%, transparent 9%),' +
      'radial-gradient(circle at 82% 28%, #fbd0dc 0%, transparent 11%),' +
      'radial-gradient(circle at 66% 8%, #fce1e9 0%, transparent 8%),' +
      'linear-gradient(180deg,#fdeef3 0%,#fbe3ec 100%)',
    dark:
      'radial-gradient(circle at 16% 22%, #3a2029 0%, transparent 12%),' +
      'radial-gradient(circle at 34% 12%, #331c24 0%, transparent 9%),' +
      'radial-gradient(circle at 82% 28%, #3a2029 0%, transparent 11%),' +
      'radial-gradient(circle at 66% 8%, #331c24 0%, transparent 8%),' +
      'linear-gradient(180deg,#2a1720 0%,#1f111a 100%)',
  },
]

export const DEFAULT_BACKGROUND = 'plain'

/** Flat colours and scenes together: everything a list can be set to. */
export const ALL_BACKGROUNDS = [...BACKGROUNDS, ...SCENE_BACKGROUNDS]

export const BACKGROUND_BY_ID = Object.fromEntries(ALL_BACKGROUNDS.map((b) => [b.id, b]))

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
export function backgroundStyle(id, photo, name = '--card-bg') {
  if (isPhotoBackground(id) && photo) {
    // Quotes matter: an unquoted data URL with a comma in it ends the value.
    const image = `url("${photo}") center / cover no-repeat`
    return { [name]: image, [`${name}-dark`]: image }
  }
  const bg = BACKGROUND_BY_ID[id] ?? BACKGROUND_BY_ID[DEFAULT_BACKGROUND]
  return { [name]: bg.light, [`${name}-dark`]: bg.dark }
}

/**
 * The background behind the products, chosen separately from the header's.
 *
 * Its own field and its own button: the sparkle sits on the header card, the
 * gallery button sits with the list controls, and each changes the thing it is
 * next to. One background driven by two buttons was two buttons doing one job.
 *
 * Same fallback rule as the header — a list set to `photo` whose picture has
 * gone falls back to plain rather than leaving a grey hole.
 */
export function itemsBackgroundOf(cart, photo) {
  const id = cart?.itemsBackground
  if (isPhotoBackground(id)) return photo ? PHOTO_BACKGROUND : DEFAULT_BACKGROUND
  return BACKGROUND_BY_ID[id] ? id : DEFAULT_BACKGROUND
}
