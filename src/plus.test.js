// Run with: npm test
import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  PLUS_FEATURES,
  PLUS_KEY,
  PLUS_PRICE,
  canUsePhoto,
  isPlus,
  photoGateState,
  setPlus,
  startTrial,
  trialState,
  TRIAL_KEY,
} from './plus.js'

const realWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')

function fakeWindow({ throws = false } = {}) {
  const store = new Map()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (k) => {
          if (throws) throw new Error('blocked')
          return store.has(k) ? store.get(k) : null
        },
        setItem: (k, v) => {
          if (throws) throw new Error('blocked')
          store.set(k, v)
        },
      },
    },
  })
  return store
}

afterEach(() => {
  if (realWindow) Object.defineProperty(globalThis, 'window', realWindow)
  else delete globalThis.window
})

describe('isPlus', () => {
  it('is false by default', () => {
    fakeWindow()
    assert.equal(isPlus(), false)
  })

  it('reads a stored entitlement', () => {
    const store = fakeWindow()
    store.set(PLUS_KEY, 'true')
    assert.equal(isPlus(), true)
  })

  it('is false, not an error, when storage is blocked', () => {
    // Private browsing must not accidentally hand out a subscription, nor
    // crash the picker.
    fakeWindow({ throws: true })
    assert.equal(isPlus(), false)
  })

  it('is false for anything that is not exactly "true"', () => {
    const store = fakeWindow()
    for (const junk of ['1', 'yes', 'TRUE', '', 'false']) {
      store.set(PLUS_KEY, junk)
      assert.equal(isPlus(), false, junk)
    }
  })
})

describe('setPlus', () => {
  it('round-trips', () => {
    fakeWindow()
    setPlus(true)
    assert.equal(isPlus(), true)
    setPlus(false)
    assert.equal(isPlus(), false)
  })

  it('does not throw when storage refuses', () => {
    fakeWindow({ throws: true })
    assert.doesNotThrow(() => setPlus(true))
  })
})

describe('canUsePhoto', () => {
  it('lets a subscriber use one', () => {
    assert.equal(canUsePhoto({ plus: true }), true)
  })

  it('keeps working for a list that already has a photo', () => {
    // Photo backgrounds were free before Plus existed. Taking away something
    // that worked yesterday is the fastest way to lose the users you have.
    assert.equal(canUsePhoto({ plus: false, existingPhoto: 'data:image/webp;base64,xx' }), true)
  })

  it('is closed for a new list without a subscription', () => {
    assert.equal(canUsePhoto({ plus: false }), false)
    assert.equal(canUsePhoto({}), false)
    assert.equal(canUsePhoto(), false)
  })

  it('does not treat an empty string as an existing photo', () => {
    assert.equal(canUsePhoto({ plus: false, existingPhoto: '' }), false)
  })
})

describe('photoGateState', () => {
  it('is open for a subscriber', () => {
    assert.equal(photoGateState({ plus: true }), 'open')
  })

  it('marks a pre-existing photo as grandfathered, not as open', () => {
    // The distinction matters: the list keeps its picture, but a
    // non-subscriber is not handed unlimited new ones.
    assert.equal(photoGateState({ plus: false, existingPhoto: 'data:x' }), 'grandfathered')
  })

  it('is locked otherwise', () => {
    assert.equal(photoGateState({}), 'locked')
  })

  it('prefers open over grandfathered when both apply', () => {
    assert.equal(photoGateState({ plus: true, existingPhoto: 'data:x' }), 'open')
  })
})

describe('the offer itself', () => {
  it('states the price the app tells people it charges', () => {
    assert.equal(PLUS_PRICE.intro, 9)
    assert.equal(PLUS_PRICE.renewal, 99)
    assert.equal(PLUS_PRICE.renewalPeriod, 'year')
  })

  it('marks features that are not built yet as not live', () => {
    // A paywall must not list something it cannot deliver. Sync and community
    // prices need a server nobody has stood up.
    const live = PLUS_FEATURES.filter((f) => f.live).map((f) => f.id)
    assert.deepEqual(live, ['photos'])
  })

  it('gives every feature a label worth reading', () => {
    for (const f of PLUS_FEATURES) {
      assert.ok(f.label && f.label.length > 8, f.id)
    }
  })
})

describe('the free week', () => {
  const DAY = 86_400_000
  const NOW = 1_760_000_000_000

  it('is unused before anyone starts it', () => {
    fakeWindow()
    assert.equal(trialState(NOW).state, 'unused')
    assert.equal(isPlus(NOW), false)
  })

  it('grants Plus while it runs', () => {
    fakeWindow()
    assert.equal(startTrial(NOW), true)
    assert.equal(trialState(NOW).state, 'active')
    assert.equal(isPlus(NOW), true)
  })

  it('counts down the days left', () => {
    fakeWindow()
    startTrial(NOW)
    assert.equal(trialState(NOW).daysLeft, 7)
    assert.equal(trialState(NOW + 2 * DAY).daysLeft, 5)
    // Never says "0 days left" while it is still running.
    assert.equal(trialState(NOW + 6.5 * DAY).daysLeft, 1)
  })

  it('expires after seven days and takes Plus with it', () => {
    fakeWindow()
    startTrial(NOW)
    assert.equal(trialState(NOW + 7 * DAY).state, 'over')
    assert.equal(isPlus(NOW + 7 * DAY), false)
  })

  it('cannot be started twice', () => {
    // The start date stays in storage after it expires, which is what stops
    // a second tap handing out another week.
    fakeWindow()
    assert.equal(startTrial(NOW), true)
    assert.equal(startTrial(NOW + 30 * DAY), false)
    assert.equal(trialState(NOW + 30 * DAY).state, 'over')
  })

  it('keeps a subscriber past the trial ending', () => {
    fakeWindow()
    startTrial(NOW)
    setPlus(true)
    assert.equal(isPlus(NOW + 90 * DAY), true)
  })

  it('ignores a start date that is not a real number', () => {
    const store = fakeWindow()
    store.set(TRIAL_KEY, 'yesterday')
    assert.equal(trialState(NOW).state, 'unused')
  })

  it('does not crash when storage is blocked', () => {
    fakeWindow({ throws: true })
    assert.doesNotThrow(() => startTrial(NOW))
    assert.equal(trialState(NOW).state, 'unused')
    assert.equal(isPlus(NOW), false)
  })
})
