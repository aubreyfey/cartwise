// Turn a photo of a product into a die-cut sticker.
//
// The approach: a product photographed on a counter or table sits against a
// background that touches the edges of the frame and is roughly uniform. So
// flood-fill inward from every border pixel, clearing anything close enough
// in colour to the background, and whatever survives is the product.
//
// This is not segmentation by machine learning — it can't tell a red packet
// from a red tablecloth. It's chosen because it runs offline in a few
// milliseconds with no model to download, and because the failure mode is
// obvious on screen and fixable by moving the product to a plainer surface
// or nudging the tolerance.
//
// Everything here works on a plain RGBA Uint8ClampedArray so it can be tested
// without a browser.

/**
 * Squared distance in RGB. Squared because we only ever compare it against
 * another distance, and skipping the square root keeps the flood fill quick
 * over a few hundred thousand pixels.
 */
export function colorDistanceSq(data, i, r, g, b) {
  const dr = data[i] - r
  const dg = data[i + 1] - g
  const db = data[i + 2] - b
  return dr * dr + dg * dg + db * db
}

/**
 * Average colour of the border ring, which is our guess at the background.
 * Uses a band a few pixels deep rather than the outermost line alone, so a
 * single dark edge pixel or a bit of vignetting doesn't skew it.
 */
export function estimateBackground(data, width, height, depth = 3) {
  let r = 0
  let g = 0
  let b = 0
  let n = 0

  const sample = (x, y) => {
    const i = (y * width + x) * 4
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
    n += 1
  }

  const band = Math.max(1, Math.min(depth, Math.floor(Math.min(width, height) / 2)))
  for (let d = 0; d < band; d += 1) {
    for (let x = d; x < width - d; x += 1) {
      sample(x, d)
      sample(x, height - 1 - d)
    }
    for (let y = d + 1; y < height - 1 - d; y += 1) {
      sample(d, y)
      sample(width - 1 - d, y)
    }
  }

  if (n === 0) return { r: 255, g: 255, b: 255 }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

/**
 * Clear the background to transparent, in place.
 *
 * `tolerance` is a 0–255 colour radius. Returns how many pixels were cleared,
 * which the caller uses to notice the two useless outcomes: nothing removed
 * (background too busy) and everything removed (product too close in colour
 * to its background).
 */
export function removeBackground(data, width, height, { tolerance = 40, background } = {}) {
  const bg = background ?? estimateBackground(data, width, height)
  const limit = tolerance * tolerance * 3
  const total = width * height

  const seen = new Uint8Array(total)
  // A plain array used as a stack beats a shift()-based queue here; shift()
  // is O(n) and this runs over every pixel.
  const stack = []

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (seen[p]) return
    seen[p] = 1
    stack.push(p)
  }

  for (let x = 0; x < width; x += 1) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y)
    push(width - 1, y)
  }

  let cleared = 0
  while (stack.length > 0) {
    const p = stack.pop()
    const i = p * 4
    if (colorDistanceSq(data, i, bg.r, bg.g, bg.b) > limit) continue

    data[i + 3] = 0
    cleared += 1

    const x = p % width
    const y = (p - x) / width
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }

  return { cleared, total, background: bg }
}

/**
 * Shave one pixel off the edge of what's left.
 *
 * Photo edges blend into the background, so the ring of pixels right at the
 * boundary is a mix of product and background colour. Left alone it reads as
 * a dirty halo once the sticker sits on a white card.
 */
export function trimHalo(data, width, height) {
  const alpha = new Uint8ClampedArray(width * height)
  for (let p = 0; p < width * height; p += 1) alpha[p] = data[p * 4 + 3]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x
      if (alpha[p] === 0) continue

      const transparentNeighbour =
        (x > 0 && alpha[p - 1] === 0) ||
        (x < width - 1 && alpha[p + 1] === 0) ||
        (y > 0 && alpha[p - width] === 0) ||
        (y < height - 1 && alpha[p + width] === 0)

      if (transparentNeighbour) data[p * 4 + 3] = 0
    }
  }
}

/** Bounding box of the non-transparent pixels, or null if nothing is left. */
export function contentBounds(data, width, height, { alphaThreshold = 8 } = {}) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/**
 * How the cut-out went, so the UI can say something useful instead of showing
 * an empty square. Thresholds are deliberately wide — this only distinguishes
 * "obviously broken" from "worth looking at".
 */
export function describeResult({ cleared, total }, bounds) {
  const ratio = cleared / total
  if (!bounds) return { ok: false, reason: 'empty' }
  if (ratio < 0.08) return { ok: false, reason: 'busy' }
  if (ratio > 0.985) return { ok: false, reason: 'faint' }
  return { ok: true, reason: null }
}
