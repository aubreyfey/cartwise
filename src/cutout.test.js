// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  contentBounds,
  describeResult,
  estimateBackground,
  removeBackground,
  trimHalo,
} from './cutout.js'

/** Build a test image: solid background with a filled rectangle on top. */
function makeImage(width, height, bg, rect) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const inside =
        rect &&
        x >= rect.x &&
        x < rect.x + rect.width &&
        y >= rect.y &&
        y < rect.y + rect.height
      const c = inside ? rect.color : bg
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
      data[i + 3] = 255
    }
  }
  return data
}

const alphaAt = (data, width, x, y) => data[(y * width + x) * 4 + 3]

describe('estimateBackground', () => {
  it('reads the colour from the border, ignoring the middle', () => {
    const data = makeImage(20, 20, [250, 250, 250], {
      x: 6, y: 6, width: 8, height: 8, color: [10, 10, 200],
    })
    const bg = estimateBackground(data, 20, 20)
    assert.ok(Math.abs(bg.r - 250) < 3, `r was ${bg.r}`)
    assert.ok(Math.abs(bg.b - 250) < 3, `b was ${bg.b}`)
  })

  it('survives a one-pixel image without dividing by zero', () => {
    const data = makeImage(1, 1, [128, 64, 32], null)
    const bg = estimateBackground(data, 1, 1)
    assert.equal(bg.r, 128)
  })
})

describe('removeBackground', () => {
  it('clears the background and keeps the product', () => {
    const width = 24
    const height = 24
    const data = makeImage(width, height, [245, 245, 245], {
      x: 8, y: 8, width: 8, height: 8, color: [200, 30, 30],
    })

    const result = removeBackground(data, width, height, { tolerance: 30 })

    assert.equal(alphaAt(data, width, 0, 0), 0, 'corner cleared')
    assert.equal(alphaAt(data, width, 12, 12), 255, 'product kept')
    assert.equal(result.cleared, width * height - 64, 'everything but the square')
  })

  it('leaves a product that touches the edge attached', () => {
    // A bottle running off the bottom of the frame still has its top and
    // sides surrounded by background, so it must not be flood-filled away.
    const width = 20
    const height = 20
    const data = makeImage(width, height, [250, 250, 250], {
      x: 6, y: 10, width: 8, height: 10, color: [20, 90, 180],
    })

    removeBackground(data, width, height, { tolerance: 30 })
    assert.equal(alphaAt(data, width, 10, 15), 255, 'product still there')
    assert.equal(alphaAt(data, width, 1, 1), 0, 'background gone')
  })

  it('does not reach through the product to an enclosed area', () => {
    // The hole in the middle is background-coloured but sealed off by the
    // product, so a border flood fill cannot reach it.
    const width = 21
    const height = 21
    const data = makeImage(width, height, [250, 250, 250], {
      x: 5, y: 5, width: 11, height: 11, color: [30, 30, 30],
    })
    // punch a background-coloured hole in the middle of the dark square
    for (let y = 9; y < 12; y += 1) {
      for (let x = 9; x < 12; x += 1) {
        const i = (y * width + x) * 4
        data[i] = 250
        data[i + 1] = 250
        data[i + 2] = 250
      }
    }

    removeBackground(data, width, height, { tolerance: 30 })
    assert.equal(alphaAt(data, width, 10, 10), 255, 'enclosed hole survives')
  })

  it('clears nearly everything when the product matches its background', () => {
    const width = 16
    const height = 16
    const data = makeImage(width, height, [200, 200, 200], {
      x: 5, y: 5, width: 6, height: 6, color: [202, 201, 200],
    })
    const result = removeBackground(data, width, height, { tolerance: 40 })
    assert.equal(result.cleared, width * height)
  })

  it('respects tolerance', () => {
    const width = 16
    const height = 16
    const near = () =>
      makeImage(width, height, [240, 240, 240], {
        x: 6, y: 6, width: 4, height: 4, color: [210, 210, 210],
      })

    const tight = near()
    removeBackground(tight, width, height, { tolerance: 10 })
    assert.equal(alphaAt(tight, width, 7, 7), 255, 'tight tolerance keeps it')

    const loose = near()
    removeBackground(loose, width, height, { tolerance: 60 })
    assert.equal(alphaAt(loose, width, 7, 7), 0, 'loose tolerance eats it')
  })
})

describe('trimHalo', () => {
  it('shaves exactly one pixel off the edge', () => {
    const width = 12
    const height = 12
    const data = makeImage(width, height, [250, 250, 250], {
      x: 4, y: 4, width: 4, height: 4, color: [10, 10, 10],
    })
    removeBackground(data, width, height, { tolerance: 30 })
    trimHalo(data, width, height)

    assert.equal(alphaAt(data, width, 4, 4), 0, 'outer ring shaved')
    assert.equal(alphaAt(data, width, 5, 5), 255, 'inside kept')
  })
})

describe('contentBounds', () => {
  it('finds the box around what is left', () => {
    const width = 20
    const height = 20
    const data = makeImage(width, height, [250, 250, 250], {
      x: 6, y: 8, width: 5, height: 4, color: [10, 10, 200],
    })
    removeBackground(data, width, height, { tolerance: 30 })

    assert.deepEqual(contentBounds(data, width, height), {
      x: 6, y: 8, width: 5, height: 4,
    })
  })

  it('returns null when nothing survived', () => {
    const width = 8
    const height = 8
    const data = makeImage(width, height, [250, 250, 250], null)
    removeBackground(data, width, height, { tolerance: 30 })
    assert.equal(contentBounds(data, width, height), null)
  })
})

describe('describeResult', () => {
  const bounds = { x: 1, y: 1, width: 2, height: 2 }

  it('flags a photo where nothing could be removed', () => {
    assert.deepEqual(describeResult({ cleared: 10, total: 1000 }, bounds), {
      ok: false, reason: 'busy',
    })
  })

  it('flags a photo where the product vanished too', () => {
    assert.deepEqual(describeResult({ cleared: 999, total: 1000 }, bounds), {
      ok: false, reason: 'faint',
    })
    assert.deepEqual(describeResult({ cleared: 1000, total: 1000 }, null), {
      ok: false, reason: 'empty',
    })
  })

  it('accepts a normal cut-out', () => {
    assert.equal(describeResult({ cleared: 700, total: 1000 }, bounds).ok, true)
  })
})
