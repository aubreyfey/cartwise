// Run with: npm test
//
// The failure path is the point of these. A silently swallowed write is the
// worst bug this app could have — the screen says the trip is saved, the next
// reload has never heard of it — so writeStored exists as ordinary callable
// code and these exercise it directly rather than reimplementing it.
import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  STORAGE_FAILED,
  readStored,
  removeStored,
  resetStorageWarnings,
  writeStored,
} from './useLocalStorage.js'

const realWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')

/** A localStorage that can be told to fail, and a window that records events. */
function fakeWindow({ failWith = null } = {}) {
  const store = new Map()
  const events = []

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => {
          if (failWith) {
            const e = new Error('refused')
            e.name = failWith
            throw e
          }
          store.set(k, v)
        },
        removeItem: (k) => store.delete(k),
      },
      // Node has CustomEvent, so the module's real dispatch path runs.
      dispatchEvent: (event) => {
        events.push(event)
        return true
      },
    },
  })

  return { store, events }
}

afterEach(() => {
  resetStorageWarnings()
  if (realWindow) Object.defineProperty(globalThis, 'window', realWindow)
  else delete globalThis.window
})

describe('writeStored', () => {
  it('writes JSON and reports success', () => {
    const { store } = fakeWindow()
    assert.deepEqual(writeStored('cartwise.carts', [{ id: 'a' }]), { ok: true })
    assert.equal(store.get('cartwise.carts'), '[{"id":"a"}]')
  })

  it('reports a full store rather than claiming success', () => {
    fakeWindow({ failWith: 'QuotaExceededError' })
    assert.deepEqual(writeStored('cartwise.carts', []), { ok: false, reason: 'full' })
  })

  it('tells a blocked store apart from a full one', () => {
    // Private browsing throws SecurityError, which is not the user deleting
    // photos to make room — the advice differs, so the reason has to.
    fakeWindow({ failWith: 'SecurityError' })
    assert.deepEqual(writeStored('cartwise.carts', []), { ok: false, reason: 'blocked' })
  })

  it('announces the failure so the app can put it on screen', () => {
    const { events } = fakeWindow({ failWith: 'QuotaExceededError' })
    writeStored('cartwise.purchases', [])
    assert.equal(events.length, 1)
    assert.equal(events[0].type, STORAGE_FAILED)
    assert.deepEqual(events[0].detail, { key: 'cartwise.purchases', reason: 'full' })
  })

  it('announces once per key, not once per keystroke', () => {
    // A full disk fails on every write; a banner re-firing forty times a
    // second helps nobody.
    const { events } = fakeWindow({ failWith: 'QuotaExceededError' })
    writeStored('cartwise.carts', [])
    writeStored('cartwise.carts', [1])
    writeStored('cartwise.carts', [1, 2])
    assert.equal(events.length, 1)
  })

  it('still announces a different key failing', () => {
    const { events } = fakeWindow({ failWith: 'QuotaExceededError' })
    writeStored('cartwise.carts', [])
    writeStored('cartwise.vault', [])
    assert.equal(events.length, 2)
  })

  it('does not throw when there is no storage at all', () => {
    delete globalThis.window
    assert.doesNotThrow(() => writeStored('anything', 1))
  })
})

describe('readStored', () => {
  it('returns the fallback for a missing key', () => {
    fakeWindow()
    assert.equal(readStored('cartwise.nope', 'fallback'), 'fallback')
  })

  it('returns the fallback rather than throwing on corrupt JSON', () => {
    const { store } = fakeWindow()
    store.set('cartwise.bad', '{not json')
    assert.deepEqual(readStored('cartwise.bad', []), [])
  })

  it('distinguishes a stored null from a missing key', () => {
    const { store } = fakeWindow()
    store.set('cartwise.maybe', 'null')
    assert.equal(readStored('cartwise.maybe', 'fallback'), null)
  })

  it('survives having no storage at all', () => {
    delete globalThis.window
    assert.equal(readStored('anything', 'fallback'), 'fallback')
  })
})

describe('removeStored', () => {
  it('removes a key', () => {
    const { store } = fakeWindow()
    store.set('cartwise.gone', '1')
    removeStored('cartwise.gone')
    assert.equal(store.has('cartwise.gone'), false)
  })

  it('does not throw without storage', () => {
    delete globalThis.window
    assert.doesNotThrow(() => removeStored('anything'))
  })
})
