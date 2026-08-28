// Run with: npm test
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  boundsOf,
  distanceKm,
  formatDistance,
  isLocation,
  locatedStores,
  storesByDistance,
} from './geo.js'

// Real places, so the distances can be checked against something.
const CEBU = { lat: 10.3157, lon: 123.8854 }
const MANILA = { lat: 14.5995, lon: 120.9842 }
const NEARBY = { lat: 10.3200, lon: 123.8900 }

describe('isLocation', () => {
  it('accepts a real fix', () => {
    assert.equal(isLocation(CEBU), true)
  })

  it('rejects null island', () => {
    // 0,0 is in the Atlantic and is what a broken sensor returns.
    assert.equal(isLocation({ lat: 0, lon: 0 }), false)
  })

  it('rejects impossible coordinates', () => {
    assert.equal(isLocation({ lat: 91, lon: 0 }), false)
    assert.equal(isLocation({ lat: 0, lon: 181 }), false)
  })

  it('rejects half-written data', () => {
    for (const junk of [null, undefined, {}, { lat: 10 }, { lat: '10', lon: '123' }, { lat: NaN, lon: 1 }]) {
      assert.equal(isLocation(junk), false)
    }
  })
})

describe('distanceKm', () => {
  it('measures a known distance', () => {
    // Cebu to Manila is about 570 km as the crow flies.
    const km = distanceKm(CEBU, MANILA)
    assert.ok(km > 560 && km < 580, `got ${km}`)
  })

  it('measures a short one', () => {
    const km = distanceKm(CEBU, NEARBY)
    assert.ok(km > 0.5 && km < 1.0, `got ${km}`)
  })

  it('is zero for the same place', () => {
    assert.equal(Math.round(distanceKm(CEBU, CEBU)), 0)
  })

  it('is symmetric', () => {
    assert.ok(Math.abs(distanceKm(CEBU, MANILA) - distanceKm(MANILA, CEBU)) < 0.001)
  })

  it('is null when either end is missing', () => {
    assert.equal(distanceKm(CEBU, null), null)
    assert.equal(distanceKm(null, CEBU), null)
    assert.equal(distanceKm(CEBU, { lat: 0, lon: 0 }), null)
  })
})

describe('formatDistance', () => {
  it('rounds metres to fifty, because the fix is not better than that', () => {
    assert.equal(formatDistance(0.42), '400 m')
    assert.equal(formatDistance(0.43), '450 m')
  })

  it('gives one decimal under ten kilometres', () => {
    assert.equal(formatDistance(1.34), '1.3 km')
  })

  it('drops the decimal past ten, where a straight line stops meaning much', () => {
    assert.equal(formatDistance(23.6), '24 km')
  })

  it('says here rather than a tiny number', () => {
    assert.equal(formatDistance(0.02), 'here')
  })

  it('is null for nothing', () => {
    assert.equal(formatDistance(null), null)
    assert.equal(formatDistance(NaN), null)
  })
})

describe('storesByDistance', () => {
  const stores = [
    { id: 'far', name: 'Manila Shop', location: MANILA },
    { id: 'near', name: 'Cebu Shop', location: NEARBY },
    { id: 'unknown', name: 'Unlocated Shop' },
  ]

  it('puts the nearest first', () => {
    const order = storesByDistance(stores, CEBU).map((r) => r.store.id)
    assert.deepEqual(order, ['near', 'far', 'unknown'])
  })

  it('keeps shops with no location, at the end', () => {
    // They are still shops you use. Dropping them would make the list lie
    // about what you have.
    const rows = storesByDistance(stores, CEBU)
    assert.equal(rows.at(-1).store.id, 'unknown')
    assert.equal(rows.at(-1).km, null)
  })

  it('falls back to alphabetical when we do not know where we are', () => {
    const names = storesByDistance(stores, null).map((r) => r.store.name)
    assert.deepEqual(names, ['Cebu Shop', 'Manila Shop', 'Unlocated Shop'])
  })

  it('copes with no shops', () => {
    assert.deepEqual(storesByDistance([], CEBU), [])
  })
})

describe('locatedStores', () => {
  it('keeps only the ones that know where they are', () => {
    const stores = [{ location: CEBU }, {}, { location: { lat: 0, lon: 0 } }]
    assert.equal(locatedStores(stores).length, 1)
  })
})

describe('boundsOf', () => {
  it('frames several points', () => {
    const box = boundsOf([CEBU, NEARBY])
    assert.ok(box.south < CEBU.lat)
    assert.ok(box.north > NEARBY.lat)
    assert.ok(box.west < CEBU.lon)
    assert.ok(box.east > NEARBY.lon)
  })

  it('gives a single point some extent', () => {
    // Otherwise a map frames one building at maximum zoom.
    const box = boundsOf([CEBU])
    assert.ok(box.north - box.south > 0.005)
    assert.ok(box.east - box.west > 0.005)
  })

  it('ignores unusable points', () => {
    assert.deepEqual(boundsOf([{ lat: 0, lon: 0 }, null]), null)
  })

  it('is null for nothing to frame', () => {
    assert.equal(boundsOf([]), null)
    assert.equal(boundsOf(), null)
  })
})
